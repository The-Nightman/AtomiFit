export interface ListWorkout {
  date: string;
  data: ListWorkoutExercise[];
}

export interface ListWorkoutExercise {
  exercise_name: string;
  category_name: string;
  category_colour: string;
  sets: ListWorkoutExerciseSet[];
}

export interface ListWorkoutExerciseSet {
  id?: number;
  weight: number | null;
  reps: number | null;
  distance: number | null;
  time: number | null;
  notes: string | null;
}
