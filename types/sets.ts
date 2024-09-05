export interface Set {
  id?: number;
  exercise_id: number;
  workout_id: number;
  notes: string;
}

export interface DistanceSet extends Set {
  distance: number;
}

export interface DistanceTimeSet extends Set {
  distance: number;
  time: number;
}

export interface RepsSet extends Set {
  reps: number;
}

export interface RepsDistanceSet extends Set {
  reps: number;
  distance: number;
}

export interface RepsTimeSet extends Set {
  reps: number;
  time: number;
}

export interface TimeSet extends Set {
  time: number;
}

export interface WeightSet extends Set {
  weight: number;
}

export interface WeightDistanceSet extends Set {
  weight: number;
  distance: number;
}

export interface WeightRepsSet extends Set {
  weight: number;
  reps: number;
}

export interface WeightTimeSet extends Set {
  weight: number;
  time: number;
}
