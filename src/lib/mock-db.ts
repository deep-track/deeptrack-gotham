/**
 * src/lib/mock-db.ts
 *
 * Tiny in-memory mock DB for uploads and orders.
 * Useful for local development and testing before wiring real storage/payment.
 *
 * NOTE: This is an ephemeral in-memory store. Data will be lost when the process exits.
 */
import Database from "better-sqlite3";
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
  size: number; // bytes
  mime: string;
  s3Key?: string | null;
  status: UploadStatus;
  createdAt: string; // ISO
  metadata?: Record<string, unknown>;
};

/**
 * OrderRecord now includes an optional `result` field where
 * background processing results (or result metadata) can be stored.
 */
export type OrderRecord = {
  id: string;
  uploadIds: string[];
  userId?: string | null;
  totalAmountCents: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  // optional provider/payment refs
  paymentRef?: string | null;
  notes?: string;
  result?: Record<string, unknown> | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix = "id"): string {
  // Lightweight unique id generator suitable for mock DB
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

/**
 * Default pricing function used by the mock DB.
 * - Ensures a minimum price per file,
 * - Adds a size-based component.
 *
 * Returns price in cents.
 */
// 100 cents = $1.00 per file
function computePriceCentsForUploads(uploads: UploadRecord[]): number {
  const pricePerFile = 100;
  return uploads.length * pricePerFile || 100;
}

class MockDB {
  private uploads = new Map<string, UploadRecord>();
  private orders = new Map<string, OrderRecord>();
  private db: Database.Database;

  constructor(filename = "app.db") {
    this.db = new Database(filename);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS uploads (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        size INTEGER NOT NULL,
        mime TEXT NOT NULL,
        s3Key TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        metadata TEXT
      );

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
  }
  // Uploads
  createUpload(params: {
    filename: string;
    size: number;
    mime: string;
    s3Key?: string | null;
    metadata?: Record<string, unknown>;
  }): UploadRecord {
    const id = uid("upl");
    const rec: UploadRecord = {
      id,
      filename: params.filename,
      size: params.size,
      mime: params.mime,
      s3Key: params.s3Key ?? null,
      status: "uploaded",
      createdAt: nowIso(),
      metadata: params.metadata ?? {},
    };
    this.uploads.set(id, rec);

    this.db
      .prepare(
        `INSERT INTO uploads (id, filename, size, mime, s3Key, status, createdAt, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        rec.id,
        rec.filename,
        rec.size,
        rec.mime,
        rec.s3Key,
        rec.status,
        rec.createdAt,
        JSON.stringify(rec.metadata)
      );

    return rec;
  }

  getUpload(id: string): UploadRecord | undefined {
    const row = this.db
      .prepare(`SELECT * FROM uploads WHERE id = ?`)
      .get(id) as
      | {
          id: string;
          filename: string;
          size: number;
          mime: string;
          s3Key?: string | null;
          status: UploadStatus;
          createdAt: string;
          metadata?: string;
        }
      | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      filename: row.filename,
      size: row.size,
      mime: row.mime,
      s3Key: row.s3Key,
      status: row.status,
      createdAt: row.createdAt,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    };
  }

  listUploads(): UploadRecord[] {
    return this.db
      .prepare(`SELECT * FROM uploads`)
      .all()
      .map((row: any) => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
      }));
  }

  setUploadStatus(id: string, status: UploadStatus): UploadRecord | undefined {
    this.db
      .prepare(`UPDATE uploads SET status = ? WHERE id = ?`)
      .run(status, id);
    return this.getUpload(id);
  }

  deleteUpload(id: string): boolean {
    const res = this.db.prepare(`DELETE FROM uploads WHERE id = ?`).run(id);
    return res.changes > 0;
  }

  // Orders
  createOrder(params: {
    uploadIds: string[];
    userId?: string | null;
    currency?: string;
    notes?: string;
  }): OrderRecord {
    const id = uid("ord");
    const uploads: UploadRecord[] = params.uploadIds
      .map((id) => this.uploads.get(id))
      .filter(Boolean) as UploadRecord[];

    const totalAmountCents = computePriceCentsForUploads(uploads);
    console.log(totalAmountCents);
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

    this.orders.set(id, rec);
    this.db
      .prepare(
        `INSERT INTO orders (id, uploadIds, userId, totalAmountCents, currency, status, createdAt, updatedAt, paymentRef, notes, result)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        rec.id,
        JSON.stringify(rec.uploadIds),
        rec.userId,
        rec.totalAmountCents,
        rec.currency,
        rec.status,
        rec.createdAt,
        rec.updatedAt,
        rec.paymentRef,
        rec.notes,
        null
      );
    return rec;
  }

  getOrder(id: string): OrderRecord | undefined {
    const row = this.db
      .prepare(`SELECT * FROM orders WHERE id = ?`)
      .get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      uploadIds: JSON.parse(row.uploadIds),
      result: row.result ? JSON.parse(row.result) : null,
    };
  }

  listOrders(): OrderRecord[] {
    return this.db
      .prepare(`SELECT * FROM orders`)
      .all()
      .map((row: any) => ({
        ...row,
        uploadIds: JSON.parse(row.uploadIds),
        result: row.result ? JSON.parse(row.result) : null,
      }));
  }

  updateOrderStatus(id: string, status: OrderStatus): OrderRecord | undefined {
    this.db
      .prepare(`UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?`)
      .run(status, nowIso(), id);
    return this.getOrder(id);
  }

  setOrderPaymentRef(id: string, paymentRef: string): OrderRecord | undefined {
    this.db
      .prepare(`UPDATE orders SET paymentRef = ?, updatedAt = ? WHERE id = ?`)
      .run(paymentRef, nowIso(), id);
    return this.getOrder(id);
  }

  updateOrderResult(id: string, result: Record<string, unknown>): void {
    this.db
      .prepare(`UPDATE orders SET result = ?, updatedAt = ? WHERE id = ?`)
      .run(JSON.stringify(result), nowIso(), id);
  }

  setOrderResult(
    id: string,
    result: Record<string, unknown>
  ): OrderRecord | undefined {
    this.updateOrderResult(id, result);
    return this.getOrder(id);
  }

  updateOrderUser(id: string, userId: string): OrderRecord | undefined {
    this.db
      .prepare(`UPDATE orders SET userId = ?, updatedAt = ? WHERE id = ?`)
      .run(userId, nowIso(), id);
    return this.getOrder(id);
  }

  clearAll(): void {
    this.db.exec(`DELETE FROM uploads; DELETE FROM orders;`);
  }
  // setOrderPaymentRef(id: string, paymentRef: string): OrderRecord | undefined {
  //   const o = this.orders.get(id);
  //   if (!o) return undefined;
  //   o.paymentRef = paymentRef;
  //   o.updatedAt = nowIso();
  //   this.orders.set(id, o);
  //   return o;
  // }

  // Simple cleanup for uploads older than TTL that are not associated with paid orders
  cleanupExpiredUploads(ttlMs = 1000 * 60 * 60 * 24): number {
    const cutoff = Date.now() - ttlMs;
    let removed = 0;
    for (const [id, u] of this.uploads.entries()) {
      const created = new Date(u.createdAt).getTime();
      if (created < cutoff && u.status === "uploaded") {
        // Check if upload is referenced by any non-cancelled order
        const referenced = Array.from(this.orders.values()).some((o) =>
          o.uploadIds.includes(id)
        );
        if (!referenced) {
          this.uploads.delete(id);
          removed++;
        } else {
          // mark expired but keep if referenced (depends on desired policy)
          u.status = "expired";
          this.uploads.set(id, u);
        }
      }
    }
    return removed;
  }

  // Utility: mark order as paid and trigger background processing.
  // This is intentionally a simulation for local/dev: when an order is marked paid
  // we transition it to 'paid' and then start processing asynchronously.
  // In production this should be driven by your worker/queue and webhook logic.
  markOrderPaid(id: string, paymentRef?: string): OrderRecord | undefined {
    const o = this.orders.get(id);
    if (!o) return undefined;
    o.paymentRef = paymentRef ?? o.paymentRef;
    o.status = "paid";
    o.updatedAt = nowIso();
    this.orders.set(id, o);

    // Start background processing asynchronously (idempotent)
    // We schedule it with setTimeout to simulate a background worker.
    // If processing is already started or completed, startProcessing will be a no-op.
    setTimeout(() => {
      // swallow errors inside async simulation
      try {
        this.startProcessing(id);
      } catch (err) {
        // log but do not throw
         
        console.error("startProcessing simulation failed for order", id, err);
      }
    }, 100); // small delay to allow webhook handling to finish

    return o;
  }

  /**
   * startProcessing
   *
   * Simulates background processing for an order:
   * - marks order 'processing'
   * - waits a simulated duration per upload
   * - marks order 'completed' and stores a simple `result` object
   *
   * This method is idempotent: calling it multiple times will not restart the job
   * if the order is already processing or completed.
   */
  startProcessing(id: string): OrderRecord | undefined {
    const o = this.orders.get(id);
    if (!o) return undefined;

    // Do not start if already processing or completed
    if (o.status === "processing" || o.status === "completed") {
      return o;
    }

    // Ensure the order is marked processing
    o.status = "processing";
    o.updatedAt = nowIso();
    this.orders.set(id, o);

    // Simulate processing duration: base + per-upload time
    const baseMs = 1000; // 1s base
    const perUploadMs = 1500; // 1.5s per upload
    const totalMs = baseMs + o.uploadIds.length * perUploadMs;

    // Simulate work asynchronously
    setTimeout(() => {
      try {
        const updated = this.orders.get(id);
        if (!updated) return;

        // Build a simple result object: for each upload include a pseudo result key
        const outputs = (updated.uploadIds || []).map((uplId) => {
          return {
            uploadId: uplId,
            resultUrl: `mock://results/${id}/${uplId}`,
            processedAt: new Date().toISOString(),
            summary: `Processed ${uplId}`,
          };
        });

        updated.result = {
          processedAt: new Date().toISOString(),
          outputs,
          note: "This is simulated processing output (mock)",
        };
        updated.status = "completed";
        updated.updatedAt = nowIso();
        this.orders.set(id, updated);
      } catch (err) {
         
        console.error("Error during simulated processing for order", id, err);
        const failed = this.orders.get(id);
        if (failed) {
          failed.status = "failed";
          failed.updatedAt = nowIso();
          this.orders.set(id, failed);
        }
      }
    }, totalMs);

    return o;
  }

  // // Reset / testing helpers
  // clearAll(): void {
  //   this.uploads.clear();
  //   this.orders.clear();
  // }

  seedSampleData(): void {
    this.clearAll();
    const u1 = this.createUpload({
      filename: "sample1.jpg",
      size: 200_000,
      mime: "image/jpeg",
    });
    const u2 = this.createUpload({
      filename: "audio1.wav",
      size: 2_000_000,
      mime: "audio/wav",
    });
    this.createOrder({ uploadIds: [u1.id, u2.id], userId: "user_anon" });
  }
}

/**
 * Export a singleton mock DB instance for convenience.
 * You can also import MockDB class and create your own instance in tests.
 */
export const mockDb = new MockDB();
export default mockDb;
