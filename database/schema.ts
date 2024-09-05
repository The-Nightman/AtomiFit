import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    colour: text("colour").notNull(),
  },
  (categories) => ({
    nameIdx: uniqueIndex("nameIdx").on(categories.name),
  })
);

export const exercises = sqliteTable(
  "exercises",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    notes: text("notes").notNull(),
    type: text("type").notNull(),
    category_id: integer("category_id")
      .references(() => categories.id)
      .notNull(),
  },
  (exercises) => ({
    exerciseNameIdx: uniqueIndex("exerciseNameIdx").on(exercises.name),
  })
);

// Workouts table to group exercises together, this eliminates the need to query every table
export const setsData = sqliteTable("sets_data", {
  id: integer("id").primaryKey(),
  date: text("date").notNull(), // ISO 8601 date string
  exercise_id: integer("exercise_id")
    .references(() => exercises.id, { onDelete: "cascade" })
    .notNull(),
  weight: real("weight"),
  reps: integer("reps"),
  distance: real("distance"),
  time: integer("time"),
  notes: text("notes"),
});
