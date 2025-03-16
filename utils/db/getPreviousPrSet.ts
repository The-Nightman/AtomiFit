import { SetPersonalRecord } from "@/types/sets";
import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "@/database/schema";
import { and, asc, desc, eq } from "drizzle-orm";

/**
 * Retrieves the previous personal record set for a given exercise and number of repetitions.
 *
 * @async
 * @param {ExpoSQLiteDatabase<Record<string, never>>} db - The ExpoSQLiteDatabase instance to query.
 * @param {number} exerciseId - The ID of the exercise to retrieve the previous personal record set for.
 * @param {number} reps - The number of repetitions to match for the previous personal record set.
 * @returns {Promise<SetPersonalRecord | null>} A promise that resolves to the previous personal record set, or null if no matching set is found.
 */
export const getPreviousPrSet = async (
  db: ExpoSQLiteDatabase<Record<string, never>>,
  exerciseId: number,
  reps: number
): Promise<SetPersonalRecord | null> => {
  const [previousPrSet]: (SetPersonalRecord | null)[] = await db
    .select({
      id: schema.setsData.id,
      exercise_id: schema.setsData.exercise_id,
      date: schema.setsData.date,
      weight: schema.setsData.weight,
      reps: schema.setsData.reps,
      distance: schema.setsData.distance,
      time: schema.setsData.time,
      notes: schema.setsData.notes,
      weight_unit: schema.setsData.weight_unit,
      distance_unit: schema.setsData.distance_unit,
      personal_record: schema.personalRecords,
    })
    .from(schema.setsData)
    .leftJoin(
      schema.personalRecords,
      eq(schema.setsData.id, schema.personalRecords.set_id)
    )
    .where(
      and(
        eq(schema.setsData.exercise_id, exerciseId),
        eq(schema.setsData.reps, reps),
        eq(schema.personalRecords.set_id, schema.setsData.id)
      )
    )
    .orderBy(
      desc(schema.setsData.date),
      asc(schema.setsData.weight),
      asc(schema.setsData.id)
    );

  return previousPrSet;
};
