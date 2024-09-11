import { Set } from "./sets";

export interface ListWorkout {
  date: string;
  data: ListWorkoutExercise[];
}

export interface ListWorkoutExercise {
  exercise_name: string;
  category_name: string;
  category_colour: string;
  sets: Set[];
}
