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
export const workouts = sqliteTable("workouts", {
  id: integer("id").primaryKey(),
  date: text("date").notNull(), // ISO 8601 date string
});

export const weightReps = sqliteTable("weight_reps", {
  id: integer("id").primaryKey(),
  exercise_id: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workout_id: integer("workout_id")
    .references(() => workouts.id)
    .notNull(),
  weight: real("weight").notNull(),
  reps: integer("reps").notNull(),
  notes: text("notes").notNull(),
});

export const distanceTime = sqliteTable("distance_time", {
  id: integer("id").primaryKey(),
  exercise_id: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workout_id: integer("workout_id")
    .references(() => workouts.id)
    .notNull(),
  distance: real("distance").notNull(),
  time: integer("time").notNull(),
  notes: text("notes").notNull(),
});

export const weightDistance = sqliteTable("weight_distance", {
  id: integer("id").primaryKey(),
  exercise_id: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workout_id: integer("workout_id")
    .references(() => workouts.id)
    .notNull(),
  weight: real("weight").notNull(),
  distance: real("distance").notNull(),
  notes: text("notes").notNull(),
});

export const weightTime = sqliteTable("weight_time", {
  id: integer("id").primaryKey(),
  exercise_id: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workout_id: integer("workout_id")
    .references(() => workouts.id)
    .notNull(),
  weight: real("weight").notNull(),
  time: integer("time").notNull(),
  notes: text("notes").notNull(),
});

export const repsDistance = sqliteTable("reps_distance", {
  id: integer("id").primaryKey(),
  exercise_id: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workout_id: integer("workout_id")
    .references(() => workouts.id)
    .notNull(),
  reps: integer("reps").notNull(),
  distance: real("distance").notNull(),
  notes: text("notes").notNull(),
});

export const repsTime = sqliteTable("reps_time", {
  id: integer("id").primaryKey(),
  exercise_id: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workout_id: integer("workout_id")
    .references(() => workouts.id)
    .notNull(),
  reps: integer("reps").notNull(),
  time: integer("time").notNull(),
  notes: text("notes").notNull(),
});

export const weight = sqliteTable("weight", {
  id: integer("id").primaryKey(),
  exercise_id: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workout_id: integer("workout_id")
    .references(() => workouts.id)
    .notNull(),
  weight: real("weight").notNull(),
  notes: text("notes").notNull(),
});

export const reps = sqliteTable("reps", {
  id: integer("id").primaryKey(),
  exercise_id: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workout_id: integer("workout_id")
    .references(() => workouts.id)
    .notNull(),
  reps: integer("reps").notNull(),
  notes: text("notes").notNull(),
});

export const distance = sqliteTable("distance", {
  id: integer("id").primaryKey(),
  exercise_id: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workout_id: integer("workout_id")
    .references(() => workouts.id)
    .notNull(),
  distance: real("distance").notNull(),
  notes: text("notes").notNull(),
});

export const time = sqliteTable("time", {
  id: integer("id").primaryKey(),
  exercise_id: integer("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  workout_id: integer("workout_id")
    .references(() => workouts.id)
    .notNull(),
  time: integer("time").notNull(),
  notes: text("notes").notNull(),
});
