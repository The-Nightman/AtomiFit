import { StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
  TextAnchor,
} from "react-native-svg";
import * as d3 from "d3";
import { displayDate } from "@/utils/displayDate";
import { getToday } from "@/utils/getToday";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { Set } from "@/types/sets";

interface ExerciseGraphComponentProps {
  data: Set[];
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
  line: d3.Line<Set>;
}

/**
 * ExerciseGraph component renders a line graph based on the provided exercise data.
 * The graph currently displays the total volume (weight * reps) over time using SVG elements.
 * It includes x and y axes with ticks, a line representing the data points, and circles for each data point.
 *
 * Not yet fully implemented.
 *
 * @param {ExerciseGraphComponentProps} props - The props for the ExerciseGraph component.
 * @param {Set[]} props.data - An array of data points, where each data point contains a `date`, `weight`, and `reps` property.
 *
 * @returns {JSX.Element} The rendered ExerciseGraph component.
 */
const ExerciseGraph = ({ data }: ExerciseGraphComponentProps): JSX.Element => {
  const [graphSize, setGraphSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  );

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
   * @param {Set[]} data - An array of data points, where each data point contains a `date`, `weight`, and `reps` property.
   * @returns {GraphConfig} A GraphConfig object containing the following properties:
   * - `xScale`: A D3 scale for the x-axis (UTC time scale).
   * - `yScale`: A D3 scale for the y-axis (linear scale).
   * - `xTicks`: An array of objects representing the x-axis ticks, each with `date`, `textAnchor`, and `xPos` properties.
   * - `yTicks`: An array of y-axis tick values.
   * - `line`: A D3 line generator function for plotting the data points.
   */
  const makeGraph = (data: Set[]): GraphConfig => {
    // Create a time scale for the x-axis
    const xScale: d3.ScaleTime<number, number> = d3.scaleUtc(
      [new Date(data[0].date), new Date(data[data.length - 1].date)],
      // 32 and graphSize.width - 16 are the left and right bounds of the SVG element respectively
      [32, graphSize.width - 16]
    );

    // Create a linear scale for the y-axis
    const yScale: d3.ScaleLinear<number, number> = d3.scaleLinear(
      // Weight * Reps = Total Volume, other functions to come not yet fully implemented
      [
        // Round down to the nearest multiple of 50 and subtract 50 or add 50 to create a buffer
        Math.ceil(d3.min(data, (d) => d.weight! * d.reps!)! / 50) * 50 - 50,
        Math.ceil(d3.max(data, (d) => d.weight! * d.reps!)! / 50) * 50 + 50,
      ],
      // graphSize.height - 16 and 16 are the top and bottom bounds of the SVG element respectively
      [graphSize.height - 16, 16]
    );

    // Create a line generator function
    const line: d3.Line<Set> = d3
      .line<Set>()
      .x((d) => xScale(new Date(d.date)))
      .y((d) => yScale(d.weight! * d.reps!)); // Weight * Reps = Total Volume, other functions to come not yet fully implemented

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
      Math.ceil(d3.min(data, (d) => d.weight! * d.reps!)! / 50) * 50 - 50,
      Math.ceil(d3.max(data, (d) => d.weight! * d.reps!)! / 50) * 50 + 50,
      7
    );

    return {
      xScale,
      yScale,
      xTicks,
      yTicks,
      line,
    };
  };

  // Generate the graph configuration memoized by the data and graphSize
  const graph = useMemo(() => makeGraph(data), [data, graphSize]);

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

  return (
    <View style={styles.mainContainer}>
      <View
        style={styles.graphContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setGraphSize({ width, height });
        }}
      >
        <Svg width={graphSize.width} height={graphSize.height}>
          <Rect
            x={32}
            y={16}
            width={graphSize.width - 48}
            height={graphSize.height - 32}
            fill="none"
            stroke={hexcodeLuminosity("#3F3C3C", 20)}
          />
          {/* X-axis ticks */}
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
          {/* Y-axis ticks and grid lines */}
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
          <Path
            d={graph.line(data) || ""}
            fill="none"
            stroke="#60DD49"
            strokeWidth={1.5}
          />
          <G transform={`translate(0,0)`}>
            {data.map((d, _) => (
              <Circle
                key={`circle-${d.date}`}
                cx={graph.xScale(new Date(d.date))}
                cy={graph.yScale(d.weight! * d.reps!)}
                r={4}
                fill="#60DD49"
              />
            ))}
          </G>
        </Svg>
      </View>
      <View style={styles.selectedContainer}>
        <Text style={styles.selectedText}>
          {data[0].weight! * data[0].reps!} KG ({data[0].weight!} KG x{" "}
          {data[0].reps!} Reps)
        </Text>
        <Text style={styles.selectedText}>
          {displayDate(data[0].date, getToday())}
        </Text>
      </View>
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
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderTopColor: hexcodeLuminosity("#3F3C3C", 20),
    borderTopWidth: 1,
  },
  selectedText: { color: "white" },
});
