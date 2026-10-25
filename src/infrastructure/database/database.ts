import Dexie from "dexie";

// Single IndexedDB database of the application. This file owns the schema
// history: table names and indexes only. Row types live in the features.
export const db = new Dexie("study-plan");

db.version(1).stores({
  goals: "id, createdAt",
});

// Adds subjects. A subject lists its goals in goalIds (multi-entry index), so
// it can be looked up by goal. Existing goals are kept as they are.
db.version(2).stores({
  goals: "id, createdAt",
  subjects: "id, createdAt, *goalIds",
});
