import { Client, createClient } from "@libsql/client";

export type UploadStatus = "uploaded" | "deleted" | "expired";
export type OrderStatus =
  | "created"
  | "awaiting_payment"
  | "payment_pending"
  | "paid"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type UploadRecord = {
  id: string;
  filename: string;
  size: number;
  mime: string;
  status: UploadStatus;
  createdAt: string;
  data?: string; // Base64 encoded file data
  metadata?: Record<string, unknown>;
};

export type OrderRecord = {
  id: string;
  uploadIds: string[];
  userId?: string | null;
  totalAmountCents: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  paymentRef?: string | null;
  notes?: string;
  result?: Record<string, unknown> | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function computePriceCentsForUploads(uploadCount: number): number {
  const pricePerFile = 100; // $1.00 per file
  return uploadCount * pricePerFile || 100;
}

class TursoDB {
  private client: Client;

  constructor() {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error(
        "❌ Missing Turso env vars: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set"
      );
    }

    this.client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  async initTables() {
    try {
      // Create uploads table with all columns
      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS uploads (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          size INTEGER NOT NULL,
          mime TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          metadata TEXT,
          data TEXT
        );
      `);

      await this.client.execute(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          uploadIds TEXT NOT NULL,
          userId TEXT,
          totalAmountCents INTEGER NOT NULL,
          currency TEXT NOT NULL,
          status TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          paymentRef TEXT,
          notes TEXT,
          result TEXT
        );
      `);

      // Check if data column exists, add if missing
      try {
        const result = await this.client.execute(`PRAGMA table_info(uploads)`);
        const hasDataColumn = (result.rows as Array<{ name: string }>).some((row) => row.name === 'data');
        
        if (!hasDataColumn) {
          await this.client.execute(`ALTER TABLE uploads ADD COLUMN data TEXT`);
          console.log("✅ Added data column to uploads table");
        }
      } catch (e) {
        console.warn("Could not check/add data column:", e);
      }

      // Create performance indexes (idempotent)
      try {
        await this.client.execute(`CREATE INDEX IF NOT EXISTS idx_orders_user_updated ON orders (userId, updatedAt)`);
        await this.client.execute(`CREATE INDEX IF NOT EXISTS idx_orders_paymentRef ON orders (paymentRef)`);
        await this.client.execute(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)`);
        await this.client.execute(`CREATE INDEX IF NOT EXISTS idx_uploads_created ON uploads (createdAt)`);
      } catch (e) {
        console.warn("Index creation warning:", e);
      }

      console.log("✅ Tables ensured");
    } catch (error) {
      console.error("❌ Failed to initialize tables:", error);
      throw error;
    }
  }

  async query(sql: string, params: any[] = []) {
    return this.client.execute({ sql, args: params });
  }

  // Uploads
  async createUpload(params: {
    filename: string;
    size: number;
    mime: string;
    metadata?: Record<string, unknown>;
  }): Promise<UploadRecord> {
    const id = uid("upl");
    const rec: UploadRecord = {
      id,
      filename: params.filename,
      size: params.size,
      mime: params.mime,
      status: "uploaded",
      createdAt: nowIso(),
      metadata: params.metadata ?? {},
    };

    await this.client.execute(
      `INSERT INTO uploads (id, filename, size, mime, status, createdAt, metadata, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        rec.id,
        rec.filename,
        rec.size,
        rec.mime,
        rec.status,
        rec.createdAt,
        JSON.stringify(rec.metadata),
      ]
    );

    return rec;
  }

  async getUpload(id: string): Promise<UploadRecord | undefined> {
    const result = await this.client.execute(
      `SELECT * FROM uploads WHERE id = ?`,
      [id]
    );

    const row = result.rows[0];
    if (!row) return undefined;

    return {
      id: row.id as string,
      filename: row.filename as string,
      size: row.size as number,
      mime: row.mime as string,
      status: row.status as UploadStatus,
      createdAt: row.createdAt as string,
      data: (row as any).data as string | undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : {},
    };
  }

  async listUploads(): Promise<UploadRecord[]> {
    const result = await this.client.execute(`SELECT * FROM uploads`);

    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      filename: row.filename as string,
      size: row.size as number,
      mime: row.mime as string,
      status: row.status as UploadStatus,
      createdAt: row.createdAt as string,
      data: row.data as string | undefined,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata as string) : (row.metadata as Record<string, unknown> | undefined) || {},
    }));
  }

  async setUploadStatus(
    id: string,
    status: UploadStatus
  ): Promise<UploadRecord | undefined> {
    await this.client.execute(`UPDATE uploads SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);
    return this.getUpload(id);
  }

  async setUploadData(id: string, dataBase64: string): Promise<UploadRecord | undefined> {
    await this.client.execute(
      `UPDATE uploads SET data = ? WHERE id = ?`,
      [dataBase64, id]
    );
    return this.getUpload(id);
  }

  async deleteUpload(id: string): Promise<boolean> {
    const result = await this.client.execute(
      `DELETE FROM uploads WHERE id = ?`,
      [id]
    );
    return result.rowsAffected > 0;
  }

  // Orders
  async createOrder(params: {
    uploadIds: string[];
    userId?: string | null;
    currency?: string;
    notes?: string;
  }): Promise<OrderRecord> {
    const id = uid("ord");
    const totalAmountCents = computePriceCentsForUploads(
      params.uploadIds.length
    );

    const rec: OrderRecord = {
      id,
      uploadIds: params.uploadIds,
      userId: params.userId ?? null,
      totalAmountCents,
      currency: params.currency ?? "USD",
      status: "awaiting_payment",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      paymentRef: null,
      notes: params.notes ?? "",
    };

    await this.client.execute(
      `INSERT INTO orders (id, uploadIds, userId, totalAmountCents, currency, status, createdAt, updatedAt, paymentRef, notes, result)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rec.id,
        JSON.stringify(rec.uploadIds),
        rec.userId || null,
        rec.totalAmountCents,
        rec.currency,
        rec.status,
        rec.createdAt,
        rec.updatedAt,
        rec.paymentRef || null,
        rec.notes || "",
        null,
      ]
    );

    return rec;
  }

  async getOrder(id: string): Promise<OrderRecord | undefined> {
    const result = await this.client.execute(
      `SELECT * FROM orders WHERE id = ?`,
      [id]
    );

    const row = result.rows[0];
    if (!row) return undefined;

    return {
      id: row.id as string,
      uploadIds: JSON.parse(row.uploadIds as string),
      userId: row.userId as string | null,
      totalAmountCents: row.totalAmountCents as number,
      currency: row.currency as string,
      status: row.status as OrderStatus,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      paymentRef: row.paymentRef as string | null,
      notes: row.notes as string,
      result: row.result ? JSON.parse(row.result as string) : null,
    };
  }

  async listOrders(): Promise<OrderRecord[]> {
    const result = await this.client.execute(`SELECT * FROM orders`);

    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      uploadIds: JSON.parse(row.uploadIds as string),
      userId: (row.userId as string) || null,
      totalAmountCents: row.totalAmountCents as number,
      currency: row.currency as string,
      status: row.status as OrderStatus,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
      paymentRef: (row.paymentRef as string) || null,
      notes: (row.notes as string) || "",
      result: row.result ? JSON.parse(row.result as string) : null,
    }));
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus
  ): Promise<OrderRecord | undefined> {
    await this.client.execute(
      `UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?`,
      [status, nowIso(), id]
    );
    return this.getOrder(id);
  }

  async setOrderPaymentRef(
    id: string,
    paymentRef: string
  ): Promise<OrderRecord | undefined> {
    await this.client.execute(
      `UPDATE orders SET paymentRef = ?, updatedAt = ? WHERE id = ?`,
      [paymentRef, nowIso(), id]
    );
    return this.getOrder(id);
  }

  async updateOrderResult(
    id: string,
    result: Record<string, unknown>
  ): Promise<void> {
    await this.client.execute(
      `UPDATE orders SET result = ?, updatedAt = ? WHERE id = ?`,
      [JSON.stringify(result), nowIso(), id]
    );
  }

  async setOrderResult(
    id: string,
    result: Record<string, unknown>
  ): Promise<OrderRecord | undefined> {
    await this.updateOrderResult(id, result);
    return this.getOrder(id);
  }

  async updateOrderUser(
    id: string,
    userId: string
  ): Promise<OrderRecord | undefined> {
    await this.client.execute(
      `UPDATE orders SET userId = ?, updatedAt = ? WHERE id = ?`,
      [userId, nowIso(), id]
    );
    return this.getOrder(id);
  }

  async clearAll(): Promise<void> {
    await this.client.execute(`DELETE FROM uploads`);
    await this.client.execute(`DELETE FROM orders`);
  }
}

// Export singleton instance
export const tursoDB = new TursoDB();
export default tursoDB;
