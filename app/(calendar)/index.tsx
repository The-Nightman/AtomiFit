import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Entypo } from "@expo/vector-icons";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";
import Calendar from "@/components/Calendar";

const index = () => {
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          display: "flex",
          height: 120,
          backgroundColor: "#60DD49",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <View>
            <AtomiFitShortSVG color={"#0F0F0F"} />
          </View>
          <Text style={{ color: "white" }}>Calendar</Text>
        </View>
      </View>
      <Calendar />
    </View>
  );
};

const styles = StyleSheet.create({
  monthContainer: {
    marginVertical: 20,
    alignSelf: "center",
    alignItems: "center",
    width: "85%",
  },
  monthName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  weekDays: {
    color: "white",
    fontSize: 13,
    width: 36,
    marginBottom: 5,
    textAlign: "center",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  dayButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    borderRadius: 20,
    marginVertical: 4,
  },
  selectedDayButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    backgroundColor: "#60DD49",
    borderRadius: 20,
    marginVertical: 4,
  },
  dayBlank: {
    width: 36,
    height: 36,
    marginVertical: 4,
  },
  dayText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});

export default index;
