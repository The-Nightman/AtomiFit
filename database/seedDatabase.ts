import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "../database/schema";
import categoriesData from "../data/categoriesData.json";
import exercisesData from "../data/exercisesData.json";
import workoutsTestData from "../data/mockWorkoutData.json";

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
    await db.delete(schema.setsData);
    await db.insert(schema.setsData).values(workoutsTestData);
  }
};
