import { WeightUnit } from "./units";

export type ExerciseTypes =
  | "Weight And Reps"
  | "Distance And Time"
  | "Weight And Distance"
  | "Weight And Time"
  | "Reps And Distance"
  | "Reps And Time"
  | "Weight"
  | "Reps"
  | "Distance"
  | "Time";

export interface Exercise {
  category_id: number;
  id: number;
  name: string;
  notes: string;
  type: ExerciseTypes;
  mp4Url: string;
  weight_unit: WeightUnit;
}
