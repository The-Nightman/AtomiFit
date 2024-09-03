import { createContext, useEffect } from "react";
import { openDatabaseSync, SQLiteDatabase } from "expo-sqlite";
import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../database/drizzle/migrations";
import * as schema from "../database/schema";
import categoriesData from "../data/categoriesData.json";
import exercisesData from "../data/exercisesData.json";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";

interface DrizzleProviderProps {
  children: React.ReactNode;
}

interface DrizzleContextProps {
  db: ExpoSQLiteDatabase<Record<string, never>>;
}

const atomifitDB: SQLiteDatabase = openDatabaseSync("atomifit.db");
const db: ExpoSQLiteDatabase<Record<string, never>> = drizzle(atomifitDB);

/**
 * The context for accessing the Drizzle database in the rest of the app.
 */
export const DrizzleContext = createContext<DrizzleContextProps>({ db });

/**
 * Seeds the database with categories and exercises if they don't exist.
 * @returns {Promise<void>} A promise that resolves when the database is seeded.
 */
export const seedDatabase = async (): Promise<void> => {
  const categories = db.select().from(schema.categories).all();
  const exercises = db.select().from(schema.exercises).all();

  if (categories.length === 0) {
    await db.insert(schema.categories).values(categoriesData);
  }

  if (exercises.length === 0) {
    await db.insert(schema.exercises).values(exercisesData);
  }
};

/**
 * DrizzleProvider component.
 *
 * @param {React.ReactNode} children - The children components.
 */
export const DrizzleProvider = ({ children }: DrizzleProviderProps) => {
  const { success, error } = useMigrations(db, migrations);

  // Use Drizzle Studio in development mode
  // Cannot Lazy Load Drizzle Studio due to this causing a timeout and never ending loading screen
  if (__DEV__) {
    useDrizzleStudio(openDatabaseSync("atomifit.db"));
  }

  useEffect(() => {
    const setup = async () => {
      await seedDatabase();
    };
    if (error) {
      throw error;
    }
    setup();
  }, [success, error]);

  return (
    <DrizzleContext.Provider value={{ db }}>{children}</DrizzleContext.Provider>
  );
};
