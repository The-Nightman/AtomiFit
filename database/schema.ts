import {
  integer,
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
