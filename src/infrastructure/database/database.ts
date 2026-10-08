import Dexie from "dexie";

// Single IndexedDB database of the application. This file owns the schema
// history: table names and indexes only. Row types live in the features.
export const db = new Dexie("study-plan");

db.version(1).stores({
  goals: "id, createdAt",
});
