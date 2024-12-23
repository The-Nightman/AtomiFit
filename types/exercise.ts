import { WeightUnit } from "./units";

export interface Exercise {
  category_id: number;
  id: number;
  name: string;
  notes: string;
  type: string;
  weight_unit: WeightUnit;
}
