import { and, asc, desc, eq, ne } from "drizzle-orm";
import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "@/database/schema";

export const insertNextBestSet = async (
  db: ExpoSQLiteDatabase<Record<string, never>>,
  prevPrSet: {
    set_id: number;
    exercise_id: number;
    set_reps: number | null;
  },
  id: number
) => {
  // Search for the next best set with the same reps criteria
  const nextBestSet: ({ id: number; exercise_id: number } | null)[] = await db
    .select({
      id: schema.setsData.id,
      exercise_id: schema.setsData.exercise_id,
      weight: schema.setsData.weight,
      date: schema.setsData.date,
    })
    .from(schema.setsData)
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
  if (nextBestSet[0]) {
    await db.insert(schema.personalRecords).values({
      set_id: nextBestSet[0].id,
      exercise_id: nextBestSet[0].exercise_id,
    });
  }
};
