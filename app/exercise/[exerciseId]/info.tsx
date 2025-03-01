import { View, Text, Dimensions, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { ScrollView } from "react-native-gesture-handler";
import { useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { eq } from "drizzle-orm";

/**
 * Component that displays detailed information about a specific exercise.
 * It fetches exercise data from the database using the exercise ID from the local search parameters.
 * The component includes a video player that plays the associated exercise video and displays 
 * other exercise details such as category and notes.
 *
 * @returns {JSX.Element} The exercise information component.
 */
const info = (): JSX.Element => {
  const [exerciseData, setExerciseData] = useState<{
    category_colour: string;
    category: string;
    notes: string;
    mp4Url: string;
  }>({ category_colour: "", category: "", notes: "", mp4Url: "" });
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { width } = Dimensions.get("window");
  const { db } = useContext(DrizzleContext);

  useEffect(() => {
    const getExerciseData = async (): Promise<void> => {
      const mp4Url = await db
        .select({
          category_colour: schema.categories.colour,
          category: schema.categories.name,
          notes: schema.exercises.notes,
          mp4Url: schema.exercises.mp4Url,
        })
        .from(schema.exercises)
        .leftJoin(
          schema.categories,
          eq(schema.exercises.category_id, schema.categories.id)
        )
        .where(eq(schema.exercises.id, Number(exerciseId)));

      setExerciseData({
        category_colour: mp4Url[0].category_colour || "#000000", // by design this shouldnt be an issue but we have a fallback, just in case
        category: mp4Url[0].category || "Unknown",
        notes: mp4Url[0].notes,
        mp4Url: mp4Url[0].mp4Url,
      });
    };

    getExerciseData();
  }, []);

  // Video player instance initialization with the specific properties we need
  const player = useVideoPlayer(exerciseData.mp4Url, (player) => {
    player.loop = true;
    player.play();
    player.staysActiveInBackground = true; // There is no elegant solution to keep the video playing when the app is refocused so we keep it active in the background
    player.muted = true; // Factory shipped videos do not contain audio however user videos may contain audio and we want to mute them
    player.audioMixingMode = "mixWithOthers"; //! allow other audio to play, this is absolutely critical for music being a gym app after all
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContentStyle}>
      {exerciseData.mp4Url && (
        <VideoView
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          contentFit="fill"
          nativeControls={false}
          style={{ width: width, height: width }}
        />
      )}
      <View style={styles.subContainer}>
        <View style={styles.categoryContainer}>
          <View
            style={[
              styles.categoryIndicator,
              {
                backgroundColor: exerciseData.category_colour,
                borderColor: hexcodeLuminosity(
                  exerciseData.category_colour,
                  40
                ),
              },
            ]}
          />
          <Text style={styles.categoryTitle}>
            {exerciseData.category.toLocaleUpperCase()}
          </Text>
        </View>
        <Text style={styles.notes}>{exerciseData.notes}</Text>
      </View>
    </ScrollView>
  );
};

export default info;

const styles = StyleSheet.create({
  scrollViewContentStyle: { gap: 16, paddingBottom: 32 },
  subContainer: { gap: 16, paddingHorizontal: 8 },
  categoryContainer: { flexDirection: "row", gap: 8 },
  categoryIndicator: {
    height: 16,
    width: 16,
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: 1.5,
  },
  categoryTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  notes: {
    color: "white",
    fontSize: 17,
  },
});
