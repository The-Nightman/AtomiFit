export interface LineGraphOptions {
  selectedGraph:
    | WeightRepsOptions
    | DistanceTimeOptions
    | WeightTimeOptions
    | WeightDistanceOptions
    | WeightOptions
    | TimeOptions
    | RepsTimeOptions
    | RepsDistanceOptions
    | RepsOptions
    | DistanceOptions;
  startDate: "1M" | "3M" | "6M" | "1Y" | "ALL" | "string";
  endDate: string;
}

type WeightRepsOptions =
  | "oneRepMax"
  | "maxWeight"
  | "maxReps"
  | "maxVolume"
  | "maxWeightReps"
  | "workoutVolume"
  | "workoutReps"
  | "personalRecords";

type DistanceTimeOptions =
  | "maxDistance"
  | "maxTime"
  | "maxSpeed"
  | "maxPace"
  | "workoutDistance"
  | "workoutTime";

type WeightTimeOptions = "maxWeight" | "maxTime" | "workoutTime";

type WeightDistanceOptions = "maxWeight" | "maxDistance" | "workoutDistance";

type WeightOptions = "maxWeight";

type TimeOptions = "maxTime" | "workoutTime";

type RepsTimeOptions = "maxReps" | "workoutReps" | "maxTime" | "workoutTime";

type RepsDistanceOptions =
  | "maxReps"
  | "workoutReps"
  | "maxDistance"
  | "workoutDistance";

type RepsOptions = "maxReps" | "workoutReps";

type DistanceOptions = "maxDistance" | "workoutDistance";
