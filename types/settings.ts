export interface AppSettings {
  unitSystem: "metric" | "imperial";
  calendarWeekStart: number;
}

export type AppSettingsKey = keyof AppSettings;

export type AppSettingsValue<K extends AppSettingsKey> = AppSettings[K];