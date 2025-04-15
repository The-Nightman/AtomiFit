export interface AppSettings {
  unitSystem: "metric" | "imperial";
  calendarWeekStart: number;
  keepAwake: boolean;
}

export type AppSettingsKey = keyof AppSettings;

export type AppSettingsValue<K extends AppSettingsKey> = AppSettings[K];