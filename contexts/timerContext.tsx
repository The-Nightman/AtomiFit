import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Storage } from "expo-sqlite/kv-store";
import { Platform, Vibration } from "react-native";
import * as Notifications from "expo-notifications";
import { Sound } from "expo-av/build/Audio";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

interface TimerProviderProps {
  children: React.ReactNode;
}

interface TimerContextProps {
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  cancelTimer: () => void;
  setTimer: (time: number) => void;
  timerState: TimerState;
}

interface TimerState {
  selectedTime: number;
  time: number;
  active: boolean | "paused";
}

type TimerDispatch =
  | { type: "SET_SELECTED_TIME"; payload: number }
  | { type: "SET_ACTIVE"; payload: boolean }
  | { type: "DECREMENT_TIME" }
  | { type: "SET_PAUSED" }
  | { type: "RESUME_TIMER" }
  | { type: "CANCEL_TIMER" };

/**
 * Context for managing rest timer-related state and functionality within the application.
 */
export const TimerContext: React.Context<TimerContextProps | null> =
  createContext<TimerContextProps | null>(null);

/**
 * Reducer function to manage the dispatch of the timer state.
 *
 * Action Types:
 * - `"SET_SELECTED_TIME"`: Updates the `selectedTime` property in the state with the provided payload parsed to a fixed range.
 * - `"SET_ACTIVE"`: Sets the `time` to the `selectedTime` and updates the `active` property with the provided payload.
 * - `"DECREMENT_TIME"`: Decreases the `time` property by 1.
 * - `"SET_PAUSED"`: Sets the `active` property to `"paused"`.
 * - `"RESUME_TIMER"`: Sets the `active` property to `true`.
 * - `"CANCEL_TIMER"`: Resets the `time` to the `selectedTime` and sets `active` to `false`.
 * - `default`: Returns the current state if no action type matches as a fallback.
 *
 * @param {TimerState} state - The current state of the timer.
 * @param {TimerDispatch} action - The dispatched action containing the type and optional payload.
 * @returns {TimerState} The updated state based on the action type.
 */
const reducer = (state: TimerState, action: TimerDispatch): TimerState => {
  switch (action.type) {
    case "SET_SELECTED_TIME": {
      // 1 second to 90 minutes, this lets users use the rest timer as an interval timer. Not intended but yay for versatility
      const fixedRangeTime = Math.min(Math.max(action.payload, 1), 5400);
      return { ...state, selectedTime: fixedRangeTime };
    }
    case "SET_ACTIVE": {
      return { ...state, time: state.selectedTime, active: action.payload };
    }
    case "DECREMENT_TIME": {
      return { ...state, time: state.time - 1 };
    }
    case "SET_PAUSED": {
      return { ...state, active: "paused" };
    }
    case "RESUME_TIMER": {
      return { ...state, active: true };
    }
    case "CANCEL_TIMER": {
      return { ...state, time: state.selectedTime, active: false };
    }
    default:
      return state;
  }
};

/**
 * TimeProvider component.
 *
 * @param {React.ReactNode} children - The children components.
 */
export const TimerProvider = ({ children }: TimerProviderProps) => {
  const [timerState, dispatchTimerState] = useReducer<
    React.Reducer<TimerState, TimerDispatch>
  >(reducer, {
    selectedTime: 60, // These are just stand-in default values until the value is set from the KV store
    time: 60,
    active: false,
  });
  const [sound, setSound] = useState<Sound | null>(null);
  const notificationId = useRef<string | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    /**
     * Asynchronously sets up the timer context by retrieving the saved timer value from storage.
     * If no value is found, it initializes the storage with a default value of "60".
     * Otherwise, it parses the saved value and dispatches an action to update the timer state.
     *
     * @returns {Promise<void>} A promise that resolves when the setup process is complete.
     */
    const setup = async (): Promise<void> => {
      const savedValue = await Storage.getItem("restTimerSelectedTime");

      if (savedValue === null) {
        await Storage.setItem("restTimerSelectedTime", "60");
        return; // We can return early as the default value is already set in state
      }

      const parsedValue = parseInt(savedValue, 10);
      dispatchTimerState({
        type: "SET_SELECTED_TIME",
        payload: parsedValue,
      });

      // Load the sound file for the alarm, we will be changing this to allow for options
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/audio/alarm1.wav")
      );

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false, // This may need to change when we run the timer in the background
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: false,
      });

      setSound(sound);
    };

    setup();

    /**
     * Subscription to notification response events.
     *
     * @remarks
     * This listener is triggered when a notification response is received. If the
     * action identifier of the response is "cancel", it performs the following:
     *
     * - Clears the timer interval if it is active and resets the reference.
     * - Dismisses the notification if it exists and resets the notification ID reference.
     * - Dispatches an action to update the timer state to "CANCEL_TIMER".
     *
     * @param {Notifications.NotificationResponse} response - The notification response object containing details about the action.
     *
     * @returns {Notifications.EventSubscription} The subscription object.
     */
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        if (response.actionIdentifier === "cancel") {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }

          if (notificationId.current) {
            Notifications.dismissNotificationAsync(notificationId.current);
            notificationId.current = null;
          }

          dispatchTimerState({ type: "CANCEL_TIMER" });
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // We need to unload the sound when the context unmounts to prevent memory leaks
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    Storage.setItemSync(
      "restTimerSelectedTime",
      timerState.selectedTime.toString()
    );
  }, [timerState.selectedTime]);

  useEffect(() => {
    // This will make sure that when the context mounts we dont have an unwanted vibration or notification
    if (!timerIntervalRef.current) {
      return;
    }

    /**
     * Handles the audio playback when the timer reaches zero.
     *
     * @remarks This function will validate that a sound is currently loaded and exit early if not.
     * The function handles platform-specific behavior for Android and iOS to navigate around and
     * fix issues with audio ducking and not being un-ducked after the sound has finished playing.
     * This is an issue introduced into `expo-av` after version 11.0.1 and is not a bug in the app.
     * Once `expo-audio` is available for expo go or the means to make full use of development builds
     * for both platforms rather than just android, `expo-av` will be replaced with `expo-audio`.
     *
     * @async
     * @returns {Promise<void>} A promise that resolves when the sound is played.
     */
    const handleAudio = async (): Promise<void> => {
      if (!sound) return;
      if (Platform.OS === "android") {
        // We need to manually stop the sound when it is marked as finished or else audio from other
        // apps will be ducked and stay ducked, as far as i can find this is a bug introduced after
        // expo-av 11.0.1 with a fix for interruptions in the ui thread when videos finish playing.
        // Im not sure if audio would do the same but this is a fix for now
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && !status.isBuffering) {
            if (status.didJustFinish) {
              sound.stopAsync();
            }
          }
        });
        await sound.playAsync();
      } else {
        // iOS ducking fix, unfortunately this is not as straight forward as the android fix but this
        // solution from the packages github issues works well. The `setOnPlaybackStatusUpdate()` method
        // does not work for this solution so we need to use a timeout based on the `durationMillis`
        // property of the status object returned by `getStatusAsync()`.
        // source: https://github.com/expo/expo/issues/29077#issuecomment-2571898903
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          playsInSilentModeIOS: true,
        });
        const status = await sound.getStatusAsync();
        if (status.isLoaded && !status.isBuffering) {
          await sound.playAsync();
          const duration = status?.durationMillis ?? 0;
          setTimeout(async () => {
            await Audio.setAudioModeAsync({
              staysActiveInBackground: true,
              interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
              playsInSilentModeIOS: true,
            });
            await sound.stopAsync(); // The fix functions without this however just incase we call the stop method
          }, duration);
        }
      }
    };

    /**
     * Updates an existing notification with the current timer state.
     *
     * This function is designed to work only on Android devices, as iOS does not support
     * live updates to notifications. It uses the existing notification ID to update the
     * notification content, ensuring the timer's remaining time is displayed.
     *
     * @async
     * @returns {Promise<void>} A promise that resolves when the notification update is scheduled.
     *
     * @platform Android
     */
    const updateNotif = async (): Promise<void> => {
      // Only android supports live updates to notifications, iOS does not and will need a seperate solution
      if (notificationId.current && Platform.OS === "android") {
        await Notifications.scheduleNotificationAsync({
          identifier: notificationId.current,
          content: {
            title: "AtomiFit - Rest Timer",
            body: `Time remaining: ${timerState.time} seconds`,
            data: { shouldPlaySound: false },
            ...(Platform.OS === "android" && {
              color: "#60DD49",
              sticky: true,
              channelId: "atomifitTimerChannel",
            }),
            categoryIdentifier: "timer",
          },
          trigger: null,
        });
      }
    };

    if (timerState.time < 0) {
      // We want the timer notification on android to still show 0 briefly so we manually use the dispatch to
      // reset the timer rather than handling it in the dispatch as otherwise we do not get the behavior we want
      dispatchTimerState({ type: "CANCEL_TIMER" });
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (notificationId.current) {
        Notifications.dismissNotificationAsync(notificationId.current);
        notificationId.current = null;
      }
      Vibration.vibrate([0, 500, 0, 500, 400, 500, 0, 500, 400, 500, 0, 500]);
      handleAudio();
    }

    /**
     * Sends a notification on iOS devices when the rest timer has finished.
     *
     * Since iOS does not support live updates for notifications, a new notification
     * is scheduled each time this function is called and checks are passed.
     *
     * @async
     * @returns {Promise<void>} A promise that resolves when the notification is scheduled.
     */
    const iOSNotif = async (): Promise<void> => {
      if (Platform.OS !== "ios") return;
      if (timerState.time < 0) {
        // iOS does not support live updates, so we need to create a new notification each time
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "AtomiFit - Rest Timer",
            body: `Your rest timer has finished!`,
            data: { shouldPlaySound: false },
            sound: "default",
          },
          trigger: null,
        });
      }
    };

    updateNotif();
    iOSNotif();
  }, [timerState.time]);

  /**
   * Starts the timer by setting an interval that decrements the timer state every second.
   *
   * @remarks Dispatches a `SET_ACTIVE` action to set the timer as active and sends a notification
   * via the `sendNotification` function.
   * Ensures any existing timer interval is cleared and the reference reset before starting
   * a new one via the `initInterval` private function.
   *
   * @returns {void}
   */
  const startTimer = (): void => {
    dispatchTimerState({ type: "SET_ACTIVE", payload: true });
    sendNotification();
    initInterval();
  };

  /**
   * Pauses the currently running timer by clearing the interval.
   *
   * @remarks This function clears the timer interval based on the reference stored
   * in `timerIntervalRef`. It also resets the reference by setting the ref to null.
   * The function then dispatches a `SET_PAUSED` action to update the timer state to "paused".
   *
   * @returns {void}
   */
  const pauseTimer = (): void => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    dispatchTimerState({ type: "SET_PAUSED" });
  };

  /**
   * Resumes the timer by dispatching a "RESUME_TIMER" action to the timer state
   * and initializing the interval for the timer.
   *
   * @remarks This function is should only be used to continue a paused timer.
   * It uses the `initInterval` private function to set up the new timer interval without
   * reseting the `timerState.time` property to the value of `timerState.selectedTime`.
   *
   * @returns {void}
   */
  const resumeTimer = (): void => {
    dispatchTimerState({ type: "RESUME_TIMER" });
    initInterval();
  };

  /**
   * Cancels the currently running timer and performs necessary cleanup.
   *
   * @remarks This function clears the interval associated with the timer,
   * dismisses any active notifications, and updates the timer state to
   * reflect that the timer has been canceled.
   *
   * - If a timer interval is active, it will be cleared and the reference
   *   will be set to `null`.
   * - If a notification is currently displayed and stored in reference, it
   *   will be dismissed and the notification reference will be set to `null`.
   * - Dispatches a "CANCEL_TIMER" action to update the timer state.
   *
   * @returns {void}
   */
  const cancelTimer = (): void => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (notificationId.current) {
      Notifications.dismissNotificationAsync(notificationId.current);
      notificationId.current = null;
    }

    dispatchTimerState({ type: "CANCEL_TIMER" });
  };

  /**
   * Updates the timer state with the specified time.
   *
   * @param {number} time - The new time value to set, in seconds.
   * @returns {void}
   */
  const setTimer = (time: number): void => {
    dispatchTimerState({ type: "SET_SELECTED_TIME", payload: time });
  };

  /**
   * Initializes or resets the timer interval.
   *
   * @private This function is specific to the TimerContext and should not be used outside of it.
   *
   * This function clears any existing interval referenced by `timerIntervalRef`
   * and sets up a new interval that dispatches a "DECREMENT_TIME" action to
   * decrement the timer state every second.
   *
   */
  const initInterval = (): void => {
    // Edge case, by design this case should never happen but lets handle it incase it does
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    timerIntervalRef.current = setInterval(() => {
      dispatchTimerState({ type: "DECREMENT_TIME" });
    }, 1000);
  };

  /**
   * Sends a notification to the user.
   *
   * @private This function is specific to the TimerContext and should not be used outside of it.
   *
   * @platform Android:
   *   - Schedules an immediate sticky notification.
   *   - Stores the notification ID with ref for future updates.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the notification is scheduled.
   */
  const sendNotification = async (): Promise<void> => {
    if (Platform.OS !== "android") return;
    // We want to store id for live updates on Android
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "AtomiFit - Rest Timer",
        body: `Time remaining: ${timerState.selectedTime} seconds`,
        data: { shouldPlaySound: false },
        ...(Platform.OS === "android" && {
          color: "#60DD49",
          sticky: true,
          channelId: "atomifitTimerChannel",
        }),
        categoryIdentifier: "timer",
      },
      trigger: null,
    });

    notificationId.current = notifId;
    return;
  };

  return (
    <TimerContext.Provider
      value={{
        startTimer,
        pauseTimer,
        resumeTimer,
        cancelTimer,
        setTimer,
        timerState,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

/**
 * Custom hook to access the TimerContext.
 *
 * @returns {TimerContextProps} The timer context.
 */
export const useTimer = (): TimerContextProps => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context as TimerContextProps;
};
