import { ExerciseTypes } from "@/types/exercise";

/**
 * A centralized list of exercise types used in the application.
 * Each exercise type represents a different way to measure and track exercises.
 * 
 * The available exercise types are:
 * - "Weight And Reps": Track exercises by weight lifted and number of repetitions.
 * - "Distance And Time": Track exercises by distance covered and time taken.
 * - "Weight And Distance": Track exercises by weight lifted and distance covered.
 * - "Weight And Time": Track exercises by weight lifted and time taken.
 * - "Reps And Distance": Track exercises by number of repetitions and distance covered.
 * - "Reps And Time": Track exercises by number of repetitions and time taken.
 * - "Weight": Track exercises by weight lifted only.
 * - "Reps": Track exercises by number of repetitions only.
 * - "Distance": Track exercises by distance covered only.
 * - "Time": Track exercises by time taken only.
 */
export const exerciseTypes: ExerciseTypes[] = [
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
];
