/**
 * src/lib/mock-db.ts
 *
 * Tiny in-memory mock DB for uploads and orders.
 * Useful for local development and testing before wiring real storage/payment.
 *
 * NOTE: This is an ephemeral in-memory store. Data will be lost when the process exits.
 */

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
function computePriceCentsForUploads(uploads: UploadRecord[]): number {
  const minPerFile = 100; // 100 cents = $1.00 per file minimum
  const centsPerMB = 50; // 50 cents per MB
  let total = 0;
  for (const u of uploads) {
    const sizeMb = Math.max(0.001, u.size / (1024 * 1024));
    const price = Math.max(minPerFile, Math.ceil(sizeMb * centsPerMB));
    total += price;
  }
  return total;
}

class MockDB {
  private uploads = new Map<string, UploadRecord>();
  private orders = new Map<string, OrderRecord>();

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
    return rec;
  }

  getUpload(id: string): UploadRecord | undefined {
    return this.uploads.get(id);
  }

  listUploads(): UploadRecord[] {
    return Array.from(this.uploads.values());
  }

  setUploadStatus(id: string, status: UploadStatus): UploadRecord | undefined {
    const u = this.uploads.get(id);
    if (!u) return undefined;
    u.status = status;
    this.uploads.set(id, u);
    return u;
  }

  deleteUpload(id: string): boolean {
    return this.uploads.delete(id);
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
    return rec;
  }

  getOrder(id: string): OrderRecord | undefined {
    return this.orders.get(id);
  }

  listOrders(): OrderRecord[] {
    return Array.from(this.orders.values());
  }

  updateOrderStatus(id: string, status: OrderStatus): OrderRecord | undefined {
    const o = this.orders.get(id);
    if (!o) return undefined;
    o.status = status;
    o.updatedAt = nowIso();
    this.orders.set(id, o);
    return o;
  }

  setOrderPaymentRef(id: string, paymentRef: string): OrderRecord | undefined {
    const o = this.orders.get(id);
    if (!o) return undefined;
    o.paymentRef = paymentRef;
    o.updatedAt = nowIso();
    this.orders.set(id, o);
    return o;
  }

  // Simple cleanup for uploads older than TTL that are not associated with paid orders
  cleanupExpiredUploads(ttlMs = 1000 * 60 * 60 * 24): number {
    const cutoff = Date.now() - ttlMs;
    let removed = 0;
    for (const [id, u] of this.uploads.entries()) {
      const created = new Date(u.createdAt).getTime();
      if (created < cutoff && u.status === "uploaded") {
        // Check if upload is referenced by any non-cancelled order
        const referenced = Array.from(this.orders.values()).some((o) =>
          o.uploadIds.includes(id),
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
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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

  // Reset / testing helpers
  clearAll(): void {
    this.uploads.clear();
    this.orders.clear();
  }

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
