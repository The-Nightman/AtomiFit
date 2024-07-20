import React from "react";
import { Stack } from "expo-router";

const RootLayoutNav = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(calendar)" options={{ gestureEnabled: true }} />
      <Stack.Screen name="about" options={{ gestureEnabled: true }} />
    </Stack>
  );
};

export default RootLayoutNav;
