import { View, Text, StyleSheet } from "react-native";
import { useContext, useState } from "react";
import { DrizzleContext } from "@/contexts/drizzleContext";
import { useLocalSearchParams } from "expo-router";
import * as schema from "@/database/schema";
import { SQL, sql } from "drizzle-orm";
import { Set } from "@/types/sets";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import ExerciseGraph from "@/components/graphs/ExerciseGraph";
import { getToday } from "@/utils/getToday";
import GraphOptions from "@/components/graphs/GraphOptions";
import { LineGraphOptions } from "@/types/graphs";
import UtilityStyles from "@/constants/UtilityStyles";

interface GraphDataSet extends Set {
  dataPoint: number;
}

/**
 * Graph component.
 *
 * Component that renders an exercise graph based on the provided exercise ID.
 * It fetches exercise data from the database and displays the data in an ExerciseGraph component.
 *
 * Not yet fully implemented.
 *
 * @returns {JSX.Element} A view containing the exercise graph or a message indicating no data is available.
 */
const graph = (): JSX.Element => {
  const today = getToday();
  const [selectedOptions, setSelectedOptions] = useState<LineGraphOptions>({
    selectedGraph: "oneRepMax",
    startDate: "1M",
    endDate: today,
  });
  const { exerciseId, type } = useLocalSearchParams<{
    exerciseId: string;
    type: string;
  }>();
  const { db } = useContext(DrizzleContext);

  /**
   * Generates an SQL query string based on the provided start date.
   *
   * The function handles the following cases:
   * - If `startDate` is a predefined key, it calculates the corresponding date range
   *   and returns an SQL query string for that range.
   * - If `startDate` is not a predefined key, it returns an SQL query string that
   *   filters records between the provided `startDate` and `selectedOptions.endDate`.
   * - If `startDate` is not a valid date string, it resets the start date to "1M"
   *   and exits the function to restart on next render.
   *
   * @param {string} startDate - The start date or a predefined key representing a date range.
   * Valid keys are "1M", "3M", "6M", "1Y", and "ALL".
   * @returns {SQL<string>} An SQL query string that filters records by the exercise ID and the date range.
   */
  const getQuery = (startDate: string): SQL<string> | undefined => {
    const keys = ["1M", "3M", "6M", "1Y", "ALL"];
    const todayObj = new Date(today);

    if (!keys.includes(startDate)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        setSelectedOptions({
          ...selectedOptions,
          startDate: "1M",
        });
        return;
      }
      return sql<string>`exercise_id = ${Number(
        exerciseId
      )} AND date BETWEEN ${startDate} AND ${selectedOptions.endDate}`;
    }

    const dateRanges: Record<string, () => SQL<string>> = {
      "1M": (): SQL<string> => {
        const date = new Date(todayObj.setMonth(todayObj.getMonth() - 1))
          .toISOString()
          .split("T")[0];
        return sql<string>`exercise_id = ${Number(
          exerciseId
        )} AND date BETWEEN ${date} AND ${selectedOptions.endDate}`;
      },
      "3M": (): SQL<string> => {
        const date = new Date(todayObj.setMonth(todayObj.getMonth() - 3))
          .toISOString()
          .split("T")[0];
        return sql<string>`exercise_id = ${Number(
          exerciseId
        )} AND date BETWEEN ${date} AND ${selectedOptions.endDate}`;
      },
      "6M": (): SQL<string> => {
        const date = new Date(todayObj.setMonth(todayObj.getMonth() - 6))
          .toISOString()
          .split("T")[0];
        return sql<string>`exercise_id = ${Number(
          exerciseId
        )} AND date BETWEEN ${date} AND ${selectedOptions.endDate}`;
      },
      "1Y": (): SQL<string> => {
        const date = new Date(todayObj.setFullYear(todayObj.getFullYear() - 1))
          .toISOString()
          .split("T")[0];
        return sql<string>`exercise_id = ${Number(
          exerciseId
        )} AND date BETWEEN ${date} AND ${selectedOptions.endDate}`;
      },
      ALL: (): SQL<string> => {
        return sql<string>`exercise_id = ${Number(exerciseId)}`;
      },
    };

    return dateRanges[startDate]();
  };

  const { data }: { data: Set[] } = useLiveQuery(
    db
      .select()
      .from(schema.setsData)
      .where(getQuery(selectedOptions.startDate) as SQL<string>)
      .orderBy(schema.setsData.date),
    [selectedOptions.startDate, selectedOptions.endDate]
  );

  /**
   * Prepares the exercise type by matching specific keywords and appending "Options" to the result.
   *
   * Minor function intended to seperate concerns of processing logic.
   *
   * @param {string} type - The exercise type as a string.
   * @returns {string} A string that concatenates the matched keywords and appends "Options".
   */
  const prepExerciseType = (type: string): string => {
    const matches: string[] = type.match(/Weight|Reps|Distance|Time/gi) ?? [];
    return `${matches.join("")}Options`;
  };

  /**
   * Processes the given data to generate a graph dataset based on the selected graph type.
   *
   * The function supports the following graph types:
   * - `oneRepMax`: Calculates the estimated one-repetition maximum (1RM) for each date using the Epley formula.
   * Option to use the Brzycki and O'Connor formulas as well to be implemented in future.
   * - `maxWeight`: Finds the highest weight lifted for each date.
   * - `maxReps`: Finds the highest number of repetitions performed for each date.
   * - `maxVolume`: Finds the highest volume set (weight * reps) for each date.
   * - TODO - `maxWeightReps`: Placeholder for a multiline graph showing the highest weight for n reps **(not yet implemented)**.
   * - `workoutVolume`: Calculates the total volume (weight * reps) for all sets on each date.
   * - `workoutReps`: Counts the total number of repetitions for all sets on each date.
   * - TODO - `personalRecords`: Placeholder for tracking personal records **(not yet implemented)**.
   * - `maxDistance`: Finds the highest distance covered for each date.
   * - `maxTime`: Finds the highest time taken for each date.
   * - `maxSpeed`: Calculates the highest speed (distance / time) for each date.
   * - `maxPace`: Calculates the highest pace (time / distance) for each date.
   * - `workoutDistance`: Calculates the total distance covered on each date.
   * - `workoutTime`: Calculates the total time taken on each date.
   *
   * @param {Set[]} data - The input data array containing sets of exercise data.
   *
   * @returns {GraphDataSet[]} - The processed graph dataset.
   */
  const processData = (data: Set[]): GraphDataSet[] => {
    const graphTypes = {
      // Epley formula: w * ( 1 + r/30 ) assuming r > 1.
      // https://en.wikipedia.org/wiki/One-repetition_maximum#cite_ref-6
      //
      // https://opensiuc.lib.siu.edu/cgi/viewcontent.cgi?referer=&httpsredir=1&article=1744&context=gs_rp
      // (page 26 pdf onwards, page 20 document onwards)
      //
      // Brzycki formula and O'Connor formula to be implemented in future
      oneRepMax: (data: Set[]): GraphDataSet[] => {
        // Reduce the data array to an object with unique dates as keys
        // Use Object.values to convert the object back into an array once the filtering is complete
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            // If the date is not in acc, the rep count is 1 and the weight is higher than
            // the datapoint or the datapoint is lower than the current sets estimate 1rm
            if (
              !acc[set.date] ||
              (set.reps! === 1 && set.weight! > acc[set.date].dataPoint) ||
              acc[set.date].dataPoint < set.weight! * (1 + set.reps! / 30)
            ) {
              // Add the date as a property and the current set as the best set for the date
              acc[set.date] = {
                ...set,
                dataPoint:
                  // If the rep count is 1, return the weight as the 1rm estimate
                  set.reps! === 1
                    ? set.weight!
                    : set.weight! * (1 + set.reps! / 30),
              };
            }
            return acc;
            // Initialize the accumulator as an empty object of type { [key: string]: Set }
            // This makes filtering more efficient with less code and easier to maintain
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // highest weight sets
      maxWeight: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            // If the date is not in acc or the datapoint is lower than the current sets weight
            if (!acc[set.date] || acc[set.date].dataPoint < set.weight!) {
              // Add the date as a property and the current set as the best set for the date
              acc[set.date] = {
                ...set,
                dataPoint: set.weight!,
              };
            }
            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // highest reps sets
      maxReps: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            // If the date is not in acc or the datapoint is lower than the current sets reps
            if (!acc[set.date] || acc[set.date].dataPoint < set.reps!) {
              // Add the date as a property and the current set as the best set for the date
              acc[set.date] = {
                ...set,
                dataPoint: set.reps!,
              };
            }
            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // highest weight * reps
      maxVolume: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            // If the date is not in acc or the current set has a higher sum of weight * reps
            if (
              !acc[set.date] ||
              acc[set.date].weight! * acc[set.date].reps! <
                set.weight! * set.reps!
            ) {
              // Add the date as a property and the current set as the best set for the date
              acc[set.date] = { ...set, dataPoint: set.weight! * set.reps! };
            }
            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // highest weight for reps all sets, multiline graph, not yet implemented
      maxWeightReps: (data: Set[]): GraphDataSet[] => {
        return data.map((d) => ({
          ...d,
          dataPoint: 0, // Placeholder value
        }));
      },

      // weight * reps all sets
      workoutVolume: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            if (acc[set.date]) {
              // If the date datapoint is in acc, add the current set's weight * reps to the existing datapoint
              if (acc[set.date].hasOwnProperty("dataPoint")) {
                acc[set.date].dataPoint =
                  acc[set.date].dataPoint + set.weight! * set.reps!;
              } else {
                // Edge case if date key present but no datapoint property
                // Add the current set as the best set for the date
                acc[set.date] = { ...set, dataPoint: set.weight! * set.reps! };
              }
            } else {
              // If the date is not in acc, add the current set as the starting point
              acc[set.date] = { ...set, dataPoint: set.weight! * set.reps! };
            }

            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // reps all sets
      workoutReps: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            if (acc[set.date]) {
              // If the date datapoint is in acc, add the current set's reps to the existing datapoint
              if (acc[set.date].hasOwnProperty("dataPoint")) {
                acc[set.date].dataPoint = acc[set.date].dataPoint + set.reps!;
              } else {
                // Edge case if date key present but no datapoint property
                // Add the current set as the best set for the date
                acc[set.date] = { ...set, dataPoint: set.reps! };
              }
            } else {
              // If the date is not in acc, add the current set as the starting point
              acc[set.date] = { ...set, dataPoint: set.reps! };
            }

            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // personal records, not yet implemented
      personalRecords: (data: Set[]): GraphDataSet[] => {
        return data.map((d) => ({
          ...d,
          dataPoint: 0, // Placeholder value
        }));
      },

      // highest distance sets
      maxDistance: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            // If the date is not in acc or the datapoint is lower than the current sets distance
            if (!acc[set.date] || acc[set.date].dataPoint < set.distance!) {
              acc[set.date] = {
                ...set,
                dataPoint: set.distance!,
              };
            }
            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // highest time sets
      maxTime: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            // If the date is not in acc or the datapoint is lower than the current sets time
            if (!acc[set.date] || acc[set.date].dataPoint < set.time!) {
              acc[set.date] = {
                ...set,
                dataPoint: set.time!,
              };
            }
            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // highest speed sets
      maxSpeed: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            // If the date is not in acc or the datapoint is lower than the current sets speed
            if (
              !acc[set.date] ||
              acc[set.date].dataPoint <
                Math.round(((set.distance! * 3.6) / set.time!) * 100) / 100
            ) {
              // Add the date as a property and the current set as the best set for the date
              acc[set.date] = {
                ...set,
                dataPoint:
                  Math.round(((set.distance! * 3.6) / set.time!) * 100) / 100,
              };
            }
            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // highest pace sets
      maxPace: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            // If the date is not in acc or the datapoint is lower than the current sets pace
            if (
              !acc[set.date] ||
              acc[set.date].dataPoint >
                Math.round((set.time! / (set.distance! / 1000)) * 100) / 100
            ) {
              // Add the date as a property and the current set as the best set for the date
              acc[set.date] = {
                ...set,
                dataPoint:
                  Math.round((set.time! / (set.distance! / 1000)) * 100) / 100,
              };
            }
            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // distance all sets
      workoutDistance: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            if (acc[set.date]) {
              // If the date datapoint is in acc, add the current set's distance to the existing datapoint
              if (acc[set.date].hasOwnProperty("dataPoint")) {
                acc[set.date].dataPoint =
                  acc[set.date].dataPoint + set.distance!;
              } else {
                // Edge case if date key present but no datapoint property
                // Add the current set as the best set for the date
                acc[set.date] = { ...set, dataPoint: set.distance! };
              }
            } else {
              // If the date is not in acc, add the current set as the starting point
              acc[set.date] = { ...set, dataPoint: set.distance! };
            }

            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },

      // time all sets
      workoutTime: (data: Set[]): GraphDataSet[] => {
        const filteredResults: GraphDataSet[] = Object.values(
          data.reduce((acc, set) => {
            if (acc[set.date]) {
              // If the date datapoint is in acc, add the current set's time to the existing datapoint
              if (acc[set.date].hasOwnProperty("dataPoint")) {
                acc[set.date].dataPoint = acc[set.date].dataPoint + set.time!;
              } else {
                // Edge case if date key present but no datapoint property
                // Add the current set as the best set for the date
                acc[set.date] = { ...set, dataPoint: set.time! };
              }
            } else {
              // If the date is not in acc, add the current set as the starting point
              acc[set.date] = { ...set, dataPoint: set.time! };
            }

            return acc;
          }, {} as { [key: string]: GraphDataSet })
        );

        return filteredResults;
      },
    };

    return graphTypes[selectedOptions.selectedGraph](data);
  };

  return (
    <View style={UtilityStyles.flex1}>
      <GraphOptions
        optionsType={prepExerciseType(type)}
        selectedOptions={selectedOptions}
        setSelectedOptions={setSelectedOptions}
        today={today}
      />
      {data.length ? (
        <ExerciseGraph
          selectedOptions={selectedOptions}
          data={processData(data)}
        />
      ) : (
        <View style={styles.container}>
          <Text style={styles.placeholderText}>No data to display</Text>
        </View>
      )}
    </View>
  );
};

export default graph;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { fontSize: 23, color: "#B9B9B9" },
});
