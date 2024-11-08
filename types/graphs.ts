export interface LineGraphOptions {
  selectedGraph:
    | "oneRepMax"
    | "maxWeight"
    | "maxReps"
    | "maxVolume"
    | "maxWeightReps"
    | "workoutVolume"
    | "workoutReps"
    | "personalRecords";
  startDate: "1M" | "3M" | "6M" | "1Y" | "ALL" | "string";
  endDate: string;
}

export interface ExerciseGraphData {
  id: number;
  date: string;
  exercise_id: number;
}

export interface ExerciseGraphData {
  id: number;
  date: string;
  exercise_id: number;
  weight: number | null;
  reps: number | null;
  distance: number | null;
  time: number | null;
  notes: string | null;
}
