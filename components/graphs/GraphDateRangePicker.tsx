import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import ModalBase from "../modals/ModalBase";
import { useEffect, useState } from "react";
import { LineGraphOptions } from "@/types/graphs";
import WheelDatepickeriOS from "../inputs/datepickers/WheelDatepickeriOS";
import WheelDatepickerAndroid from "../inputs/datepickers/WheelDatepickerAndroid";

interface dataDateRange {
  startDate: string;
  endDate: string;
}

interface GraphDateRangePickerProps {
  modalVisible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  dataDateRange: dataDateRange;
  setDateRange: React.Dispatch<React.SetStateAction<LineGraphOptions>>;
  selectedOptions: LineGraphOptions;
}

/**
 * A component that provides a date range picker for graphs.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {boolean} props.modalVisible - State to control the visibility of the modal.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setModalVisible - Function to set the visibility of the modal.
 * @param {dataDateRange} props.dataDateRange - The initial date range data containing the `startDate` and `endDate` properties.
 * @param {React.Dispatch<React.SetStateAction<LineGraphOptions>>} props.setDateRange - Function to set the selected date range.
 * @param {LineGraphOptions} props.selectedOptions - The selected graph options containing the date range options.
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @example
 * <GraphDateRangePicker
 *   modalVisible={modalVisible}
 *   setModalVisible={setModalVisible}
 *   dataDateRange={dataDateRange}
 *   setDateRange={setDateRange}
 *   selectedOptions={selectedOptions}
 * />
 */
const GraphDateRangePicker = ({
  modalVisible,
  setModalVisible,
  dataDateRange,
  setDateRange,
  selectedOptions,
}: GraphDateRangePickerProps): JSX.Element => {
  const [date, setDate] = useState({
    startDate: new Date(dataDateRange.startDate),
    endDate: new Date(dataDateRange.endDate),
    firstDateSet: false,
  });

  useEffect(() => {
    setDate({
      ...date,
      startDate: new Date(dataDateRange.startDate),
      endDate: new Date(dataDateRange.endDate),
    });
  }, [
    // We need to make sure this component has the most up-to-date date information as initially
    // the date will be set to the current date until database data is fetched
    dataDateRange.startDate,
    dataDateRange.endDate,
    // We also need to make sure that when the custom date range is cleared the date picker resets
    // these dependencies take care of that without resorting to elevating functions and such or using contexts
    selectedOptions.startDate,
    selectedOptions.endDate,
  ]);

  /**
   * Handles the change of date in the date range picker.
   * If the first date is already set, it sets the end date.
   * Otherwise, it sets the start date.
   *
   * @param {Date} dateValue - The new date value to be set.
   *
   * @returns {void}
   */
  const handleDateChange = (dateValue: Date): void => {
    if (date.firstDateSet) {
      setDate({ ...date, endDate: dateValue });
    } else {
      setDate({ ...date, startDate: dateValue });
    }
  };

  /**
   * Advances the date range picker to the next value in the date range.
   * Sets the `firstDateSet` property of the date state to `true`.
   *
   * @returns {void}
   */
  const handleNext = (): void => {
    setDate({ ...date, firstDateSet: true });
  };

  /**
   * Handles setting the date range by updating the state with the selected options.
   * It formats the start and end dates to ISO string format (YYYY-MM-DD) and updates the date range in parent state.
   * Additionally, it resets the date state by setting `firstDateSet` to `false` and hides the modal.
   *
   * @remarks
   * This function does not directly reset the `startDate` and `endDate` properties of the date state, this is
   * handled by the `useEffect` hook that listens for changes in the `dataDateRange` prop and the `selectedOptions` prop
   * and will update the date state accordingly when changes are made in the parent component.
   *
   * @returns {void}
   */
  const handleSetDateRange = (): void => {
    setDateRange({
      ...selectedOptions,
      startDate: date.startDate.toISOString().split("T")[0],
      endDate: date.endDate.toISOString().split("T")[0],
    });
    setDate({
      ...date,
      firstDateSet: false,
    });
    setModalVisible(false);
  };

  /**
   * Resets the date range to the initial values and hides the modal.
   *
   * This function is called when the user cancels the date selection.
   * It sets the date range back to the original `dataDateRange` values
   * and hides the modal by setting `setModalVisible` to `false`.
   *
   * @returns {void}
   */
  const handleCancel = (): void => {
    setDate({
      startDate: new Date(dataDateRange.startDate),
      endDate: new Date(dataDateRange.endDate),
      firstDateSet: false,
    });
    setModalVisible(false);
  };

  return (
    <ModalBase
      modalState={modalVisible}
      setModalState={setModalVisible}
      onDismiss={handleCancel}
    >
      <View style={styles.modalBody}>
        <Text style={styles.modalTitle}>
          {date.firstDateSet ? "END DATE" : "START DATE"}
        </Text>
        {Platform.OS === "ios" ? (
          // We use seperate components for iOS and Android as the Android Imperative API is a
          // better approach for that platform than a component based approach see:
          // https://github.com/react-native-datetimepicker/datetimepicker?tab=readme-ov-file#android-imperative-api
          <WheelDatepickeriOS
            defaultDate={date.firstDateSet ? date.endDate : date.startDate}
            handleDateChange={handleDateChange}
          />
        ) : (
          <View style={styles.androidContainer}>
            <WheelDatepickerAndroid
              defaultDate={date.firstDateSet ? date.endDate : date.startDate}
              handleDateChange={handleDateChange}
              datePickerButtonStyle={styles.androidDatepicker}
              datePickerTextStyle={styles.androidDatepickerText}
            />
          </View>
        )}
        <View style={styles.modalButtonContainer}>
          <Pressable
            style={[styles.buttonBase, styles.cancelButton]}
            onPress={() => handleCancel()}
          >
            <Text style={styles.buttonText}>CANCEL</Text>
          </Pressable>
          {date.firstDateSet ? (
            <Pressable
              style={[styles.buttonBase, styles.saveButton]}
              onPress={() => handleSetDateRange()}
            >
              <Text style={styles.buttonText}>OK</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.buttonBase, styles.nextButton]}
              onPress={() => handleNext()}
            >
              <Text style={styles.buttonText}>NEXT</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ModalBase>
  );
};

export default GraphDateRangePicker;

const styles = StyleSheet.create({
  modalBody: {
    width: "85%",
    minHeight: "30%",
    maxHeight: "90%",
    backgroundColor: "#292929",
    borderRadius: 10,
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    alignSelf: "flex-start",
  },
  androidContainer: {
    flex: 1,
    flexShrink: 0,
    flexBasis: 100,
    justifyContent: "center",
  },
  androidDatepicker: {
    flexDirection: "row",
    minWidth: "90%",
    backgroundColor: "#ffffff26",
    padding: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: "space-between",
  },
  androidDatepickerText: {
    textAlign: "center",
    fontSize: 20,
    color: "white",
  },
  modalButtonContainer: { flexDirection: "row", gap: 16 },
  buttonBase: {
    flex: 1,
    width: "30%",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#2B72DE",
  },
  saveButton: {
    backgroundColor: "#60DD49",
  },
  cancelButton: {
    backgroundColor: "#CD2C2C",
  },
  buttonText: { fontSize: 20, fontWeight: "bold", color: "white" },
});
