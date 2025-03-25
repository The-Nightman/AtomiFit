import { useContext, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AtomiFitShortSVG from "@/components/Svg/AtomiFitShortSVG";
import {
  Entypo,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { eventEmitter } from "@/utils/eventEmitter";
import { Drawer } from "expo-router/drawer";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerHeaderProps,
  DrawerItemList,
} from "@react-navigation/drawer";
import { DrizzleContext } from "@/contexts/drizzleContext";
import * as schema from "@/database/schema";
import { Category } from "@/types/categories";
import { hexcodeLuminosity } from "@/utils/hexcodeLuminosity";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WorkoutPreviewModal from "@/components/modals/WorkoutPreviewModal";
import { Storage } from "expo-sqlite/kv-store";
import TimelineSettingsModal from "@/components/modals/TimelineSettingsModal";

interface CategoryFilterState {
  categories: Category[];
  filters: Category["id"][];
}

interface TimelinePreferences {
  timelineCategoryMarkers: boolean;
}

/**
 * CalendarLayout component.
 *
 * This component represents the layout for the calendar view and list view.
 * It includes a drawer layout with custom header and drawer components.
 *
 * @returns {JSX.Element} The rendered CalendarLayout component.
 */
const CalendarLayout = (): JSX.Element => {
  const [catFilterState, setCatFilterState] = useState<CategoryFilterState>({
    categories: [],
    filters: [],
  });
  const [timelinePreferences, setTimelinePreferences] =
    useState<TimelinePreferences>({ timelineCategoryMarkers: true });
  const [timelineSettingsModal, setTimelineSettingsModal] =
    useState<boolean>(false);
  const { db } = useContext(DrizzleContext);

  useEffect(() => {
    const initFilters = async () => {
      const categories: Category[] = await db.select().from(schema.categories);

      setCatFilterState({
        categories,
        filters: [],
      });
    };
    initFilters();
  }, []);

  useEffect(() => {
    const initPrefs = async () => {
      const savedTimelinePrefs: [string, string | null][] =
        await Storage.multiGet(["timelineCategoryMarkers"]);

      for (const [key, value] of savedTimelinePrefs) {
        // We do this here instead of the settings context because this is a specific preference
        // rather than app-wide setting and we want some separation of concerns
        if (!value) {
          await Storage.setItem(
            key,
            timelinePreferences[key as keyof TimelinePreferences].toString()
          );
        } else {
          setTimelinePreferences({
            ...timelinePreferences,
            [key]: value === "true",
          });
        }
      }
    };
    initPrefs();
  }, []);

  useEffect(() => {
    eventEmitter.emit("categoryFilterChange", catFilterState.filters);
  }, [catFilterState.filters]);

  return (
    <>
      <Drawer
        screenOptions={{
          header: (props) => (
            <DrawerHeader
              {...props}
              timelineSettingsModal={timelineSettingsModal}
              setTimelineSettingsModal={setTimelineSettingsModal}
            />
          ),
          drawerActiveTintColor: "#60DD49",
          drawerInactiveTintColor: "white",
          sceneStyle: { backgroundColor: "#0F0F0F" }, //* This is the equivalent of contentStyle in the Stack navigator
          drawerStyle: { backgroundColor: hexcodeLuminosity("#0F0F0F", 20) },
          drawerType: "slide",
          drawerPosition: "left",
        }}
        drawerContent={(props) => (
          <CustomDrawer
            {...props}
            setCatFilterState={setCatFilterState}
            catFilterState={catFilterState}
          />
        )}
        initialRouteName="calendar"
      >
        <Drawer.Screen
          name="calendar"
          options={{
            title: "Calendar View",
            drawerIcon: ({ color, focused }) => (
              <MaterialIcons
                name="calendar-month"
                size={24}
                color={focused ? color : "white"}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="listView"
          options={{
            title: "List View",
            drawerIcon: ({ color, focused }) => (
              <MaterialIcons
                name="format-list-bulleted"
                size={24}
                color={focused ? color : "white"}
              />
            ),
          }}
        />
      </Drawer>
      <View>
        <WorkoutPreviewModal />
        <TimelineSettingsModal
          visible={timelineSettingsModal}
          setVisible={setTimelineSettingsModal}
          timelinePreferencesState={timelinePreferences}
          setTimelinePreferencesState={setTimelinePreferences}
        />
      </View>
    </>
  );
};

/**
 * DrawerHeader component renders a custom header with a custom navigation menu button.
 *
 * @param {DrawerHeaderProps} props - The properties for the DrawerHeader component.
 *
 * @returns {JSX.Element} The rendered DrawerHeader component.
 *
 * @component
 * @example
 * <Drawer
 *   screenOptions={{
 *     header: (props) => <DrawerHeader {...props} />,
 *   }}
 * >
 *   <Drawer.Screen name="screen" />
 * </Drawer>
 */
const DrawerHeader = (
  props: DrawerHeaderProps & {
    timelineSettingsModal: boolean;
    setTimelineSettingsModal: React.Dispatch<React.SetStateAction<boolean>>;
  }
): JSX.Element => {
  return (
    <View style={styles.headerContainer}>
      <View>
        <Pressable
          accessibilityLabel="Open Navigation Menu"
          style={styles.headerMenuButtonContainer}
          onPress={() => props.navigation.openDrawer()}
        >
          <Entypo name="menu" size={45} color="black" />
          <AtomiFitShortSVG color={"#0F0F0F"} />
        </Pressable>
      </View>
      <View style={styles.headerButtonsContainer}>
        <Pressable
          accessibilityLabel="Return to Today"
          style={styles.calendarSkipButton}
          onPress={() => {
            eventEmitter.emit("calendarReturnToToday");
          }}
        >
          {({ pressed }) => (
            <MaterialIcons
              name="today"
              size={32}
              color={pressed ? "#2D6823" : "#60DD49"}
            />
          )}
        </Pressable>
        <Pressable
          onPress={() =>
            props.setTimelineSettingsModal(!props.timelineSettingsModal)
          }
          style={styles.headerSettingsButton}
        >
          {({ pressed }) => (
            <Entypo
              name="dots-three-vertical"
              size={32}
              color={pressed ? "#2D6823" : "#60DD49"}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
};

interface CustomDrawerProps extends DrawerContentComponentProps {
  setCatFilterState: React.Dispatch<React.SetStateAction<CategoryFilterState>>;
  catFilterState: CategoryFilterState;
}

/**
 * CustomDrawer component renders a custom drawer with category filters and navigation options.
 *
 * @param {CustomDrawerProps} props - The props for the CustomDrawer component.
 * @param {React.Dispatch<React.SetStateAction<CategoryFilterState>>} props.setCatFilterState - Function to update the category filter state.
 * @param {CategoryFilterState} props.catFilterState - The current state of the category filters.
 *
 * @returns {JSX.Element} The rendered CustomDrawer component.
 *
 * @component
 * @example
 * <Drawer
 *   drawerContent={(props) => (
 *     <CustomDrawer
 *       {...props}
 *       setCatFilterState={setCatFilterState}
 *       catFilterState={catFilterState}
 *     />
 *   )}
 * >
 *   <Drawer.Screen name="screen" />
 * </Drawer>
 */
const CustomDrawer = ({
  setCatFilterState,
  catFilterState,
  ...props
}: CustomDrawerProps): JSX.Element => {
  const { bottom } = useSafeAreaInsets();

  return (
    <DrawerContentScrollView
      contentContainerStyle={[
        styles.drawerCustomContainer,
        { paddingBottom: bottom },
      ]}
      {...props}
    >
      <View style={{ gap: 32 }}>
        <TouchableOpacity
          style={styles.drawerBackButton}
          onPress={() => router.dismiss()}
        >
          {Platform.OS === "ios" ? (
            <MaterialIcons name="arrow-back-ios-new" size={28} color="white" />
          ) : (
            <MaterialIcons name="arrow-back" size={28} color="white" />
          )}
          <Text style={styles.drawerBackButtonText}>Back</Text>
        </TouchableOpacity>

        <View>
          <DrawerItemList {...props} />
        </View>
      </View>

      <View style={styles.drawerFilterContainer}>
        <Text style={styles.filterItemText}>Filter by Category</Text>
        {catFilterState.categories.map((category) => (
          <Pressable
            onPress={() => {
              setCatFilterState((prev) => {
                if (prev.filters.includes(category.id)) {
                  return {
                    ...prev,
                    filters: prev.filters.filter((id) => id !== category.id),
                  };
                } else {
                  return { ...prev, filters: [...prev.filters, category.id] };
                }
              });
            }}
            key={`${category.id}-${category.name}`}
            style={styles.filterItem}
          >
            <View style={styles.filterSubcontainer}>
              <View
                style={[
                  styles.categoryMarker,
                  { backgroundColor: category.colour },
                ]}
              />
              <Text style={styles.filterItemText}>{category.name}</Text>
            </View>
            {catFilterState.filters.includes(category.id) ? (
              <MaterialCommunityIcons
                name="checkbox-outline"
                size={24}
                color={"#60DD49"}
              />
            ) : (
              <MaterialCommunityIcons
                name="checkbox-blank-outline"
                size={24}
                color={hexcodeLuminosity("#9F9F9F", 30)}
              />
            )}
          </Pressable>
        ))}
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    height: 120,
    backgroundColor: "#60DD49",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerMenuButtonContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonsContainer: {
    flexDirection: "row",
    height: 64,
    alignItems: "center",
    gap: 16,
    marginRight: 12,
  },
  calendarSkipButton: {
    flexDirection: "row",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#292929",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerSettingsButton: {
    height: 42,
    width: 42,
    backgroundColor: "#292929",
    borderRadius: 22,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerCustomContainer: { flex: 1 },
  drawerBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
  },
  drawerBackButtonText: {
    color: "white",
    fontSize: 20,
    textAlignVertical: "center",
  },
  drawerFilterContainer: {
    marginTop: "auto",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#555555",
    gap: 4,
  },
  filterItem: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
    padding: 6,
  },
  filterSubcontainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterItemText: { fontSize: 20, color: "white" },
  categoryMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default CalendarLayout;
