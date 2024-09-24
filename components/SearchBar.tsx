import { Pressable, StyleSheet, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { AntDesign } from "@expo/vector-icons";

interface SearchBarProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * SearchBar component renders a search input field with a search icon and a clear button.
 *
 * @param {SearchBarProps} props - The properties object.
 * @param {string} props.search - The current search text.
 * @param {React.Dispatch<React.SetStateAction<string>>} props.setSearch - Function to update the search text.
 *
 * @returns {JSX.Element} The rendered search bar component.
 */
const SearchBar = ({ search, setSearch }: SearchBarProps): JSX.Element => {
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <AntDesign name="search1" size={24} color="#60DD49" />
        <TextInput
          style={styles.input}
          placeholder="Search..."
          placeholderTextColor={"#B9B9B9"}
          onChange={(e) => setSearch(e.nativeEvent.text)}
          value={search}
        />
        <Pressable onPress={() => setSearch("")}>
          <AntDesign name="close" size={24} color="#B9B9B9" />
        </Pressable>
      </View>
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    height: 76,
    backgroundColor: "#3F3C3C",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  inputContainer: {
    height: 40,
    flexDirection: "row",
    backgroundColor: "black",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 22,
  },
});
