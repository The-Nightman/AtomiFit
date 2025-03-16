import { and, asc, desc, eq, ne } from "drizzle-orm";
import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "@/database/schema";
import { SetPersonalRecord } from "@/types/sets";

interface PrevPrSet {
  set_id: number;
  exercise_id: number;
  set_reps: number;
}

/**
 * Inserts the next best set into the personal records if it meets the criteria.
 *
 * This function searches for the next best set with the same exercise_id and set_reps as the previous personal record set,
 * but with a different set_id. It orders the results by weight in descending order, and by date and id in ascending order,
 * to find the most recent but earliest set that matches the criteria. If a matching set is found and it is not already in the personal records,
 * it inserts the set into the personal records.
 *
 * @async 
 * @param {ExpoSQLiteDatabase<Record<string, never>>} db - The database instance to perform the operations on.
 * @param {PrevPrSet} prevPrSet - The previous personal record set containing set_id, exercise_id, and set_reps.
 * @param {number} id - The ID of the current set to exclude from the search.
 * @returns {Promise<void>}
 */
export const insertNextBestSet = async (
  db: ExpoSQLiteDatabase<Record<string, never>>,
  prevPrSet: PrevPrSet,
  id: number
): Promise<void> => {
  // Search for the next best set with the same reps criteria
  const [nextBestSet]: ({ id: number; exercise_id: number; weight: number | null; date: string; personal_record: SetPersonalRecord['personal_record'] } | null)[] = await db
    .select({
      id: schema.setsData.id,
      exercise_id: schema.setsData.exercise_id,
      weight: schema.setsData.weight,
      date: schema.setsData.date,
      personal_record: schema.personalRecords,
    })
    .from(schema.setsData)
    .leftJoin(
      schema.personalRecords,
      eq(schema.setsData.id, schema.personalRecords.set_id)
    )
    .where(
      and(
        eq(schema.setsData.exercise_id, prevPrSet.exercise_id),
        eq(schema.setsData.reps, prevPrSet.set_reps!),
        ne(schema.setsData.id, id)
      )
    )
    /* Order by weight descending and date & id ascending to get the first set matching the criteria on the most recent date
     * Note: If the next matching set is in the future it will be matched
       Example output:
       [
         {
           "date": "2025-02-28T00:00:00.000Z",
           "id": 234,
           "reps": 6,
           "weight": 87.5,
         },
         {
           "date": "2025-02-28T00:00:00.000Z",
           "id": 250,
           "reps": 6,
           "weight": 87.5,
         },
         {
           "date": "2025-02-10T00:00:00.000Z",
           "id": 143,
           "reps": 6,
           "weight": 85,
         },
         {
           "date": "2025-02-21T00:00:00.000Z",
           "id": 151,
           "reps": 6,
           "weight": 85,
         }
       ]
    */
    .orderBy(
      desc(schema.setsData.weight),
      asc(schema.setsData.date),
      asc(schema.setsData.id)
    )
    .limit(1);

  // If there is a next best set, insert it into the personal records
  if (nextBestSet && !nextBestSet.personal_record?.id) {
    await db.insert(schema.personalRecords).values({
      set_id: nextBestSet.id,
      exercise_id: nextBestSet.exercise_id,
    });
  }
};
