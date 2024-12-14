import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "../database/schema";
import categoriesData from "../data/categoriesData.json";
import exercisesData from "../data/exercisesData.json";
import workoutsTestData from "../data/mockWorkoutData.json";
import { Set } from "@/types/sets";

/**
 * Processes workout data by assigning dates to each set of exercises to dynamically seed test data over a perioud of 3 weeks prior to the current week.
 * The start date is set to 3 weeks before the current day and at the start of the week.
 * The dates are dynamically generated to block the data out over 3 weeks with a 5 days on, 2 days off schedule:
 * - Monday: Resistance
 * - Tuesday: Cardio
 * - Wednesday: Resistance
 * - Thursday: Cardio
 * - Friday: Resistance
 * - Saturday: Rest
 * - Sunday: Rest
 *
 * @async
 * @param {Set[][]} workoutData - The workout data to process, represented as an array of sets of exercises.
 * @returns {Promise<Set[]>} - A promise that resolves to an array of sets with assigned dates.
 */
const processWorkoutData = async (workoutData: Set[][]): Promise<Set[]> => {
  // Set the start date for the data to be 3 weeks before the current day and at the start of the week
  // This will let us dynamically generate the dates for the workout data so we dont have to scroll back months or constantly update the data
  const today = new Date();
  const startDate = today.setDate(
    today.getDate() - (21 + (today.getDay() - 1))
  );

  return workoutData.reduce((acc: Set[], set: Set[], index) => {
    const date = new Date(startDate);

    // This isnt exactly scalable but we do this so we can block the data out over 3 weeks with a 5 days on, 2 days off schedule of:
    // M: Resistance, T: Cardio, W: Resistance, Th: Cardio, F: Resistance, Sa: Rest, Su: Rest
    if (index >= 10) {
      date.setDate(date.getDate() + 4);
    } else if (index >= 5) {
      date.setDate(date.getDate() + 2);
    }
    date.setDate(date.getDate() + index);

    const workoutDay = set.map((exercise) => {
      return {
        ...exercise,
        date: date.toISOString().split("T")[0],
      };
    });

    return [...acc, ...workoutDay];
  }, [] as Set[]);
};

/**
 * Seeds the database with categories and exercises if they don't exist.
 * If in development mode, also seeds the database with test workout data.
 * 
 * @async
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
    // During testing we may add or remove categories and exercises so we need to clear these too
    await db.delete(schema.categories);
    await db.delete(schema.exercises);

    await db.insert(schema.categories).values(categoriesData);
    await db.insert(schema.exercises).values(exercisesData);

    await db.delete(schema.setsData);
    await db
      .insert(schema.setsData)
      .values(await processWorkoutData(workoutsTestData as unknown as Set[][]));
  }
};
