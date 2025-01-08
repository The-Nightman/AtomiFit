import { createContext, useContext, useEffect, useState } from "react";
import { Storage } from "expo-sqlite/kv-store";
import {
  AppSettings,
  AppSettingsKey,
  AppSettingsValue,
} from "@/types/settings";

interface SettingsProviderProps {
  children: React.ReactNode;
}

interface SettingsContextProps {
  updateSetting: <K extends AppSettingsKey>(
    key: K,
    value: AppSettingsValue<K>
  ) => Promise<void>;
  appSettings: AppSettings | null;
}

/**
 * The context for accessing the Settings KV store in the rest of the app.
 */
export const SettingsContext = createContext<SettingsContextProps | null>(null);

/**
 * SettingsProvider component.
 *
 * @param {React.ReactNode} children - The children components.
 */
export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    // Clear the storage in development to prevent stale data
    //! IMPORTANT: this will also clear other preferences stored in the KV store
    //! throughout the app e.g. Graph options such as trendline, graphpoints etc.
    if (__DEV__) {
      Storage.clear();
    }

    /**
     * Initializes the default settings in the storage if they do not already exist.
     *
     * The default settings include:
     * - `unitSystem`: "metric"
     * - `calendarWeekStart`: 1
     *
     * For each setting, it checks if the key already exists in the storage. If the key does not exist,
     * it sets the key with the corresponding default value.
     *
     * @remarks The seeding portion of this functions serves as a one-time setup for the app settings
     * so non-null values exist whilst the user sets their preferences.
     *
     * @async
     * @returns {Promise<void>} A promise that resolves when the setup is complete.
     */
    const setup = async (): Promise<void> => {
      const defaultSettings = {
        unitSystem: "metric",
        calendarWeekStart: "1",
      };

      for (const [key, value] of Object.entries(defaultSettings)) {
        const existingKey = await Storage.getItem(key);
        if (!existingKey) {
          await Storage.setItem(key, value); 
        }
      }

      // We need to get all the keys for our settings and then parse into an object
      const keys = await Storage.getAllKeys();
      const settings = await Storage.multiGet(keys);

      const parsedSettings = settings.reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as { [key: string]: string | null });

      setAppSettings({
        unitSystem: parsedSettings.unitSystem as "metric" | "imperial",
        calendarWeekStart: parseInt(parsedSettings.calendarWeekStart as string), // We need to parse to int as it is stored as a string
      });
    };

    setup();
  }, []);

  /**
   * Updates a specific setting in the application settings.
   *
   * @template K - The type of the setting key.
   * @param {K} key - The key of the setting to update.
   * @param {AppSettingsValue<K>} value - The new value for the setting.
   * @returns {Promise<void>} A promise that resolves when the setting has been updated.
   */
  const updateSetting = async <K extends AppSettingsKey>(
    key: K,
    value: AppSettingsValue<K>
  ): Promise<void> => {
    await Storage.setItem(key, value.toString()); // We need to convert the value to a string as the storage only accepts strings
    if (appSettings) {
      setAppSettings({ ...appSettings, [key]: value });
    }
  };

  return (
    <SettingsContext.Provider value={{ updateSetting, appSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Custom hook to access the SettingsContext.
 *
 * @returns {SettingsContextProps} The settings context.
 */
export const useSettings = (): SettingsContextProps => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context as SettingsContextProps;
};
