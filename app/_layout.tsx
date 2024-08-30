import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";
import LottieSplashScreen from "@/components/Splash/LottieSplashScreen";

const RootLayoutNav = () => {
  const [animComplete, setAnimComplete] = useState<boolean>(false);
  // Preload fonts and vector icons from @expo/vector-icons here for a seamless user experience
  const [loaded, error]: [boolean, Error | null] = useFonts({
    ...Entypo.font,
    ...MaterialIcons.font,
  });

  // Prevent the splash screen from auto-hiding so we can manually control it while the app is loading
  SplashScreen.preventAutoHideAsync();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // We want to hide the expo splash screen when the assets are loaded so we can play the
  // Lottie animation splash screen as a smooth transition from the static splash
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  // Make sure both the assets are loaded and the Lottie animation is complete before passing this cp
  if (!loaded || !animComplete) {
    return <LottieSplashScreen setComplete={setAnimComplete} />;
  }

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
