import { Stack } from "expo-router";

const _layout = () => {

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="search" options={{ gestureEnabled: true }} />
      <Stack.Screen name="create" options={{ gestureEnabled: true }} />
    </Stack>
  );
};

export default _layout;
