import LottieView from "lottie-react-native";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";

interface LottieSplashScreenProps {
  setComplete: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Renders a Lottie animated component to use as a splashscreen.
 *
 * @component
 * @param {LottieSplashScreenProps} props - The component props.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setComplete - setState from parent component to manage rendering state based on animation status.
 * @returns {JSX.Element} The rendered Lottie animated splash screen component.
 */
const LottieSplashScreen = ({ setComplete }: LottieSplashScreenProps) => {
  const animation = useRef<LottieView>(null);

  return (
    <View>
      <LottieView
        ref={animation}
        source={require("../../assets/animations/atomifitSplashScreen.json")}
        autoPlay
        loop={false}
        speed={1}
        onAnimationFinish={() => setComplete(true)}
        style={styles.lottieViewStyle}
      />
    </View>
  );
};

export default LottieSplashScreen;

const styles = StyleSheet.create({
  lottieViewStyle: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0F0F0F",
  },
});
