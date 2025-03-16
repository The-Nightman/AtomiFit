import { ActivityIndicator, StyleSheet, View } from "react-native";

const LoadingIndicator = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={"large"} color={"#60DD49"} />
    </View>
  );
};

export default LoadingIndicator;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
