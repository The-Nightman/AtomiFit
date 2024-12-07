import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useMemo, useState } from "react";
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
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatTime } from "@/utils/formatTime";
import { distanceDisplay } from "@/utils/formatDistance";
import ModalBase from "../modals/ModalBase";
import { ScrollView } from "react-native-gesture-handler";

interface ExerciseGraphComponentProps {
  selectedOptions: LineGraphOptions;
  data: GraphDataSet[] | GraphDataSet[][]; // If selectedOptions.selectedGraph is "maxWeightReps" then data will be a 2D array
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
  calculateTrendLine: (data: GraphDataSet[]) => string | null;
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
 * - Max Distance
 * - Max Time
 * - Max Speed
 * - Max Pace
 * - Workout Distance
 * - Workout Time
 *
 * It includes x and y axes with ticks, a line representing the data points, and circles for each data point.
 *
 * Not yet fully implemented.
 *
 * @component
 * @param {ExerciseGraphComponentProps} props - The props for the ExerciseGraph component.
 * @param {GraphDataSet[] | GraphDataSet[][]} props.data - An array of data points where each data point
 * contains a `date` and `datapoint` property. If the selected graph is "maxWeightReps" or another multiline
 * graph, the data will be a 2D array of data points.
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
  // By using an object here instead we can manage both flat and nested arrays of data points
  const [selectedData, setSelectedData] = useState<{
    multiIndex: number | null;
    index: number | null;
  }>({ multiIndex: null, index: null });
  const [multiSettings, setMultiSettings] = useState<{
    modal: boolean;
    selected: number[];
    graphHint: boolean;
  }>({
    modal: false,
    selected: [],
    graphHint: false,
  });

  useEffect(() => {
    // If the selected graph is maxWeightReps, we'll automatically select the top 3 highest rep counts for the user by number of workouts
    if (selectedOptions.selectedGraph === "maxWeightReps" && isData2D()) {
      // We'll validate just incase, it isn't really needed but it'll catch any mistakes
      const dataSortLen: GraphDataSet[][] = [
        ...(data as GraphDataSet[][]),
      ].sort((a, b) => b.length - a.length);
      setMultiSettings({
        modal: false,
        selected: dataSortLen
          .slice(0, 3) // We need to slice here as the data may not have 3 rep counts minimum, this method will prevent errors
          .map((arr) => arr[0].reps!)
          .sort((a, b) => a - b),
        graphHint: true,
      });
    } else {
      setMultiSettings({ modal: false, selected: [], graphHint: false }); // We do this to clear unnecessary data when the graph changes or is not a 2D array
    }

    return () => {
      // Clear selected data when the graph changes before re-render, data will change when this happens and if we dont clear it, it will cause an error
      setSelectedData({ multiIndex: null, index: null });
    };
  }, [selectedOptions.selectedGraph, data]);

  /**
   * Lambda function to check if the provided data is a 2-dimensional array.
   *
   * @returns {boolean} `true` if the data is a 2D array, otherwise `false`.
   */
  const isData2D = (): boolean => Array.isArray(data[0]); // We need to make quick checks to see if the data is 2D or not

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
   * - `calculateTrendLine`: A function that calculates the trend line for the data points and returns the SVG path or null.
   */
  const makeGraph = (): GraphConfig => {
    // We need to flatten the data if to make sure it is not a 2D array for processing
    const graphData: GraphDataSet[] = isData2D()
      ? data.flat()
      : (data as GraphDataSet[]);

    // Get the extents for x & y axes so that we can reuse them for scales and ticks, lower performance cost than the previous min/max(...map()) calls
    const xExtents = d3.extent(
      graphData.map((d) => new Date(d.date).getTime())
    );
    const yExtents = d3.extent(graphData.map((d) => d.dataPoint));

    // Create a time scale for the x-axis
    const xScale: d3.ScaleTime<number, number> = d3.scaleUtc(
      [new Date(xExtents[0]!), new Date(xExtents[1]!)],
      // 32 and graphSize.width - 16 are the left and right bounds of the SVG element respectively
      [32, graphSize.width - 16]
    );

    // Create a linear scale for the y-axis
    const yScale: d3.ScaleLinear<number, number> = d3.scaleLinear(
      [
        // Round down to the nearest multiple of 50 and subtract 50 or add 50 to create a buffer
        selectedOptions.yAxisFromZero
          ? 0
          : Math.floor(yExtents[0]! / 50) * 50 - 50,
        Math.ceil(yExtents[1]! / 50) * 50 + 50,
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
    const midpointTimestamp = (xExtents[0]! + xExtents[1]!) / 2;

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
        date: new Date(xExtents[1]!).toDateString(),
        textAnchor: "end",
        xPos: graphSize.width - 16,
      },
      { date: midpointDate, textAnchor: "middle", xPos: graphSize.width / 2 },
      {
        date: new Date(xExtents[0]!).toDateString(),
        textAnchor: "start",
        xPos: 32,
      },
    ];

    // Calculate the y-axis tick values, same rounding and buffer calculation as yScale
    const yTicks: number[] = d3.ticks(
      selectedOptions.yAxisFromZero
        ? 0
        : Math.floor(yExtents[0]! / 50) * 50 - 50,
      Math.ceil(yExtents[1]! / 50) * 50 + 50,
      7
    );

    /**
     * Calculates the trend line for a given dataset.
     *
     * This function takes an array of data points, each containing a date and a data point value,
     * and calculates the trend line using linear regression. The trend line is then returned as
     * an SVG path string that can be used to render the trend line in a graph.
     *
     * @remarks This formula was generated by CoPilot, its been a long time since high school and I really
     * dont remember how to do this or care to relearn it, but I have confidence this works.
     *
     * @param {GraphDataSet[]} data - The dataset containing date and data point values.
     * @returns {string | null} - The SVG path string representing the trend line, or null if the dataset is empty.
     */
    const calculateTrendLine = (data: GraphDataSet[]): string | null => {
      const n = data.length;
      const sumX = data.reduce((sum, d) => sum + new Date(d.date).getTime(), 0);
      const sumY = data.reduce((sum, d) => sum + d.dataPoint, 0);
      const sumXY = data.reduce(
        (sum, d) => sum + new Date(d.date).getTime() * d.dataPoint,
        0
      );
      const sumXX = data.reduce(
        (sum, d) =>
          sum + new Date(d.date).getTime() * new Date(d.date).getTime(),
        0
      );

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const trendData = data.map((d) => ({
        date: d.date,
        dataPoint: slope * new Date(d.date).getTime() + intercept,
      }));

      return d3
        .line<{ date: string; dataPoint: number }>()
        .x((d) => xScale(new Date(d.date)))
        .y((d) => yScale(d.dataPoint))(trendData);
    };

    return {
      xScale,
      yScale,
      xTicks,
      yTicks,
      line,
      area,
      calculateTrendLine,
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
          <Text style={styles.selectedTextBold}>
            {data.dataPoint.toFixed(2)}{" "}
          </Text>
          KG (<Text style={styles.selectedTextBold}>{data.weight} </Text>
          KG x <Text style={styles.selectedTextBold}>{data.reps} </Text>
          REPS)
        </Text>
      );
    },
    maxWeight: (data: GraphDataSet): React.JSX.Element => {
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
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.weight} </Text>
          KG x <Text style={styles.selectedTextBold}>{data.reps} </Text>
          REPS
        </Text>
      );
    },
    workoutVolume: (data: GraphDataSet): React.JSX.Element => {
      return (
        <Text style={styles.selectedText}>
          <Text style={styles.selectedTextBold}>{data.dataPoint} </Text>
          KG
        </Text>
      );
    },
    workoutReps: (data: GraphDataSet): React.JSX.Element => {
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

  /**
   * An array of distinct color codes used for multiline graphs, each color is represented as a hexadecimal string.
   * Currently a placeholder, possible plan to implement customization later and limit number of data lines visible to 10.
   *
   * Colors included:
   * - Red: #E6194B
   * - Green: #3CB44B
   * - Yellow: #FFE119
   * - Blue: #4363D8
   * - Orange: #F58231
   * - Purple: #911EB4
   * - Cyan: #42D4F4
   * - Magenta: #F032E6
   * - Lime: #BFEF45
   * - Pink: #FABEBE
   */
  const multilineColors = [
    "#E6194B", // Red
    "#3CB44B", // Green
    "#FFE119", // Yellow
    "#4363D8", // Blue
    "#F58231", // Orange
    "#911EB4", // Purple
    "#42D4F4", // Cyan
    "#F032E6", // Magenta
    "#BFEF45", // Lime
    "#FABEBE", // Pink
  ];

  /**
   * Handles the selection and deselection of multiline graph datasets based on the rep count.
   * If the rep count is already selected and the selection count is greater than 1, it will be removed from the selection.
   * If the rep count is not selected and the selection count is less than 10, it will be added to the selection.
   * The selectedData state is reset when the user changes the options to prevent errors.
   *
   * @param {number} repCount - The rep count to be selected or deselected.
   * @returns {void}
   */
  const handleMultilineSelection = (repCount: number): void => {
    setSelectedData({ multiIndex: null, index: null }); // We clear the selected data when the user changes the options to prevent errors

    if (
      multiSettings.selected.includes(repCount) &&
      multiSettings.selected.length > 1
    ) {
      setMultiSettings((prevState) => ({
        ...multiSettings,
        selected: prevState.selected.filter((r) => r !== repCount),
      }));
    } else if (multiSettings.selected.length < 10) {
      setMultiSettings((prevState) => ({
        ...multiSettings,
        selected: [...prevState.selected, repCount].sort((a, b) => a - b),
      }));
    }
  };

  /**
   * Renders the appropriate variant of the selected graph data based on the selected data state.
   *
   * This function checks if the data is 2D and if the selected data indices are not null.
   * If the data is 2D, it filters the data based on the selected rep counts and renders
   * the corresponding graph variant along with the date. If the data is not 2D, it renders
   * the graph variant and date based on the selected index.
   *
   * In case of failure (i.e., if the selected data indices are null), it returns a placeholder
   * view with a message prompting the user to tap a point on the graph to view details.
   *
   * @returns {React.JSX.Element} The rendered graph variant or a placeholder view.
   */
  const renderVariant = (): React.JSX.Element => {
    // We should enforce that the selectedData is not null before we try to render
    // anything and especially that both properties are not null for 2D data
    if (
      isData2D() &&
      selectedData.multiIndex !== null &&
      selectedData.index !== null
    ) {
      return (
        <>
          {displayVariants[selectedOptions.selectedGraph](
            // We need to filter the data now due to how we are handling the rendering of selected rep counts data
            (data as GraphDataSet[][]).filter((repArr) =>
              multiSettings.selected.includes(repArr[0].reps!)
            )[selectedData.multiIndex!][selectedData.index!]
          )}
          <Text style={styles.selectedText}>
            {displayDate(
              (data as GraphDataSet[][]).filter((repArr) =>
                multiSettings.selected.includes(repArr[0].reps!)
              )[selectedData.multiIndex!][selectedData.index!].date,
              getToday()
            )}
          </Text>
        </>
      );
    }
    if (!isData2D() && selectedData.index !== null) {
      return (
        <>
          {displayVariants[selectedOptions.selectedGraph](
            (data as GraphDataSet[])[selectedData.index!]
          )}
          <Text style={styles.selectedText}>
            {displayDate(
              (data as GraphDataSet[])[selectedData.index!].date,
              getToday()
            )}
          </Text>
        </>
      );
    }

    // In the event of failure we will just return the placeholder
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.selectedText}>
          Tap a point on the graph to view details
        </Text>
      </View>
    );
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
        {isData2D() && (
          <Pressable
            style={styles.graphHintContainer}
            onPress={() =>
              setMultiSettings((prevState) => ({
                ...prevState,
                graphHint: !prevState.graphHint,
              }))
            }
          >
            {multiSettings.graphHint && (
              <View>
                {multiSettings.selected.map((repCount, i) => (
                  <View
                    key={`rep-${repCount}`}
                    style={styles.graphHintItemContainer}
                  >
                    {/* Colour indicator */}
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: multilineColors[i],
                      }}
                    />
                    <Text style={styles.graphHintItemText}>
                      {repCount} REPS
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.graphHintShowHideText}>
              {multiSettings.graphHint ? "HIDE" : "SHOW"}
            </Text>
          </Pressable>
        )}
        {isData2D() && (
          <Pressable
            style={[
              { left: graphSize.width - 18 },
              styles.multilineSettingsIcon,
            ]}
            onPress={() => setMultiSettings({ ...multiSettings, modal: true })}
          >
            <MaterialCommunityIcons name="cog" size={24} color="#9F9F9F" />
          </Pressable>
        )}
        <Svg
          width={graphSize.width}
          height={graphSize.height}
          onPress={() => {
            // We need to clear the selected data if the user presses on the graph but also
            // only do it if there is data selected to prevent unnecessary re-renders
            if (selectedData.index !== null) {
              setSelectedData({ multiIndex: null, index: null });
            }
          }}
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
            {!isData2D() ? (
              <>
                <Path
                  d={graph.line(data as GraphDataSet[]) || ""}
                  fill="none"
                  stroke="#60DD49"
                  strokeWidth={1.5}
                />
                <Path
                  d={graph.area(data) || ""}
                  fill="url(#gradient)"
                  stroke="none"
                />
              </>
            ) : (
              (data as GraphDataSet[][])
                .filter((repArr) =>
                  multiSettings.selected.includes(repArr[0].reps!)
                )
                .map((d, i) => (
                  <Path
                    key={`multiline-${i}`}
                    d={graph.line(d as GraphDataSet[]) || ""}
                    fill="none"
                    stroke={multilineColors[i]}
                    strokeWidth={1.5}
                  />
                ))
            )}
            {selectedOptions.trendline && data.length > 1 && !isData2D() && (
              <Path
                d={graph.calculateTrendLine(data as GraphDataSet[]) || ""}
                fill="none"
                stroke={hexcodeLuminosity("#FF0000", 0)}
                strokeDasharray={[10, 4]}
                strokeWidth={2}
              />
            )}
          </G>
          {/* Datapoint markers */}
          {(selectedOptions.graphPoints || data.length === 1) && !isData2D() ? (
            <G>
              {(data as GraphDataSet[]).map((d, i) => (
                <G key={`circle-${d.date}-${d.id}`}>
                  {/* Display circle */}
                  <Circle
                    cx={graph.xScale(new Date(d.date))}
                    cy={graph.yScale(d.dataPoint)}
                    r={4}
                    fill="#60DD49"
                  />
                  {/* Selected data circle */}
                  {selectedData.index === i && (
                    <Circle
                      cx={graph.xScale(new Date(d.date))}
                      cy={graph.yScale(d.dataPoint)}
                      r={6}
                      stroke="#60DD49"
                      strokeWidth={2}
                      fill="none"
                    />
                  )}
                  {/* We use an onPress event for the same functionality and reasons as above */}
                  <Circle
                    cx={graph.xScale(new Date(d.date))}
                    cy={graph.yScale(d.dataPoint)}
                    r={12}
                    fill="none"
                    onPress={() => {
                      setSelectedData({ multiIndex: null, index: i });
                    }}
                  />
                </G>
              ))}
            </G>
          ) : (
            // Multiline datapoint markers
            <G>
              {(data as GraphDataSet[][])
                .filter((repArr) =>
                  multiSettings.selected.includes(repArr[0].reps!)
                )
                .map((d, i) => (
                  <G key={`multiline-${(d as GraphDataSet[])[0].reps}-reps`}>
                    {(d as GraphDataSet[]).map((d, j) => (
                      <G key={`circle-${d.date}-${d.id}`}>
                        {/* Display circle */}
                        <Circle
                          cx={graph.xScale(new Date(d.date))}
                          cy={graph.yScale(d.dataPoint)}
                          r={4}
                          fill={multilineColors[i]}
                        />
                        {/* Selected data circle */}
                        {selectedData.multiIndex === i &&
                          selectedData.index === j && (
                            <Circle
                              cx={graph.xScale(new Date(d.date))}
                              cy={graph.yScale(d.dataPoint)}
                              r={6}
                              stroke={multilineColors[i]}
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
                            setSelectedData({ multiIndex: i, index: j });
                          }}
                        />
                      </G>
                    ))}
                  </G>
                ))}
            </G>
          )}
        </Svg>
      </View>
      {/* Selected data and placeholder */}
      {selectedData.index !== null ? (
        <View style={styles.selectedContainer}>
          <Pressable
            onPress={() =>
              setSelectedData((prevData) => {
                if (prevData.index === 0) return prevData;
                return { ...prevData, index: prevData.index! - 1 };
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
            {
              renderVariant() // We moved to a function for better control and error prevention,
              // the old method crashed the app if data was selected and the graph type changed
              // even with cleanup functions or other state calls in useEffect
            }
          </View>
          <Pressable
            onPress={() =>
              setSelectedData((prevData) => {
                // We need to make sure that if this is a 2D array, we dont go out of bounds of nested the array
                if (isData2D()) {
                  if (
                    prevData.index ===
                    // We need to filter the data now due to how we are handling the rendering of selected rep counts data rendering
                    // of selected rep counts data and so button navigation accurately reflects the selected data from the raw data
                    (data as GraphDataSet[][]).filter((repArr) =>
                      multiSettings.selected.includes(repArr[0].reps!)
                    )[prevData.multiIndex!].length -
                      1
                  ) {
                    return prevData;
                  }
                }
                if (prevData.index === data.length - 1) return prevData;
                return { ...prevData, index: prevData.index! + 1 };
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
      {isData2D() && ( // We only render if the data array is 2D or we get breaking errors as technically the elements are there just not visible
        <ModalBase
          modalState={multiSettings.modal}
          setModalState={() =>
            setMultiSettings({ ...multiSettings, modal: false })
          }
        >
          <View style={styles.multilineModalBody}>
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalHeaderText}>REP COUNTS</Text>
              <Text style={styles.modalHeaderHelpText}>
                select the rep counts to view (max 10)
              </Text>
            </View>
            <ScrollView style={styles.multilineModalOptionsListContainer}>
              {(data as GraphDataSet[][]).map((d, i) => (
                <Pressable
                  key={`multiline-${(d as GraphDataSet[])[0].reps}-reps`}
                  onPress={() => handleMultilineSelection(d[0].reps as number)}
                  style={[
                    styles.multilineModalOptionContainer,
                    { borderTopWidth: i === 0 ? 1 : 0 },
                  ]}
                >
                  <View>
                    <Text style={styles.multilineModalOptionText}>
                      {d[0].reps} REPS
                    </Text>
                    <Text style={styles.multilineModalOptionSubtext}>
                      {d.length} WORKOUTS
                    </Text>
                  </View>
                  {multiSettings.selected.includes(d[0].reps as number) ? (
                    <MaterialCommunityIcons
                      name="checkbox-outline"
                      size={24}
                      color={"#60DD49"}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="checkbox-blank-outline"
                      size={24}
                      color={hexcodeLuminosity("#9F9F9F", 30)}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.multilineModalButtonContainer}>
              <Pressable
                style={styles.multilineModalOkButton}
                onPress={() =>
                  setMultiSettings({ ...multiSettings, modal: false })
                }
              >
                <Text style={styles.multilineModalOkButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </ModalBase>
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
  graphHintContainer: {
    position: "absolute",
    top: 20, // 16 is the top bound of the SVG element + 4 for "padding"
    left: 36, // 32 is the left bound of the SVG element + 4 for "padding"
    zIndex: 10,
    minWidth: "15%",
    padding: 4,
    backgroundColor: "#3F3C3C66",
    gap: 8,
    alignItems: "center",
    borderRadius: 2,
  },
  graphHintItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  graphHintItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  graphHintShowHideText: { fontSize: 11, color: "white" },
  multilineSettingsIcon: {
    position: "absolute",
    top: 18,
    transform: [{ translateX: -24 }],
    zIndex: 10,
  },
  multilineModalBody: {
    width: "80%",
    minHeight: "30%",
    maxHeight: "90%",
    backgroundColor: "#292929",
    borderRadius: 10,
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  modalHeaderContainer: {
    alignSelf: "flex-start",
  },
  modalHeaderText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  modalHeaderHelpText: {
    color: "white",
    fontSize: 13,
  },
  multilineModalOptionsListContainer: { width: "100%" },
  multilineModalOptionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    padding: 8,
    borderBottomWidth: 1,
    borderColor: hexcodeLuminosity("#3F3C3C", 20),
  },
  multilineModalOptionText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  multilineModalOptionSubtext: { color: "white", fontSize: 11 },
  multilineModalButtonContainer: { flexDirection: "row" },
  multilineModalOkButton: {
    flex: 1,
    width: "30%",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#2B72DE",
  },
  multilineModalOkButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
});
