import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";

/**
 * Deletes a personal record from the database based on the provided set ID.
 *
 * @async
 * @param {ExpoSQLiteDatabase<Record<string, never>>} db - The Expo SQLite database instance.
 * @param {number} setId - The ID of the set to delete from the personal records table.
 * @returns {Promise<void>}
 */
export const deletePersonalRecord = async (
  db: ExpoSQLiteDatabase<Record<string, never>>,
  setId: number
): Promise<void> => {
  await db
    .delete(schema.personalRecords)
    .where(eq(schema.personalRecords.set_id, setId));
};
