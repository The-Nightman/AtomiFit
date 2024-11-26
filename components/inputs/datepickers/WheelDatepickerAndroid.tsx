import {
  Text,
  Pressable,
  Appearance,
  ViewStyle,
  TextStyle,
} from "react-native";
import {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

interface DatepickerProps {
  defaultDate: Date;
  datePickerButtonStyle: ViewStyle;
  datePickerTextStyle: TextStyle;
  handleDateChange: (date: Date) => void;
}

/**
 * WheelDatepickerAndroid component for Android renders a `spinner` style datepicker
 * via Android Imperative API using a pressable button.
 *
 * @remarks
 * State management is handled by the parent component. This component uses the `DateTimePickerAndroid`
 * module from `@react-native-community/datetimepicker` to display a date picker dialog.
 *
 *
 * @component
 * @param {DatepickerProps} props - The props of the component.
 * @param {Date} props.defaultDate - The default date to be displayed in the date picker.
 * @param {StyleProp<ViewStyle>} props.datePickerButtonStyle - The style to be applied to the date picker button.
 * @param {StyleProp<TextStyle>} props.datePickerTextStyle - The style to be applied to the date text.
 * @param {function} props.handleDateChange - The callback function to handle the date change event.
 *
 * @example
 * ```tsx
 * <DatepickerAndroid
 *   defaultDate={new Date()}
 *   datePickerButtonStyle={styles.button}
 *   datePickerTextStyle={styles.text}
 *   handleDateChange={(date) => console.log(date)}
 * />
 * ```
 */
const WheelDatepickerAndroid = ({
  defaultDate,
  datePickerButtonStyle,
  datePickerTextStyle,
  handleDateChange,
}: DatepickerProps) => {
  /**
   * Handles the change event from the DateTimePicker.
   *
   * @remarks
   * The valid types of events accessible through the `event.type` property are:
   * - `set`: The user has selected a date.
   * - `neutralButtonPressed`: The user has pressed the neutral button.
   * - `dismissed`: The user has dismissed the picker.
   *
   * @param {DateTimePickerEvent} event - The event object from the DateTimePicker.
   * @param {Date | undefined} selectedDate - The date selected by the user, or undefined if no date was selected.
   * 
   * @returns {void}
   */
  const onChange = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined
  ): void => {
    if (event.type === "set") {
      const currentDate = selectedDate || defaultDate;
      handleDateChange(currentDate);
    }
  };

  /**
   * Opens the Android date picker dialog with the specified configuration via Android imperative API.
   *
   * @remarks
   * This function uses `DateTimePickerAndroid.open` to display a date picker dialog.
   * The dialog will show the current date set by `defaultDate` and will use a spinner display mode.
   * The appearance of the negative and positive buttons will be enforced based on the current color scheme.
   *
   * @returns {void}
   */
  const onShow = (): void => {
    DateTimePickerAndroid.open({
      value: defaultDate,
      onChange, // Callback function to handle the date change, needs to be defined before calling `DateTimePickerAndroid.open`
      mode: "date",
      display: "spinner",
      // We set this here because on dark mode the default color may be black, unkown if this is per device or OS distro/version
      negativeButton: {
        label: "CANCEL",
        textColor: Appearance.getColorScheme() === "dark" ? "white" : "black",
      },
      positiveButton: {
        label: "OK",
        textColor: Appearance.getColorScheme() === "dark" ? "white" : "black",
      },
    });
  };

  return (
    <Pressable onPress={onShow} style={datePickerButtonStyle}>
      {defaultDate
        .toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .split(" ")
        .map((dateItem) => {
          return (
            <Text key={dateItem} style={datePickerTextStyle}>
              {
                // Remove non-alphanumeric characters because some locales make use of such characters
                dateItem.replace(/[^\p{L}\p{N}]/gu, "")
              }
            </Text>
          );
        })}
    </Pressable>
  );
};

export default WheelDatepickerAndroid;
