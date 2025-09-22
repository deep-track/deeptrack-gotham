import tursoDB from "./turso-db";

let isInitialized = false;

export async function ensureDbInitialized() {
  if (!isInitialized) {
    try {
      await tursoDB.initTables();
      isInitialized = true;
      console.log("✅ Database initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
      throw error;
    }
  }
}
