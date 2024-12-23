import { DistanceUnit, WeightUnit } from "./units";

export interface Set {
  id?: number;
  date: string;
  exercise_id: number;
  weight: number | null;
  reps: number | null;
  distance: number | null;
  time: number | null;
  notes: string | null;
  weight_unit: WeightUnit;
  distance_unit: DistanceUnit;
}
