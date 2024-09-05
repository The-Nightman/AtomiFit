import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { eq } from "drizzle-orm";
import * as schema from "../database/schema";
import categoriesData from "../data/categoriesData.json";
import exercisesData from "../data/exercisesData.json";
import workoutsTestData from "../data/mockWorkoutData.json";
import {
  DistanceSet,
  DistanceTimeSet,
  RepsDistanceSet,
  RepsSet,
  RepsTimeSet,
  TimeSet,
  WeightDistanceSet,
  WeightRepsSet,
  WeightSet,
  WeightTimeSet,
} from "@/types/sets";

/**
 * Seeds the database with categories and exercises if they don't exist.
 * If in development mode, also seeds the database with test workout data.
 * @param {ExpoSQLiteDatabase<Record<string, never>>} db - The database to seed.
 * @returns {Promise<void>} A promise that resolves when the database is seeded.
 */
export const seedDatabase = async (
  db: ExpoSQLiteDatabase<Record<string, never>>
): Promise<void> => {
  const categories = db.select().from(schema.categories).all();
  const exercises = db.select().from(schema.exercises).all();

  if (categories.length === 0) {
    await db.insert(schema.categories).values(categoriesData);
  }

  if (exercises.length === 0) {
    await db.insert(schema.exercises).values(exercisesData);
  }

  // When in development mode we need to clear the database of any existing
  // workout data and seed the database with the test workout
  if (__DEV__) {
    await db.delete(schema.workouts).execute();
    await db.delete(schema.distance).execute();
    await db.delete(schema.distanceTime).execute();
    await db.delete(schema.reps).execute();
    await db.delete(schema.repsDistance).execute();
    await db.delete(schema.repsTime).execute();
    await db.delete(schema.time).execute();
    await db.delete(schema.weight).execute();
    await db.delete(schema.weightDistance).execute();
    await db.delete(schema.weightReps).execute();
    await db.delete(schema.weightTime).execute();
    await db.insert(schema.workouts).values(workoutsTestData.workout);

    // Set possible types to interface keys so dictionary can set the specific type for each table insert
    interface SetTypeMap {
      "Distance": DistanceSet;
      "Distance And Time": DistanceTimeSet;
      "Reps": RepsSet;
      "Reps And Distance": RepsDistanceSet;
      "Reps And Time": RepsTimeSet;
      "Time": TimeSet;
      "Weight": WeightSet;
      "Weight And Distance": WeightDistanceSet;
      "Weight And Reps": WeightRepsSet;
      "Weight And Time": WeightTimeSet;
    }

    // Set up a dictionary to map the database insertion function to the specific set type
    const seedSetDataDictionary: {
      [K in keyof SetTypeMap]: (set: SetTypeMap[K]) => Promise<void>;
    } = {
      "Distance": async (set: DistanceSet) => {
        await db.insert(schema.distance).values(set);
      },
      "Distance And Time": async (set: DistanceTimeSet) => {
        await db.insert(schema.distanceTime).values(set);
      },
      "Reps": async (set: RepsSet) => {
        await db.insert(schema.reps).values(set);
      },
      "Reps And Distance": async (set: RepsDistanceSet) => {
        await db.insert(schema.repsDistance).values(set);
      },
      "Reps And Time": async (set: RepsTimeSet) => {
        await db.insert(schema.repsTime).values(set);
      },
      "Time": async (set: TimeSet) => {
        await db.insert(schema.time).values(set);
      },
      "Weight": async (set: WeightSet) => {
        await db.insert(schema.weight).values(set);
      },
      "Weight And Distance": async (set: WeightDistanceSet) => {
        await db.insert(schema.weightDistance).values(set);
      },
      "Weight And Reps": async (set: WeightRepsSet) => {
        await db.insert(schema.weightReps).values(set);
      },
      "Weight And Time": async (set: WeightTimeSet) => {
        await db.insert(schema.weightTime).values(set);
      },
    };

    workoutsTestData.sets.forEach(async (set: any) => {
      // Extract the set type of the exercise from the database
      const [{ type }] = await db
        .select({ type: schema.exercises.type })
        .from(schema.exercises)
        .where(eq(schema.exercises.id, set.exercise_id));

      // Retrieve the insertion function for the specific set type
      const insertIntoSetTable =
        seedSetDataDictionary[type as keyof SetTypeMap];

      // Insert the set into the database
      await insertIntoSetTable(set);
    });
  }
};
