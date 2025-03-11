import { SetPersonalRecord } from "@/types/sets";
import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { deletePersonalRecord } from "../db/deletePersonalRecord";
import { insertPersonalRecord } from "../db/insertPersonalRecord";
import { insertNextBestSet } from "../db/insertNextBestSet";
import * as schema from "@/database/schema";
import { and, asc, desc, eq, max, ne } from "drizzle-orm";

/**
 * Updates the personal record for a given set of weight and reps in the database.
 * 
 * @param {ExpoSQLiteDatabase<Record<string, never>>} db - The database instance to interact with.
 * @param {SetPersonalRecord} set - The new set data to be evaluated.
 * @param {SetPersonalRecord} currentSetState - The current state of the set being evaluated.
 * @returns {Promise<void>}
 * 
 * This function performs the following operations:
 * 1. Retrieves the previous maximum weight for the same exercise and reps.
 * 2. If the rep range of the current set has been altered, deletes the existing personal record and inserts the next best set.
 * 3. If a previous personal record exists for the same rep range:
 *    - If the current set has a higher weight, updates the personal record.
 *    - If the current set has a lower weight and is the previous personal record, finds the next best set and updates the personal record.
 *    - If the current set is edited on a date prior to the previous personal record, updates the personal record accordingly.
 *    - If the current set is edited on the same date but was created before the previous personal record (by ID), updates the personal record.
 * 4. If no previous personal record exists for the same rep range, inserts the current set as the new personal record.
 */
export const weightRepsPR = async (
  db: ExpoSQLiteDatabase<Record<string, never>>,
  set: SetPersonalRecord,
  currentSetState: SetPersonalRecord
): Promise<void> => {
  const [prevMaxForReps] = await db
    .select({
      id: schema.setsData.id,
      exercise_id: schema.setsData.exercise_id,
      weight: max(schema.setsData.weight),
      reps: schema.setsData.reps,
      date: schema.setsData.date,
    })
    .from(schema.setsData)
    .where(
      and(
        eq(schema.setsData.exercise_id, currentSetState.exercise_id),
        eq(schema.setsData.reps, currentSetState.reps!)
      )
    )
    .groupBy(schema.setsData.date)
    .orderBy(desc(max(schema.setsData.weight)), asc(schema.setsData.date))
    .limit(1);

  // Case: current set rep range has been altered
  if (set.reps !== currentSetState.reps) {
    await deletePersonalRecord(db, currentSetState.id!);
    await insertNextBestSet(
      db,
      {
        set_id: set.id!,
        exercise_id: set.exercise_id,
        set_reps: set.reps!,
      },
      currentSetState.id!
    );
  }

  // Case: a previous PR exists for this rep range
  if (prevMaxForReps) {
    // Case: current set has a higher weight than the previous PR
    if (prevMaxForReps.weight! < currentSetState.weight!) {
      await deletePersonalRecord(db, prevMaxForReps.id!);
      await insertPersonalRecord(
        db,
        currentSetState.id!,
        currentSetState.exercise_id
      );
    }
    // Case: current set has a lower weight than the previous PR
    else if (currentSetState.weight! < prevMaxForReps.weight!) {
      // Case: current set is the previous PR
      if (prevMaxForReps.id === currentSetState.id) {
        const [newPrevMaxForReps] = await db
          .select({
            id: schema.setsData.id,
            exercise_id: schema.setsData.exercise_id,
            weight: max(schema.setsData.weight),
            reps: schema.setsData.reps,
            date: schema.setsData.date,
          })
          .from(schema.setsData)
          .where(
            and(
              eq(schema.setsData.exercise_id, currentSetState.exercise_id),
              eq(schema.setsData.reps, currentSetState.reps!),
              ne(schema.setsData.id, currentSetState.id)
            )
          )
          .groupBy(schema.setsData.date)
          .orderBy(desc(max(schema.setsData.weight)), asc(schema.setsData.date))
          .limit(1);

        // Case: a new PR exists for this rep range and is greater than the current set
        if (
          newPrevMaxForReps &&
          newPrevMaxForReps.weight! > currentSetState.weight!
        ) {
          await deletePersonalRecord(db, prevMaxForReps.id!);
          await insertNextBestSet(
            db,
            {
              set_id: set.id!,
              exercise_id: set.exercise_id,
              set_reps: set.reps!,
            },
            currentSetState.id!
          );
        }
      }
    }
    // Case: current set is edited on a date prior to the previous PR
    else if (
      new Date(currentSetState.date).getTime() <
      new Date(prevMaxForReps.date).getTime()
    ) {
      // Case: current set is equal to or greater than the previous PR
      if (prevMaxForReps.weight! <= currentSetState.weight!) {
        await deletePersonalRecord(db, prevMaxForReps.id!);
        await insertPersonalRecord(
          db,
          currentSetState.id!,
          currentSetState.exercise_id
        );
      }
    }
    // Case: current set is edited on the same date as the previous PR but was created before the previous PR
    else if (
      new Date(prevMaxForReps.date).getTime() ===
        new Date(currentSetState.date).getTime() &&
      currentSetState.id! < prevMaxForReps.id
    ) {
      await deletePersonalRecord(db, prevMaxForReps.id!);
      await insertPersonalRecord(
        db,
        currentSetState.id!,
        currentSetState.exercise_id
      );
    }
  }
  // Case: no previous PR exists for this rep range
  else {
    await insertPersonalRecord(
      db,
      currentSetState.id!,
      currentSetState.exercise_id
    );
  }
};
