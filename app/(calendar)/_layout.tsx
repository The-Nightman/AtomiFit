import { Stack } from "expo-router";

const CalendarLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ gestureEnabled: true }} />
    </Stack>
  );
};

export default CalendarLayout;
