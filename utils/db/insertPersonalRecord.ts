import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "@/database/schema";

/**
 * Inserts a personal record into the database.
 *
 * @async
 * @param {ExpoSQLiteDatabase<Record<string, never>>} db - The Expo SQLite database instance.
 * @param {number} setId - The ID of the set.
 * @param {number} exerciseId - The ID of the exercise.
 * @returns {Promise<void>}
 */
export const insertPersonalRecord = async (
  db: ExpoSQLiteDatabase<Record<string, never>>,
  setId: number,
  exerciseId: number
): Promise<void> => {
  await db.insert(schema.personalRecords).values({
    set_id: setId,
    exercise_id: exerciseId,
  });
};
