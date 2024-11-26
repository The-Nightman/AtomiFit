import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

interface DatepickerProps {
  defaultDate: Date;
  handleDateChange: (date: Date) => void;
}

/**
 * WheelDatepickeriOS component for iOS renders a pre-iOS 14 `spinner` style datepicker for date selection.
 *
 * @remarks
 * State management is handled by the parent component. This component uses the `DateTimePicker`
 * component from `@react-native-community/datetimepicker` to display a date picker dialog.
 *
 * @component
 * @param {DatepickerProps} props - The properties for the date picker component.
 * @param {Date} props.defaultDate - The default date to be displayed in the picker.
 * @param {(date: Date) => void} props.handleDateChange - Callback function to handle the date change event.
 *
 * @example
 * ```tsx
 * <WheelDatepickeriOS
 *   defaultDate={new Date()}
 *   handleDateChange={(date) => console.log(date)}
 * />
 * ```
 */
const WheelDatepickeriOS = ({
  defaultDate,
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

  return (
    <DateTimePicker
      value={new Date(defaultDate)}
      mode="date"
      display="spinner"
      onChange={onChange}
    />
  );
};

export default WheelDatepickeriOS;
