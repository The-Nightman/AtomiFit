import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { useMemo, useState } from "react";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
  TextAnchor,
} from "react-native-svg";
import * as d3 from "d3";
import { displayDate } from "@/utils/displayDate";
import { getToday } from "@/utils/getToday";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { Set } from "@/types/sets";
import { LineGraphOptions } from "@/types/graphs";
import { Entypo } from "@expo/vector-icons";
import { formatTime } from "@/utils/formatTime";
import { distanceDisplay } from "@/utils/formatDistance";

interface ExerciseGraphComponentProps {
  selectedOptions: LineGraphOptions;
  data: GraphDataSet[];
}

interface GraphDataSet extends Set {
  dataPoint: number;
}

interface GraphConfig {
  xScale: d3.ScaleTime<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  xTicks: {
    date: string;
    textAnchor: "start" | "middle" | "end";
    xPos: number;
  }[];
  yTicks: number[];
  line: d3.Line<GraphDataSet>;
  area: any;
}

/**
 * ExerciseGraph component renders a line graph based on the provided exercise data.
 * The graph supports the following data views:
 * - Estimated 1RM (One Rep Max) using the Epley formula.
 * Option to use the Brzycki and O'Conner formulas as well to be implemented in future.
 * - Max Weight
 * - Max Reps
 * - Max Volume
 * - Max Weight x Reps
 * - Workout Volume
 * - Workout Reps
 * - Personal Records
 *
 * It includes x and y axes with ticks, a line representing the data points, and circles for each data point.
 *
 * Not yet fully implemented.
 *
 * @component
 * @param {ExerciseGraphComponentProps} props - The props for the ExerciseGraph component.
 * @param {GraphDataSet[]} props.data - An array of data points, where each data point contains a `date`, `weight`, and `reps` property.
 *
 * @returns {JSX.Element} The rendered ExerciseGraph component.
 *
 * @example
 * ```tsx
 * <ExerciseGraph
 *   selectedOptions={selectedOptions}
 *   data={[
 *     { date: "2021-09-01", weight: 100, reps: 5, dataPoint: 80 },
 *     { date: "2021-09-02", weight: 100, reps: 5, dataPoint: 80 },
 *     { date: "2021-09-03", weight: 100, reps: 5, dataPoint: 80 },
 *     { date: "2021-09-04", weight: 100, reps: 5, dataPoint: 80 },
 *     { date: "2021-09-05", weight: 100, reps: 5, dataPoint: 80 },
 *   ]}
 * />
 * ```
 */
const ExerciseGraph = ({
  selectedOptions,
  data,
}: ExerciseGraphComponentProps): JSX.Element => {
  const [graphSize, setGraphSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  );
  const [selectedData, setSelectedData] = useState<number | null>(null);

  /**
   * Generates a graph configuration based on the provided data.
   * The graph configuration includes scales for the x and y axes, tick values, and a line generator function.
   * The x-axis scale is a UTC scale, and the y-axis scale is a linear scale.
   * The x-axis ticks are calculated based on the first and last data points, as well as the midpoint of the data.
   * The y-axis ticks are calculated based on the minimum and maximum total volume of the data with rounding and buffer.
   * The line generator function is used to plot the data points on the graph.
   * The graph configuration is memoized based on the data prop and graph size state.
   * The graph is rendered using SVG elements, including a rectangle for the graph area,
   * text elements for the axis labels, and a path for the data line.
   *
   * @returns {GraphConfig} A GraphConfig object containing the following properties:
   * - `xScale`: A D3 scale for the x-axis (UTC time scale).
   * - `yScale`: A D3 scale for the y-axis (linear scale).
   * - `xTicks`: An array of objects representing the x-axis ticks, each with `date`, `textAnchor`, and `xPos` properties.
   * - `yTicks`: An array of y-axis tick values.
   * - `line`: A D3 line generator function for plotting the data points.
   * - `area`: A D3 area generator function for filling the area under the line.
   */
  const makeGraph = (): GraphConfig => {
    // Create a time scale for the x-axis
    const xScale: d3.ScaleTime<number, number> = d3.scaleUtc(
      [new Date(data[0].date), new Date(data[data.length - 1].date)],
      // 32 and graphSize.width - 16 are the left and right bounds of the SVG element respectively
      [32, graphSize.width - 16]
    );

    // Create a linear scale for the y-axis
    const yScale: d3.ScaleLinear<number, number> = d3.scaleLinear(
      [
        // Round down to the nearest multiple of 50 and subtract 50 or add 50 to create a buffer
        selectedOptions.yAxisFromZero
          ? 0
          : Math.floor(d3.min(data, (d) => d.dataPoint)! / 50) * 50 - 50,
        Math.ceil(d3.max(data, (d) => d.dataPoint)! / 50) * 50 + 50,
      ],
      // graphSize.height - 16 and 16 are the top and bottom bounds of the SVG element respectively
      [graphSize.height - 16, 16]
    );

    // Create a line generator function
    const line: d3.Line<GraphDataSet> = d3
      .line<GraphDataSet>()
      .x((d) => xScale(new Date(d.date)))
      .y((d) => yScale(d.dataPoint));

    // Create an area generator function
    const area = d3
      .area<GraphDataSet>()
      .x((d) => xScale(new Date(d.date)))
      .y0(graphSize.height - 16) // Bottom of the graph
      .y1((d) => yScale(d.dataPoint))
      .defined((d) => d.dataPoint !== undefined && d.dataPoint !== null) // Only include defined points
      .curve(d3.curveLinear); // Use linear curve for simplicity

    // Calculate the midpoint epoch timestamp for the x-axis ticks
    const midpointTimestamp =
      (new Date(data[0].date).getTime() +
        new Date(data[data.length - 1].date).getTime()) /
      2;

    // Convert the midpoint timestamp to an ISO string
    // No need to split as we will be procesing it later with toLocaleDateString options
    const midpointDate = new Date(midpointTimestamp).toISOString();

    // Create the x-axis tick values
    const xTicks: {
      date: string;
      textAnchor: "start" | "middle" | "end";
      xPos: number;
    }[] = [
      {
        date: data[data.length - 1].date,
        textAnchor: "end",
        xPos: graphSize.width - 16,
      },
      { date: midpointDate, textAnchor: "middle", xPos: graphSize.width / 2 },
      { date: data[0].date, textAnchor: "start", xPos: 32 },
    ];

    // Calculate the y-axis tick values, same rounding and buffer calculation as yScale
    const yTicks: number[] = d3.ticks(
      selectedOptions.yAxisFromZero
        ? 0
        : Math.floor(d3.min(data, (d) => d.dataPoint)! / 50) * 50 - 50,
      Math.ceil(d3.max(data, (d) => d.dataPoint)! / 50) * 50 + 50,
      7
    );

    return {
      xScale,
      yScale,
      xTicks,
      yTicks,
      line,
      area,
    };
  };

  // Generate the graph configuration memoized by the data and graphSize
  const graph = useMemo(
    () => makeGraph(),
    [
      data,
      graphSize,
      selectedOptions.selectedGraph,
      selectedOptions.yAxisFromZero,
    ]
  );

  /**
   * Formats a given date string into a more readable format.
   *
   * The formatted date will be in the form of "DD MMM" if the year of the date
   * is the same as the current year, otherwise it will be in the form of "DD MMM, YYYY".
   * The month will be abbreviated to three letters and the entire string will be in uppercase.
   *
   * @param {string} date - The date string to be formatted in a Date object compatible format.
   * @returns {string} The formatted date string.
   */
  const processTickDate = (date: string): string => {
    const dateObj = new Date(date);
    const today = new Date(getToday());

    return dateObj
      .toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
          dateObj.getFullYear() === today.getFullYear() ? undefined : "numeric",
      })
      .toUpperCase();
  };

  // Dictionary that maps variant names to functions that generate JSX elements
  // for displaying exercise graph data for the selected datapoint.
  const displayVariants: Record<
    string,
    (data: GraphDataSet) => React.JSX.Element
  > = {
    oneRepMax: (data: GraphDataSet): React.JSX.Element => {
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.dataPoint} </Text>
          KG (<Text style={styles.selectedTextBold}>{data.weight} </Text>
          KG x <Text style={styles.selectedTextBold}>{data.reps} </Text>
          REPS)
        </Text>
      );
    },
    maxWeight: (data: GraphDataSet): React.JSX.Element => {
      // return `${data.dataPoint} KG (${data.weight} KG x ${data.reps} REPS)`;
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.dataPoint} </Text>
          KG (<Text style={styles.selectedTextBold}>{data.weight} </Text>
          KG x <Text style={styles.selectedTextBold}>{data.reps} </Text>
          REPS)
        </Text>
      );
    },
    maxReps: (data: GraphDataSet): React.JSX.Element => {
      // return `${data.dataPoint} REPS (${data.weight} KG x ${data.reps} REPS)`;
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.dataPoint} </Text>
          REPS (<Text style={styles.selectedTextBold}>{data.weight} </Text>
          KG x <Text style={styles.selectedTextBold}>{data.reps} </Text>
          REPS)
        </Text>
      );
    },
    maxVolume: (data: GraphDataSet): React.JSX.Element => {
      // return `${data.dataPoint} KG (${data.weight} KG x ${data.reps} REPS)`;
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.dataPoint} </Text>
          KG (<Text style={styles.selectedTextBold}>{data.weight} </Text>
          KG x <Text style={styles.selectedTextBold}>{data.reps} </Text>
          REPS)
        </Text>
      );
    },
    maxWeightReps: (data: GraphDataSet): React.JSX.Element => {
      return <></>; // Not yet implemented
    },
    workoutVolume: (data: GraphDataSet): React.JSX.Element => {
      // return `${data.dataPoint} KG (${data.weight} KG x ${data.reps} REPS)`;
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.dataPoint} </Text>
          KG
        </Text>
      );
    },
    workoutReps: (data: GraphDataSet): React.JSX.Element => {
      // return `${data.dataPoint} REPS (${data.weight} KG x ${data.reps} REPS)`;
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.dataPoint} </Text>
          REPS
        </Text>
      );
    },
    personalRecords: (data: GraphDataSet): React.JSX.Element => {
      return <></>; // Not yet implemented
    },
    maxDistance: (data: GraphDataSet): React.JSX.Element => {
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.distance! / 1000} </Text>
          KM -{" "}
          <Text style={styles.selectedTextBold}>
            {formatTime(data.dataPoint)}
          </Text>
        </Text>
      );
    },
    maxTime: (data: GraphDataSet): React.JSX.Element => {
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.distance! / 1000} </Text>
          KM -{" "}
          <Text style={styles.selectedTextBold}>
            {formatTime(data.dataPoint)}
          </Text>
        </Text>
      );
    },
    maxSpeed: (data: GraphDataSet): React.JSX.Element => {
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.dataPoint} </Text>
          KM/H (
          <Text style={styles.selectedTextBold}>
            {distanceDisplay(data.distance!)}{" "}
          </Text>
          KM -{" "}
          <Text style={styles.selectedTextBold}>{formatTime(data.time!)}</Text>)
        </Text>
      );
    },
    maxPace: (data: GraphDataSet): React.JSX.Element => {
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>
            {formatTime(data.dataPoint)}{" "}
          </Text>
          /KM (
          <Text style={styles.selectedTextBold}>
            {distanceDisplay(data.distance!)}{" "}
          </Text>
          KM -{" "}
          <Text style={styles.selectedTextBold}>{formatTime(data.time!)}</Text>)
        </Text>
      );
    },
    workoutDistance: (data: GraphDataSet): React.JSX.Element => {
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.dataPoint / 1000} </Text>
          KM
        </Text>
      );
    },
    workoutTime: (data: GraphDataSet): React.JSX.Element => {
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>
            {formatTime(data.dataPoint)}{" "}
          </Text>
        </Text>
      );
    },
  };

  return (
    <View style={styles.mainContainer}>
      <View
        style={styles.graphContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setGraphSize({ width, height });
        }}
      >
        <Svg
          width={graphSize.width}
          height={graphSize.height}
          // Clear the selected data point when anywhere on
          // the graph is pressed that is not a data point
          onPress={() => setSelectedData(null)}
        >
          <Defs>
            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#60DD49" stopOpacity="0.6" />
              <Stop offset="1" stopColor="#60DD49" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {/* Graph Box */}
          <Rect
            x={32}
            y={16}
            width={graphSize.width - 48}
            height={graphSize.height - 32}
            fill="none"
            stroke={hexcodeLuminosity("#3F3C3C", 20)}
          />
          {/* X-axis ticks */}
          <G>
            {graph.xTicks.map((tick, i) => (
              <SvgText
                key={`tick-${tick.date}-${i}`}
                fill="white"
                fontSize="11"
                fontWeight="normal"
                textAnchor={tick.textAnchor as TextAnchor}
                x={tick.xPos}
                y={graphSize.height - 2}
              >
                {processTickDate(tick.date)}
              </SvgText>
            ))}
          </G>
          {/* Y-axis ticks and grid lines */}
          <G>
            {graph.yTicks.map((weight, _) => (
              <SvgText
                key={`text-${weight}`}
                fill="white"
                fontSize="11"
                fontWeight="normal"
                textAnchor="end"
                x={26}
                y={graph.yScale(weight) + 3}
              >
                {weight}
              </SvgText>
            ))}
            {graph.yTicks.map((weight, _) => (
              <Line
                key={`line-${weight}`}
                x1={32}
                x2={graphSize.width - 16}
                y1={graph.yScale(weight)}
                y2={graph.yScale(weight)}
                stroke={hexcodeLuminosity("#3F3C3C", 20)}
              />
            ))}
          </G>
          {/* Data line and area */}
          <G>
            <Path
              d={graph.line(data) || ""}
              fill="none"
              stroke="#60DD49"
              strokeWidth={1.5}
            />
            <Path
              d={graph.area(data) || ""}
              fill="url(#gradient)"
              stroke="none"
            />
          </G>
          {/* Datapoint markers */}
          {(selectedOptions.graphPoints || data.length === 1) && (
            <G>
              {data.map((d, i) => (
                <G key={`circle-${d.date}-${d.id}`}>
                  {/* Display circle */}
                  <Circle
                    cx={graph.xScale(new Date(d.date))}
                    cy={graph.yScale(d.dataPoint)}
                    r={4}
                    fill="#60DD49"
                  />
                  {/* Selected data circle */}
                  {selectedData === i && (
                    <Circle
                      cx={graph.xScale(new Date(d.date))}
                      cy={graph.yScale(d.dataPoint)}
                      r={6}
                      stroke="#60DD49"
                      strokeWidth={2}
                      fill="none"
                    />
                  )}
                  {/*
                  Touchable circle due to inability to use pressable,
                  react-native-svg does not support hitslop as dev refuses to 
                  implement due to svg pressable interaction not being standard on web
                  https://github.com/software-mansion/react-native-svg/issues/81
                */}
                  <Circle
                    cx={graph.xScale(new Date(d.date))}
                    cy={graph.yScale(d.dataPoint)}
                    r={12}
                    fill="none"
                    onPress={() => {
                      setSelectedData(i);
                    }}
                  />
                </G>
              ))}
            </G>
          )}
        </Svg>
      </View>
      {/* Selected data and placeholder */}
      {typeof selectedData === "number" ? (
        <View style={styles.selectedContainer}>
          <Pressable
            onPress={() =>
              setSelectedData((prevData) => {
                if (prevData === 0) return prevData;
                return prevData! - 1;
              })
            }
            hitSlop={30}
          >
            {({ pressed }) => (
              <Entypo
                name="chevron-thin-left"
                size={30}
                color={pressed ? hexcodeLuminosity("#60DD49", -80) : "#60DD49"}
              />
            )}
          </Pressable>
          <View style={styles.selectedTextContainer}>
            {/* Generate JSX based on the select graph type */}
            {displayVariants[selectedOptions.selectedGraph](data[selectedData])}
            <Text style={styles.selectedText}>
              {displayDate(data[selectedData].date, getToday())}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              setSelectedData((prevData) => {
                if (prevData === data.length - 1) return prevData;
                return prevData! + 1;
              })
            }
            hitSlop={30}
          >
            {({ pressed }) => (
              <Entypo
                name="chevron-thin-right"
                size={30}
                color={pressed ? hexcodeLuminosity("#60DD49", -80) : "#60DD49"}
              />
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.selectedText}>
            Tap a point on the graph to view details
          </Text>
        </View>
      )}
    </View>
  );
};

export default ExerciseGraph;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, gap: 12 },
  graphContainer: { flex: 1 },
  selectedContainer: {
    minHeight: 64,
    width: "95%",
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopColor: hexcodeLuminosity("#3F3C3C", 20),
    borderTopWidth: 1,
  },
  selectedTextContainer: {
    alignItems: "center",
  },
  selectedText: { fontSize: 12, fontWeight: "normal", color: "white" },
  selectedTextBold: { fontSize: 14, fontWeight: "bold", color: "white" },
  placeholderContainer: {
    minHeight: 64,
    width: "95%",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderTopColor: hexcodeLuminosity("#3F3C3C", 20),
    borderTopWidth: 1,
  },
});
