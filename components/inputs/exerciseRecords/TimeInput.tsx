import {
  ColorValue,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";
import SelectTextInput from "../SelectTextInput";
import { TextInput } from "react-native-gesture-handler";
import { RefObject, useEffect, useRef, useState } from "react";
import { formatTime } from "@/utils/formatTime";

interface TimeInputProps {
  value: number;
  onChangeFunc: (val: string) => void;
  onBlurFunc: () => void;
  style: StyleProp<TextStyle>;
  focusStyle: StyleProp<TextStyle>;
  selectionColor: ColorValue;
  suffix: string;
}

const TimeInput = ({
  value,
  onChangeFunc,
  onBlurFunc,
  style,
  focusStyle,
  selectionColor,
  suffix,
}: TimeInputProps) => {
  const [modalState, setModalState] = useState(false);
  const [state, setState] = useState({
    raw: value,
    hours: 0,
    minutes: 0,
    seconds: 0,
    focus: false,
  });
  const hoursInputRef = useRef<TextInput>(null);
  const minutesInputRef = useRef<TextInput>(null);
  const secondsInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const { hours, minutes, seconds } = processTime(value);

    setState({ ...state, hours, minutes, seconds });
  }, []);

  const processTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return { hours: hrs, minutes: mins, seconds: secs };
  };

  const handleChange = (val: string, unit: "hr" | "m" | "s") => {
    const numVal = Number(val);
    setState((prevState) => {
      const updatedTime = {
        ...prevState,
        [unit === "hr" ? "hours" : unit === "m" ? "minutes" : "seconds"]:
          numVal,
      };
      const rawTime =
        updatedTime.hours * 3600 +
        updatedTime.minutes * 60 +
        updatedTime.seconds;
      return { ...updatedTime, raw: rawTime };
    });
  };

  const handleFocus = (ref:RefObject<TextInput>) => {
    if (ref.current) {
      ref.current.setSelection(0, 2);
    }
    setState({ ...state, focus: true });
  };

  const handleBlur = () => {
    setState({ ...state, focus: false });
  };

  const handleContainerFocusStyle = () => {
    if (
      hoursInputRef.current?.isFocused() ||
      minutesInputRef.current?.isFocused() ||
      secondsInputRef.current?.isFocused()
    ) {
      return true;
    }
  };

  console.log("render");
  return (
    <>
      {/* // <SelectTextInput
    //   inputType={"decimal"}
    //   value={value}
    //   validation={/^\d*$/}
    //   onChangeFunc={onChangeFunc}
    //   onBlurFunc={onBlurFunc}
    //   style={style}
    //   focusStyle={focusStyle}
    //   selectionColor={selectionColor}
    //   suffix={suffix}
    // /> */}
      <Pressable
        style={[styles.initialButtonStyle, modalState && focusStyle]}
        onPress={() => setModalState(true)}
      >
        <Text style={styles.initialButtonTextStyle}>{formatTime(value)}</Text>
      </Pressable>
      <Modal
        visible={modalState}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setModalState(false)}
      >
        <Pressable
          style={{
            backgroundColor: "#00000066",
            height: "100%",
            width: "auto",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setModalState(false)}
        >
          {/* Modal body, pressable is needed to negate parent as pointerEvents is not working as required or stated */}
          <Pressable
            style={{
              backgroundColor: "#292929",
              borderRadius: 10,
              width: "80%",
              height: "30%",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
            }}
          >
            {/* Input container */}
            <View
              style={[
                {
                  // width: "65%",
                  flexDirection: "row",
                  backgroundColor: "#3F3C3C",
                  borderRadius: 10,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 12,
                },
                handleContainerFocusStyle() && { backgroundColor: "#60DD49" },
              ]}
            >
              <TextInput
                keyboardType="numeric"
                value={state.hours ? state.hours.toString() : ""}
                onChangeText={(text) => handleChange(text, "hr")}
                onFocus={() => handleFocus(hoursInputRef)}
                onBlur={() => handleBlur()}
                style={[
                  styles.textInputStyle,
                  hoursInputRef.current?.isFocused() && styles.inputFocusStyles,
                ]}
                selectionColor={selectionColor}
                placeholder="HH"
                placeholderTextColor={"gray"}
                maxLength={2}
                ref={hoursInputRef}
              />
              <Text style={styles.textInputStyle}> : </Text>
              <TextInput
                keyboardType="numeric"
                value={
                  state.minutes
                    ? state.minutes.toString()
                    : state.hours
                    ? "00"
                    : ""
                }
                onChangeText={(text) => handleChange(text, "m")}
                onFocus={() => handleFocus(minutesInputRef)}
                onBlur={() => handleBlur()}
                style={[
                  styles.textInputStyle,
                  minutesInputRef.current?.isFocused() &&
                    styles.inputFocusStyles,
                ]}
                selectionColor={selectionColor}
                placeholder="MM"
                placeholderTextColor={"gray"}
                maxLength={2}
                ref={minutesInputRef}
              />
              <Text style={styles.textInputStyle}> : </Text>
              <TextInput
                keyboardType="numeric"
                value={
                  state.seconds
                    ? state.seconds.toString()
                    : state.minutes
                    ? "00"
                    : ""
                }
                onChangeText={(text) => handleChange(text, "s")}
                onFocus={() => handleFocus(secondsInputRef)}
                onBlur={() => handleBlur()}
                style={[
                  styles.textInputStyle,
                  secondsInputRef.current?.isFocused() &&
                    styles.inputFocusStyles,
                ]}
                selectionColor={selectionColor}
                placeholder="SS"
                placeholderTextColor={"gray"}
                maxLength={2}
                ref={secondsInputRef}
              />
            </View>
            <View style={{flexDirection:"row", gap:16}}>
              <Pressable style={{flex:1, backgroundColor:"#60DD49", borderRadius:10, padding:10, alignItems:"center" }}>
                <Text style={{fontSize:20, fontWeight:"bold", color:"white"}}>SAVE</Text>
              </Pressable>
              <Pressable style={{flex:1, backgroundColor:"#CD2C2C", borderRadius:10, padding:10, alignItems:"center" }}>
                <Text style={{fontSize:20, fontWeight:"bold", color:"white"}}>CANCEL</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default TimeInput;

const styles = StyleSheet.create({
  initialButtonStyle: {
    flex: 1,
    backgroundColor: "#3F3C3C",
    borderRadius: 10,
    justifyContent: "center",
  },
  initialButtonTextStyle: {
    color: "white",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
  },
  inputFocusStyles: { color: "black" },
  inputContainer: {
    flex: 1.4,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#3F3C3C",
    borderRadius: 10,
    alignItems: "center",
  },
  textInputStyle: {
    flex: 1,
    color: "white",
    fontSize: 35,
    fontWeight: "500",
    textAlign: "center",
  },
});
