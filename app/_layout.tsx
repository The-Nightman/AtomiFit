import React from "react";
import { Stack } from "expo-router";

const RootLayoutNav = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F0F0F" },
      }}
    >
      <Stack.Screen name="(calendar)" options={{ gestureEnabled: true }} />
      <Stack.Screen name="about" options={{ gestureEnabled: true }} />
    </Stack>
  );
};

export default RootLayoutNav;
