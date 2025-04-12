import {
  index,
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
    type: text("type", {
      enum: [
        "Weight And Reps",
        "Distance And Time",
        "Weight And Distance",
        "Weight And Time",
        "Reps And Distance",
        "Reps And Time",
        "Weight",
        "Reps",
        "Distance",
        "Time",
      ],
    }).notNull(),
    weight_unit: text("weight_unit", { enum: ["Kg", "Lbs"] }),
    category_id: integer("category_id")
      .references(() => categories.id)
      .notNull(),
    mp4Url: text("mp4Url").notNull(),
  },
  (exercises) => ({
    exerciseNameIdx: uniqueIndex("exerciseNameIdx").on(exercises.name),
  })
);

// Workouts table to group exercises together, this eliminates the need to query every table
export const setsData = sqliteTable(
  "sets_data",
  {
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
    weight_unit: text("weight_unit", { enum: ["Kg", "Lbs"] }),
    distance_unit: text("distance_unit", { enum: ["Km", "Mi", "M", "Ft"] }),
  },
  (setsData) => ({
    setIdIdx: uniqueIndex("setIdIdx").on(setsData.id),
    setDateIdx: index("setDateIdx").on(setsData.date),
  })
);

// Personal Records table to store the best sets for each exercise (distance and time PRs need some consultation before fully implementing)
export const personalRecords = sqliteTable(
  "personal_records",
  {
    id: integer("id").primaryKey(),
    set_id: integer("set_id")
      .references(() => setsData.id, { onDelete: "cascade" })
      .notNull(),
    exercise_id: integer("exercise_id")
      .references(() => exercises.id, { onDelete: "cascade" })
      .notNull(),
  },
  (personalRecords) => ({
    prSetIdx: uniqueIndex("prSetIdx").on(personalRecords.set_id),
    prExerciseIdx: index("prExerciseIdx").on(personalRecords.exercise_id),
  })
);

// Audio metadata table to store the audio files and their filesystem location
export const audioMetadata = sqliteTable(
  "audio_metadata",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    audioUrl: text("audioUrl").notNull(),
  },
  (audioMetadata) => ({
    audioNameIdx: uniqueIndex("audioNameIdx").on(audioMetadata.name),
  })
);
