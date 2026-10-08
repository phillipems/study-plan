import { db } from "@/infrastructure/database/database";
import type { Goal } from "./goal";

const goals = db.table<Goal, string>("goals");

export async function addGoal(goal: Goal): Promise<void> {
  await goals.add(goal);
}

/** Most recent first. */
export function listGoals(): Promise<Goal[]> {
  return goals.orderBy("createdAt").reverse().toArray();
}
