import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Picker, PickerIOS } from "@react-native-picker/picker";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { eventEmitter } from "@/utils/eventEmitter";

interface BottomSheetPickeriOSProps {
  value: any;
  onChange: (value: any) => void;
  data: { label: string; value: any }[];
  eventName: string;
  closeEvents?: string[];
}

/**
 * BottomSheetPickeriOS is a component that renders a bottom sheet with an iOS 14 style wheel picker inside it.
 *
 * @remarks Despite using a cross-platform picker and bottom sheet library, this component is only intended for iOS.
 * The Picker provided to android by the library is not the same as the picker provided to iOS and as such this component
 * is designed to make up for the shortfall in the library.
 *
 * @component
 * @param {BottomSheetPickeriOSProps} props - The props for the component.
 * @param {any} props.value - The currently selected value in the picker.
 * @param {function} props.onChange - Callback function to handle value change in the picker.
 * @param {Array<{label: string, value: any}>} props.data - The data to be displayed in the picker.
 * @param {string} props.eventName - The event name to listen for presenting the bottom sheet.
 * @param {string[]} [props.closeEvents] - Optional array of event names to listen for dismissing the bottom sheet.
 *
 * @returns {JSX.Element} The BottomSheetPickeriOS component.
 *
 * @example
 * ```tsx
 * <BottomSheetPickeriOS
 *   value={value}
 *   onChange={setValue}
 *   data={data}
 *   eventName="presentBottomSheetPicker"
 *   closeEvents={["closeBottomSheetPicker"]}
 * />
 * ```
 */
const BottomSheetPickeriOS = ({
  value,
  onChange,
  data,
  eventName,
  closeEvents,
}: BottomSheetPickeriOSProps): JSX.Element => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    eventEmitter.on(eventName, handlePresent);

    if (closeEvents) {
      closeEvents.forEach((closeEvent) => {
        eventEmitter.off(closeEvent, handleClose);
      });
    }

    return () => {
      eventEmitter.off(eventName, handlePresent);

      if (closeEvents) {
        closeEvents.forEach((closeEvent) => {
          eventEmitter.off(closeEvent, handleClose);
        });
      }
    };
  }, []);

  const handlePresent = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  return (
    <BottomSheet
      //? $modal - What the fuck does this do? the decsription is trash, going to leave this here until i can experiment with it and find out
      enablePanDownToClose
      index={-1}
      ref={bottomSheetRef}
      enableOverDrag={false}
      handleStyle={styles.bottomSheetHandle}
      handleIndicatorStyle={{ backgroundColor: "#60DD49" }} // indicator color will be set through theme settings
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
    >
      <BottomSheetView style={{ backgroundColor: "#3F3C3C" }}>
        <PickerIOS
          itemStyle={{ color: "white" }}
          selectedValue={value}
          onValueChange={(itemValue: any) => onChange(itemValue)}
        >
          {data.map((item) => (
            <Picker.Item
              key={`${item.label}-${item.value}`}
              label={item.label}
              value={item.value}
            />
          ))}
        </PickerIOS>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default BottomSheetPickeriOS;

const styles = StyleSheet.create({
  bottomSheetHandle: {
    backgroundColor: "#3F3C3C",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
});
