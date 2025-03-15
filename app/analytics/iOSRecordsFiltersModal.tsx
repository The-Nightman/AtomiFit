import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ExerciseTypes } from "@/types/exercise";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { exerciseTypes } from "@/constants/ExerciseTypes";
import PickeriOSButton from "@/components/inputs/pickers/PickeriOSButton";
import BottomSheetPickeriOS from "@/components/inputs/pickers/BottomSheetPickeriOS";
import { eventEmitter } from "@/utils/eventEmitter";

interface Options {
  catPickerData: { id: number; name: string }[];
  categoryFilter: "all" | number;
  typeFilter: ExerciseTypes;
  hideEmpty: boolean;
}

/**
 * iOSRecordsFiltersModal screen provides a modal interface via expo-router for filtering iOS records.
 * It allows users to select a category filter, type filter, and toggle the display of empty records.
 * The selected filters are passed as JSON string parameters to the records page upon confirmation.
 * 
 * @remarks This screen makes use of the `PickeriOSButton` and `BottomSheetPickeriOS` components pair as
 * due to the function of the `BottomSheetPickeriOS` component as a modal, it is not possible to use it
 * in a shared modal component on iOS due to limitations around nested modals.
 *
 * @returns {JSX.Element} The rendered iOSRecordsFiltersModal screen.
 */
const iOSRecordsFiltersModal = (): JSX.Element => {
  const [inputState, setInputState] = useState<Options>({
    catPickerData: [],
    categoryFilter: "all",
    typeFilter: "Weight And Reps",
    hideEmpty: false,
  });
  const screenWidth = Dimensions.get("window").width;
  // We are sending the options as stringified json in params due to an array of
  // objects not being able to be passed through the router
  // Expected types: { catPickerData: { id: number; name: string }[]; categoryFilter: "all" | number; typeFilter: ExerciseTypes; hideEmpty: boolean; }
  const { options } = useLocalSearchParams<{ options: string }>();
  const togglePosition = useSharedValue(0);
  const textColor = useSharedValue(0);

  useEffect(() => {
    const {
      catPickerData,
      categoryFilter,
      typeFilter,
      hideEmpty,
    }: {
      catPickerData: Options["catPickerData"];
      categoryFilter: Options["categoryFilter"];
      typeFilter: Options["typeFilter"];
      hideEmpty: Options["hideEmpty"];
    } = JSON.parse(options);
    setInputState({
      catPickerData,
      categoryFilter:
        categoryFilter === "all"
          ? "all"
          : parseInt(categoryFilter as unknown as "all" | string), // Int values will be a string since they were passed through the router
      typeFilter,
      hideEmpty,
    });
  }, []);

  useEffect(() => {
    togglePosition.value = withSpring(inputState.hideEmpty ? 1 : 0, {
      damping: 15,
      stiffness: 120,
      mass: 1,
    });

    textColor.value = withTiming(inputState.hideEmpty ? 0 : 1, {
      duration: 300,
    });
  }, [inputState.hideEmpty]);

  // The animated style controlling the position of the toggle background between the 2 states
  const toggleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: (togglePosition.value * (screenWidth * 0.85)) / 2 },
      ],
    };
  });

  const leftTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(textColor.value, [0, 1], ["#FFFFFF", "#000000"]),
  }));

  const rightTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(textColor.value, [0, 1], ["#000000", "#FFFFFF"]),
  }));

  /**
   * Confirms the selected filters and navigates to the records page with the applied filters.
   * The filters are passed as a JSON string in the URL parameters.
   * @returns {void}
   */
  const confirmFilters = (): void => {
    router.dismissTo({
      pathname: "/analytics/records",
      params: {
        filters: JSON.stringify({
          categoryFilter: inputState.categoryFilter,
          typeFilter: inputState.typeFilter,
          hideEmpty: inputState.hideEmpty,
        }),
      },
    });
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.FilterSectionContainer}>
          <Text style={styles.FilterSectionText}>CATEGORY FILTER:</Text>
          <PickeriOSButton
            text={
              inputState.categoryFilter === "all"
                ? "All"
                : inputState.catPickerData.find(
                    (cat: { id: number; name: string }) =>
                      cat.id === inputState.categoryFilter
                  )?.name ?? ""
            }
            onPress={() => eventEmitter.emit("openCategoryFilterPicker")}
          />
        </View>
        <View style={styles.FilterSectionContainer}>
          <Text style={styles.FilterSectionText}>TYPE FILTER:</Text>
          <PickeriOSButton
            text={inputState.typeFilter}
            onPress={() => eventEmitter.emit("openTypeFilterPicker")}
          />
        </View>
        <View style={styles.FilterSectionContainer}>
          <Text style={styles.FilterSectionText}>DISPLAY EMPTY:</Text>
          <View style={styles.toggleContainer}>
            <Animated.View
              style={[styles.toggleBackground, toggleAnimatedStyle]}
            />
            <Pressable
              style={styles.toggleOption}
              onPress={() => setInputState({ ...inputState, hideEmpty: false })}
            >
              <Animated.Text
                style={[
                  styles.toggleText,
                  leftTextStyle,
                  !inputState.hideEmpty ? styles.toggleActiveText : null,
                ]}
              >
                Show All
              </Animated.Text>
            </Pressable>
            <Pressable
              style={styles.toggleOption}
              onPress={() => setInputState({ ...inputState, hideEmpty: true })}
            >
              <Animated.Text
                style={[
                  styles.toggleText,
                  rightTextStyle,
                  inputState.hideEmpty ? styles.toggleActiveText : null,
                ]}
              >
                Hide Empty
              </Animated.Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.ButtonContainer}>
          <Pressable
            style={styles.confirmButton}
            onPress={() => confirmFilters()}
          >
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
      <BottomSheetPickeriOS
        eventName="openCategoryFilterPicker"
        data={[{ id: "all", name: "All" }, ...inputState.catPickerData].map(
          (category) => ({
            label: category.name,
            value: category.id,
          })
        )}
        value={inputState.categoryFilter}
        onChange={(value: "all" | number) =>
          setInputState({
            ...inputState,
            categoryFilter:
              value === "all"
                ? "all"
                : parseInt(value as unknown as "all" | string),
          })
        }
        closeEvents={["openTypeFilterPicker"]}
      />
      <BottomSheetPickeriOS
        eventName="openTypeFilterPicker"
        data={exerciseTypes.map((type) => ({ label: type, value: type }))}
        value={inputState.typeFilter}
        onChange={(value: ExerciseTypes) =>
          setInputState({ ...inputState, typeFilter: value })
        }
        closeEvents={["openCategoryFilterPicker"]}
      />
    </>
  );
};

export default iOSRecordsFiltersModal;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 64,
    padding: 32,
    gap: 32,
  },
  FilterSectionContainer: { width: "100%", gap: 8 },
  FilterSectionText: { fontSize: 17, color: "white", fontWeight: "600" },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#3F3C3C",
    borderRadius: 8,
    height: 40,
    position: "relative",
    overflow: "hidden",
  },
  toggleBackground: {
    position: "absolute",
    width: "50%",
    height: "100%",
    backgroundColor: "#60DD49",
    borderRadius: 8,
  },
  toggleOption: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  toggleText: {
    fontWeight: "500",
  },
  toggleActiveText: {
    fontWeight: "700",
  },
  ButtonContainer: { flexDirection: "row", gap: 16 },
  confirmButton: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#60DD49",
  },
  buttonText: { fontSize: 20, fontWeight: "bold", color: "white" },
});
