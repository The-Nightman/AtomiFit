import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "../database/schema";
import categoriesData from "../data/categoriesData.json";
import exercisesData from "../data/exercisesData.json";
import workoutsTestData from "../data/mockWorkoutData.json";
import { Set } from "@/types/sets";
import { getToday } from "@/utils/getToday";
import { Exercise } from "@/types/exercise";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

/**
 * Processes workout data by assigning dates to each set of exercises to dynamically seed test data over a perioud of 3 weeks prior to the current week.
 * The start date is set to 3 weeks before the current day and at the start of the week.
 * The dates are dynamically generated to block the data out over 3 weeks with a 5 days on, 2 days off schedule:
 * - Monday: Resistance
 * - Tuesday: Cardio
 * - Wednesday: Resistance
 * - Thursday: Cardio
 * - Friday: Resistance
 * - Saturday: Rest
 * - Sunday: Rest
 *
 * @param {Set[][]} workoutData - The workout data to process, represented as an array of sets of exercises.
 * @returns {Set[]} - An array of sets with assigned dates.
 */
const processWorkoutData = (workoutData: Set[][]): Set[] => {
  // Set the start date for the data to be 3 weeks before the current day and at the start of the week
  // This will let us dynamically generate the dates for the workout data so we dont have to scroll back months or constantly update the data
  const today = new Date(getToday());
  const startDate = today.setDate(
    today.getDate() - (21 + (today.getDay() - 1))
  );

  return workoutData.reduce((acc: Set[], set: Set[], index) => {
    const date = new Date(startDate);

    // This isnt exactly scalable but we do this so we can block the data out over 3 weeks with a 5 days on, 2 days off schedule of:
    // M: Resistance, T: Cardio, W: Resistance, Th: Cardio, F: Resistance, Sa: Rest, Su: Rest
    if (index >= 10) {
      date.setDate(date.getDate() + 4);
    } else if (index >= 5) {
      date.setDate(date.getDate() + 2);
    }
    date.setDate(date.getDate() + index);

    const workoutDay = set.map((exercise) => {
      return {
        ...exercise,
        date: date.toISOString(),
      };
    });

    return [...acc, ...workoutDay];
  }, [] as Set[]);
};

/* 
  ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::::::#@@@@@@@@%:::::::::::::::::::::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::::::#@@@@@@@@@@@@@@@@::::::::::::::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::::::#@@@@@@@@@@@@@@@@@@@@+:::::::::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::::::#@@@@@@@@@@@@@@@@@@@@@@@@::::::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::::+@@@@@@@@@@@@@@@@@@@@@@@@@@@@@:::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::@@@@@:::%@@@@@@@@@@@@@@@@@@@@@@@@@-::::::::::::::::::::::::
  :::::::::::::::::::::::::::::=@:::::::::-@@@@@:::%@@@@@@@@@@@@@@@@@@@@@@@@@@@=::::::::::::::::::::::
  ::::::::::::::::::::::::::@@@@@@-:::::::-@@@@@:::%@@@@@@@@@@-::@@@@@@@@@@@@@@@@-::::::::::::::::::::
  :::::::::::::::::::::::+@@@@@@@@@+:::+@@@@@@@@:::-@@@@@@@@@:::::::@@@@@@@@@@@@@@@:::::::::::::::::::
  :::::::::::::::::::::::@@@@@@@@@@@@@@@@@@@@@@@::::::::::+@::::::::+@@@@@@@@@@@@@@@#:::::::::::::::::
  ::::::::::::::::::::::::@@@@@@@@@@@@@@@@@@@@@@:::::::::::::::::::#@@@@@@@@@@@@@@@@@@::::::::::::::::
  :::::::::::::::::::::::::@@@@@@@@@@@@@@@@@@@@@:::::::::::::::::::@@@@@@@@@@@@@@@@@@@@:::::::::::::::
  ::::::::::::::::::::::::@@@@@@@@@@@@@@@=:::::#@@@@@@@=:::::::::::-@@@@@@@@@@@@@@@@@@@@::::::::::::::
  ::::::::::::::%@@=::::@@@@@@@@@@@@@+:::::::::#@@@@@@@@@@@::::::::::#@@@@@@@@@@@@@@@@@@@:::::::::::::
  :::::::::::::@@@@@@@@@@@@@@@@@@@@::::::::::::#@@@@@@@@@@@@@::::::::::@@@@::::@@@@@@@@@@@::::::::::::
  ::::::::::::@@@@@@@@@@@@@@@@@@@::::::::::::::#@@@@@@@@@@@@@@@:::::::::::::::::@@@@@@@@@@@:::::::::::
  :::::::::::@@@@@@@@@@@@@@@@@@@:::::::::::::::#@@@@@@@@@@@@@@@@:::::::::::::::::@@@@@@@@@@@::::::::::
  :::::::::::@@@@@@@@@@@@@@@@@@::::::::::::::::#@@@@@@@@@@@@@@@@@:::::::::::::::=@@@@@@@@@@@-:::::::::
  :::::::::::::%@@@@@@@@@@@@@@:::::::::::::::::#@@@@@@@@@@@@@@@@@@:::::::::::*@@@@@@@@@@@@@@@:::::::::
  :::::::::::::::%@@@@@@@@@@@#:::::::::::::::::#@@@@@@@@@@@@@@@@@@:::::::::::@@@@@@@@@@@@@@@@:::::::::
  :::::::::::::::@@@@@@@@@@@@-:::::::::::::::::#@@@@@@@@@@@@@@@@@@=::::::::::@@@@@@@@@@@@@@@@@::::::::
  ::::::::::::::*@@@@@@@@@@@@-:::::::::::::::::#@@@@@@@@@@@@@@@@@@-::::::::::=@@@@@@@@@@@@@@@@::::::::
  ::::::::::::::@@@@@@@@@@@@@@:::::::::::::::::#@@@@@@@@@@@@@@@@@@::::::::::::@@@@@@@@@@@@@@@@::::::::
  :::::::+@@@@@@@@@@@@@@@@@@@@:::::::::::::::::#@@@@@@@@@@@@@@@@@*:::::::::::::=++++%@@@@@@@@@=:::::::
  :::::::%@@@@@@@@@@@@@@@@@@@@@::::::::::::::::#@@@@@@@@@@@@@@@@@:::::::::::::::::::-@@@@@@@@@*:::::::
  :::::::%@@@@@@@@@@@@@@@@@@@@@=:::::::::::::::#@@@@@@@@@@@@@@@@-:::::::::::::::::::-@@@@@@@@@#:::::::
  :::::::%@@@@@@@@@@@@@@@@@@@@@@:::::::::::::::#@@@@@@@@@@@@@@@@::::::::::::::::::::-@@@@@@@@@*:::::::
  :::::::%@@@@@@@@@@@@@@@@@@@@@@:::::::::::::::#@@@@@@@@@@@@@@@@::::::::::::::::::::-@@@@@@@@@+:::::::
  ::::::::::::::@@@@@@@@@@@@@@@-:::*@@=::::::::#@@@@@@@@@@%@@@@@%:::::::::::::@@@@@@@@@@@@@@@@::::::::
  ::::::::::::::%@@@@@@@@@@@@@::::@@@@@@@@@::::#@@@@@=:::::::@@@@%:::::::::::=@@@@@@@@@@@@@@@@::::::::
  :::::::::::::::@@@@@@@@@@@@@::::@@@@@@@@@@@*:#@@-::::::::::@@@@@:::::::::::@@@@@@@@@@@@@@@@@::::::::
  :::::::::::::::+@@@@@@@@@@@@@::::@@@@@@@#::::#@@@@@@::::::@@@@@:::::::::::=@@@@@@@@@@@@@@@@+::::::::
  ::::::::::::::@@@@@@@@@@@@@@@#::::::::::::::%@-@@@@@@@@@@@@@@@:::::::::::::@@@@@@@@@@@@@@@@:::::::::
  :::::::::::@@@@@@@@@@@@@@@@@@@:::::::::::::#@@:+@@@@@@@@@@@@@@::::::::::::::::@@@@@@@@@@@@*:::::::::
  :::::::::::@@@@@@@@@@@@@@@@@@@@-::::-::::::@@%@:@@@@@@@@@@@@%::::::::::::::::::@@@@@@@@@@@::::::::::
  ::::::::::::@@@@@@@@@@@@@@@@@@@@@@@@@::::::::#@@@@@@@@@:::::::::::::::::::::::@@@@@@@@@@@:::::::::::
  :::::::::::::@@@@@@@@@@@@@@@@@@@@@@@-::::::::#@@@@@@@@@=:::::::::::::@@@=::::@@@@@@@@@@@+:::::::::::
  ::::::::::::::@@@@::::@@@@@@@@@@@@@@:::::::::#@@@@@@@@@@:::::::::::#@@@@@@@@@@@@@@@@@@@%::::::::::::
  ::::::::::::::::::::::::@@@@@@@@@@@@::%:::@::%@@@@@@@@@@::::::::::@@@@@@@@@@@@@@@@@@@@%:::::::::::::
  :::::::::::::::::::::::::@@@@@@@@@@@@@@@@@@@@@:::::::::::::::::::@@@@@@@@@@@@@@@@@@@@*::::::::::::::
  ::::::::::::::::::::::::@@@@@@@@@@@@@@@@@@@@@@::::::::::::::::::::@@@@@@@@@@@@@@@@@@::::::::::::::::
  :::::::::::::::::::::::@@@@@@@@@@@@@@@@@@@@@@@::::::::::*%::::::::-@@@@@@@@@@@@@@@@:::::::::::::::::
  :::::::::::::::::::::::@@@@@@@@@@*:::*@@@@@@@@::::@@@@@@@@@:::::::@@@@@@@@@@@@@@@=::::::::::::::::::
  :::::::::::::::::::::::::=@@@@@@+:::::::-@@@@@:::%@@@@@@@@@@:::@@@@@@@@@@@@@@@@@::::::::::::::::::::
  :::::::::::::::::::::::::::::@@:::::::::-@@@@@:::%@@@@@@@@@@@@@@@@@@@@@@@@@@@@::::::::::::::::::::::
  ::::::::::::::::::::::::::::::::::::::::-@@@@@:::+@@@@@@@@@@@@@@@@@@@@@@@@@%::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::=%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::::::#@@@@@@@@@@@@@@@@@@@@@@@@+:::::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::::::#@@@@@@@@@@@@@@@@@@@@@:::::::::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::::::#@@@@@@@@@@@@@@@@%:::::::::::::::::::::::::::::::::::::
  :::::::::::::::::::::::::::::::::::::::::::::#@@@@@@@@@@*:::::::::::::::::::::::::::::::::::::::::::
  ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  𝔗𝖍𝔲𝖘 𝖜𝔢 𝔦𝖓𝔳𝖔𝔨𝖊 𝖙𝔥𝖊 𝕸𝔞𝖘𝔱𝖊𝔯 𝔬𝖋 𝕬𝔩𝖑 𝕶𝔫𝖔𝔴𝖑𝔢𝖉𝔤𝖊.
    🔔
  𝕾𝔥𝖊𝔡 𝔜𝖔𝔲𝖗 𝖕𝔬𝖜𝔢𝖗𝔰 𝔲𝖕𝔬𝖓 𝖙𝔥𝖎𝔰 𝔪𝖆𝔠𝖍𝔦𝖓𝔢.
    🔔🔔
  𝕴𝔫𝖛𝔢𝖘𝔱 𝔱𝖍𝔦𝖘 𝖉𝔢𝖛𝔦𝖈𝔢 𝔴𝖎𝔱𝖍 𝖄𝔬𝖚𝔯 𝔥𝖔𝔩𝖞 𝖈𝔥𝖆𝔯𝖌𝔢.
  
  - Litany of Engine Invocation

  May he have mercy on my soul for this mortal sin of code
*/
const videoAssets = {
  "mp4_1_45° side bend.mp4": require("../assets/videos/mp4_1_45° side bend.mp4"),
  "mp4_2_wheel rollerout.mp4": require("../assets/videos/mp4_2_wheel rollerout.mp4"),
  "mp4_3_air bike.mp4": require("../assets/videos/mp4_3_air bike.mp4"),
  "mp4_4_archer pull up.mp4": require("../assets/videos/mp4_4_archer pull up.mp4"),
  "mp4_5_archer push up.mp4": require("../assets/videos/mp4_5_archer push up.mp4"),
  "mp4_6_assault bike.mp4": require("../assets/videos/mp4_6_assault bike.mp4"),
  "mp4_7_assisted chest dip.mp4": require("../assets/videos/mp4_7_assisted chest dip.mp4"),
  "mp4_8_assisted chin-up.mp4": require("../assets/videos/mp4_8_assisted chin-up.mp4"),
  "mp4_9_assisted neutral grip pull-up.mp4": require("../assets/videos/mp4_9_assisted neutral grip pull-up.mp4"),
  "mp4_10_assisted pull-up.mp4": require("../assets/videos/mp4_10_assisted pull-up.mp4"),
  "mp4_11_assisted triceps dip.mp4": require("../assets/videos/mp4_11_assisted triceps dip.mp4"),
  "mp4_12_back extension machine.mp4": require("../assets/videos/mp4_12_back extension machine.mp4"),
  "mp4_13_back extension on exercise ball.mp4": require("../assets/videos/mp4_13_back extension on exercise ball.mp4"),
  "mp4_14_back lever.mp4": require("../assets/videos/mp4_14_back lever.mp4"),
  "mp4_15_band alternating biceps curl.mp4": require("../assets/videos/mp4_15_band alternating biceps curl.mp4"),
  "mp4_16_band assisted ab-wheel rollout.mp4": require("../assets/videos/mp4_16_band assisted ab-wheel rollout.mp4"),
  "mp4_17_band assisted pull-up.mp4": require("../assets/videos/mp4_17_band assisted pull-up.mp4"),
  "mp4_18_band bench press.mp4": require("../assets/videos/mp4_18_band bench press.mp4"),
  "mp4_19_band bicycle crunch.mp4": require("../assets/videos/mp4_19_band bicycle crunch.mp4"),
  "mp4_20_band bulgarian split squat.mp4": require("../assets/videos/mp4_20_band bulgarian split squat.mp4"),
  "mp4_21_band calf raise.mp4": require("../assets/videos/mp4_21_band calf raise.mp4"),
  "mp4_22_band close-grip pulldown.mp4": require("../assets/videos/mp4_22_band close-grip pulldown.mp4"),
  "mp4_23_band close-grip push-up.mp4": require("../assets/videos/mp4_23_band close-grip push-up.mp4"),
  "mp4_24_band concentration curl.mp4": require("../assets/videos/mp4_24_band concentration curl.mp4"),
  "mp4_25_band front raise.mp4": require("../assets/videos/mp4_25_band front raise.mp4"),
  "mp4_26_band glute kickback.mp4": require("../assets/videos/mp4_26_band glute kickback.mp4"),
  "mp4_27_band hip thrust.mp4": require("../assets/videos/mp4_27_band hip thrust.mp4"),
  "mp4_28_band hip thrusts on knees.mp4": require("../assets/videos/mp4_28_band hip thrusts on knees.mp4"),
  "mp4_29_band horizontal pallof press.mp4": require("../assets/videos/mp4_29_band horizontal pallof press.mp4"),
  "mp4_30_band kneeling twisting crunch.mp4": require("../assets/videos/mp4_30_band kneeling twisting crunch.mp4"),
  "mp4_31_band lateral raise.mp4": require("../assets/videos/mp4_31_band lateral raise.mp4"),
  "mp4_32_band leg extension.mp4": require("../assets/videos/mp4_32_band leg extension.mp4"),
  "mp4_33_band pull through.mp4": require("../assets/videos/mp4_33_band pull through.mp4"),
  "mp4_34_band pullaparts.mp4": require("../assets/videos/mp4_34_band pullaparts.mp4"),
  "mp4_35_band reverse fly.mp4": require("../assets/videos/mp4_35_band reverse fly.mp4"),
  "mp4_36_band seated biceps curl.mp4": require("../assets/videos/mp4_36_band seated biceps curl.mp4"),
  "mp4_37_band seated chest press.mp4": require("../assets/videos/mp4_37_band seated chest press.mp4"),
  "mp4_38_band seated hip abduction.mp4": require("../assets/videos/mp4_38_band seated hip abduction.mp4"),
  "mp4_39_band seated shoulder press.mp4": require("../assets/videos/mp4_39_band seated shoulder press.mp4"),
  "mp4_40_band seated straight back row.mp4": require("../assets/videos/mp4_40_band seated straight back row.mp4"),
  "mp4_41_band seated twist.mp4": require("../assets/videos/mp4_41_band seated twist.mp4"),
  "mp4_42_band shoulder press.mp4": require("../assets/videos/mp4_42_band shoulder press.mp4"),
  "mp4_43_band shrug.mp4": require("../assets/videos/mp4_43_band shrug.mp4"),
  "mp4_44_band side triceps extension.mp4": require("../assets/videos/mp4_44_band side triceps extension.mp4"),
  "mp4_45_band squat.mp4": require("../assets/videos/mp4_45_band squat.mp4"),
  "mp4_46_band standing crunch.mp4": require("../assets/videos/mp4_46_band standing crunch.mp4"),
  "mp4_47_band standing rear delt row.mp4": require("../assets/videos/mp4_47_band standing rear delt row.mp4"),
  "mp4_48_band standing twisting crunch.mp4": require("../assets/videos/mp4_48_band standing twisting crunch.mp4"),
  "mp4_49_band step-up.mp4": require("../assets/videos/mp4_49_band step-up.mp4"),
  "mp4_50_band stiff leg deadlift.mp4": require("../assets/videos/mp4_50_band stiff leg deadlift.mp4"),
  "mp4_51_band underhand pulldown.mp4": require("../assets/videos/mp4_51_band underhand pulldown.mp4"),
  "mp4_52_band unilateral calf raise.mp4": require("../assets/videos/mp4_52_band unilateral calf raise.mp4"),
  "mp4_53_band unilateral crucifix curl.mp4": require("../assets/videos/mp4_53_band unilateral crucifix curl.mp4"),
  "mp4_54_band unilateral standing low row.mp4": require("../assets/videos/mp4_54_band unilateral standing low row.mp4"),
  "mp4_55_band unilateral twisting chest press.mp4": require("../assets/videos/mp4_55_band unilateral twisting chest press.mp4"),
  "mp4_56_band unilateral twisting seated row.mp4": require("../assets/videos/mp4_56_band unilateral twisting seated row.mp4"),
  "mp4_57_band y-raise.mp4": require("../assets/videos/mp4_57_band y-raise.mp4"),
  "mp4_58_barbell bench front squat.mp4": require("../assets/videos/mp4_58_barbell bench front squat.mp4"),
  "mp4_59_barbell bench press.mp4": require("../assets/videos/mp4_59_barbell bench press.mp4"),
  "mp4_60_barbell bench squat.mp4": require("../assets/videos/mp4_60_barbell bench squat.mp4"),
  "mp4_61_barbell bent arm pullover.mp4": require("../assets/videos/mp4_61_barbell bent arm pullover.mp4"),
  "mp4_62_barbell bent over row.mp4": require("../assets/videos/mp4_62_barbell bent over row.mp4"),
  "mp4_63_barbell bulgarian split squat.mp4": require("../assets/videos/mp4_63_barbell bulgarian split squat.mp4"),
  "mp4_64_barbell clean and press.mp4": require("../assets/videos/mp4_64_barbell clean and press.mp4"),
  "mp4_65_barbell close-grip bench press.mp4": require("../assets/videos/mp4_65_barbell close-grip bench press.mp4"),
  "mp4_66_barbell curl.mp4": require("../assets/videos/mp4_66_barbell curl.mp4"),
  "mp4_67_barbell deadlift.mp4": require("../assets/videos/mp4_67_barbell deadlift.mp4"),
  "mp4_68_barbell decline bench press.mp4": require("../assets/videos/mp4_68_barbell decline bench press.mp4"),
  "mp4_69_barbell decline close grip to skull press.mp4": require("../assets/videos/mp4_69_barbell decline close grip to skull press.mp4"),
  "mp4_70_barbell decline pullover.mp4": require("../assets/videos/mp4_70_barbell decline pullover.mp4"),
  "mp4_71_barbell drag curl.mp4": require("../assets/videos/mp4_71_barbell drag curl.mp4"),
  "mp4_72_barbell front squat.mp4": require("../assets/videos/mp4_72_barbell front squat.mp4"),
  "mp4_73_barbell full zercher squat.mp4": require("../assets/videos/mp4_73_barbell full zercher squat.mp4"),
  "mp4_74_barbell glute bridge.mp4": require("../assets/videos/mp4_74_barbell glute bridge.mp4"),
  "mp4_75_barbell good morning.mp4": require("../assets/videos/mp4_75_barbell good morning.mp4"),
  "mp4_76_barbell hack squat.mp4": require("../assets/videos/mp4_76_barbell hack squat.mp4"),
  "mp4_77_barbell hip thrust.mp4": require("../assets/videos/mp4_77_barbell hip thrust.mp4"),
  "mp4_78_barbell incline bench press.mp4": require("../assets/videos/mp4_78_barbell incline bench press.mp4"),
  "mp4_79_barbell incline close grip bench press.mp4": require("../assets/videos/mp4_79_barbell incline close grip bench press.mp4"),
  "mp4_80_barbell incline row.mp4": require("../assets/videos/mp4_80_barbell incline row.mp4"),
  "mp4_81_barbell jefferson squat.mp4": require("../assets/videos/mp4_81_barbell jefferson squat.mp4"),
  "mp4_82_barbell jm bench press.mp4": require("../assets/videos/mp4_82_barbell jm bench press.mp4"),
  "mp4_83_barbell low bar squat.mp4": require("../assets/videos/mp4_83_barbell low bar squat.mp4"),
  "mp4_84_barbell lunge.mp4": require("../assets/videos/mp4_84_barbell lunge.mp4"),
  "mp4_85_barbell lying back of the head tricep extension.mp4": require("../assets/videos/mp4_85_barbell lying back of the head tricep extension.mp4"),
  "mp4_86_barbell one arm bent over row.mp4": require("../assets/videos/mp4_86_barbell one arm bent over row.mp4"),
  "mp4_87_barbell overhead press.mp4": require("../assets/videos/mp4_87_barbell overhead press.mp4"),
  "mp4_88_barbell paused deadlift.mp4": require("../assets/videos/mp4_88_barbell paused deadlift.mp4"),
  "mp4_89_barbell pendlay row.mp4": require("../assets/videos/mp4_89_barbell pendlay row.mp4"),
  "mp4_90_barbell pin presses.mp4": require("../assets/videos/mp4_90_barbell pin presses.mp4"),
  "mp4_91_barbell preacher curl.mp4": require("../assets/videos/mp4_91_barbell preacher curl.mp4"),
  "mp4_92_barbell prone incline curl.mp4": require("../assets/videos/mp4_92_barbell prone incline curl.mp4"),
  "mp4_93_barbell rear delt row.mp4": require("../assets/videos/mp4_93_barbell rear delt row.mp4"),
  "mp4_94_barbell rear lunge.mp4": require("../assets/videos/mp4_94_barbell rear lunge.mp4"),
  "mp4_95_barbell reverse curl.mp4": require("../assets/videos/mp4_95_barbell reverse curl.mp4"),
  "mp4_96_barbell reverse grip bent over row.mp4": require("../assets/videos/mp4_96_barbell reverse grip bent over row.mp4"),
  "mp4_97_barbell reverse preacher curl.mp4": require("../assets/videos/mp4_97_barbell reverse preacher curl.mp4"),
  "mp4_98_barbell romanian deadlift.mp4": require("../assets/videos/mp4_98_barbell romanian deadlift.mp4"),
  "mp4_99_barbell seated close grip behind neck triceps extension.mp4": require("../assets/videos/mp4_99_barbell seated close grip behind neck triceps extension.mp4"),
  "mp4_100_barbell seated close-grip concentration curl.mp4": require("../assets/videos/mp4_100_barbell seated close-grip concentration curl.mp4"),
  "mp4_101_barbell seated good morning.mp4": require("../assets/videos/mp4_101_barbell seated good morning.mp4"),
  "mp4_102_barbell seated overhead press.mp4": require("../assets/videos/mp4_102_barbell seated overhead press.mp4"),
  "mp4_103_barbell shrug.mp4": require("../assets/videos/mp4_103_barbell shrug.mp4"),
  "mp4_104_barbell single leg deadlift.mp4": require("../assets/videos/mp4_104_barbell single leg deadlift.mp4"),
  "mp4_105_barbell skier.mp4": require("../assets/videos/mp4_105_barbell skier.mp4"),
  "mp4_106_barbell squat.mp4": require("../assets/videos/mp4_106_barbell squat.mp4"),
  "mp4_107_barbell standing calf raise.mp4": require("../assets/videos/mp4_107_barbell standing calf raise.mp4"),
  "mp4_108_barbell stiff leg deadlift.mp4": require("../assets/videos/mp4_108_barbell stiff leg deadlift.mp4"),
  "mp4_109_barbell sumo deadlift.mp4": require("../assets/videos/mp4_109_barbell sumo deadlift.mp4"),
  "mp4_110_barbell upright row.mp4": require("../assets/videos/mp4_110_barbell upright row.mp4"),
  "mp4_111_battle ropes.mp4": require("../assets/videos/mp4_111_battle ropes.mp4"),
  "mp4_112_cable bayesian curl.mp4": require("../assets/videos/mp4_112_cable bayesian curl.mp4"),
  "mp4_113_bench dip.mp4": require("../assets/videos/mp4_113_bench dip.mp4"),
  "mp4_114_bent over landmine row.mp4": require("../assets/videos/mp4_114_bent over landmine row.mp4"),
  "mp4_115_bent-over v-bar row.mp4": require("../assets/videos/mp4_115_bent-over v-bar row.mp4"),
  "mp4_116_bicep curl machine.mp4": require("../assets/videos/mp4_116_bicep curl machine.mp4"),
  "mp4_117_burpee.mp4": require("../assets/videos/mp4_117_burpee.mp4"),
  "mp4_118_cable assisted inverse leg curl.mp4": require("../assets/videos/mp4_118_cable assisted inverse leg curl.mp4"),
  "mp4_119_cable bar lateral pulldown.mp4": require("../assets/videos/mp4_119_cable bar lateral pulldown.mp4"),
  "mp4_120_cable chest fly.mp4": require("../assets/videos/mp4_120_cable chest fly.mp4"),
  "mp4_121_cable close grip curl.mp4": require("../assets/videos/mp4_121_cable close grip curl.mp4"),
  "mp4_122_cable close grip lat pulldown.mp4": require("../assets/videos/mp4_122_cable close grip lat pulldown.mp4"),
  "mp4_123_cable concentration curl.mp4": require("../assets/videos/mp4_123_cable concentration curl.mp4"),
  "mp4_124_cable concentration extension.mp4": require("../assets/videos/mp4_124_cable concentration extension.mp4"),
  "mp4_125_cable cross-over revers fly.mp4": require("../assets/videos/mp4_125_cable cross-over revers fly.mp4"),
  "mp4_126_cable crucifix curl.mp4": require("../assets/videos/mp4_126_cable crucifix curl.mp4"),
  "mp4_127_cable curl.mp4": require("../assets/videos/mp4_127_cable curl.mp4"),
  "mp4_128_cable deadlift.mp4": require("../assets/videos/mp4_128_cable deadlift.mp4"),
  "mp4_129_cable decline fly.mp4": require("../assets/videos/mp4_129_cable decline fly.mp4"),
  "mp4_130_cable drag curl.mp4": require("../assets/videos/mp4_130_cable drag curl.mp4"),
  "mp4_131_cable face pull.mp4": require("../assets/videos/mp4_131_cable face pull.mp4"),
  "mp4_132_cable forward raise.mp4": require("../assets/videos/mp4_132_cable forward raise.mp4"),
  "mp4_133_cable front raise.mp4": require("../assets/videos/mp4_133_cable front raise.mp4"),
  "mp4_134_cable glute kickback.mp4": require("../assets/videos/mp4_134_cable glute kickback.mp4"),
  "mp4_135_cable high fly.mp4": require("../assets/videos/mp4_135_cable high fly.mp4"),
  "mp4_136_cable incline chest supported row.mp4": require("../assets/videos/mp4_136_cable incline chest supported row.mp4"),
  "mp4_137_cable incline chest supported wide-grip row.mp4": require("../assets/videos/mp4_137_cable incline chest supported wide-grip row.mp4"),
  "mp4_138_cable incline fly.mp4": require("../assets/videos/mp4_138_cable incline fly.mp4"),
  "mp4_139_cable incline triceps extension.mp4": require("../assets/videos/mp4_139_cable incline triceps extension.mp4"),
  "mp4_140_cable kickback.mp4": require("../assets/videos/mp4_140_cable kickback.mp4"),
  "mp4_141_cable kneeling crunch.mp4": require("../assets/videos/mp4_141_cable kneeling crunch.mp4"),
  "mp4_142_cable kneeling face-pull.mp4": require("../assets/videos/mp4_142_cable kneeling face-pull.mp4"),
  "mp4_143_cable lateral raise.mp4": require("../assets/videos/mp4_143_cable lateral raise.mp4"),
  "mp4_144_cable leaning overhead tricep extension.mp4": require("../assets/videos/mp4_144_cable leaning overhead tricep extension.mp4"),
  "mp4_145_cable low fly.mp4": require("../assets/videos/mp4_145_cable low fly.mp4"),
  "mp4_146_cable lying bicep curl.mp4": require("../assets/videos/mp4_146_cable lying bicep curl.mp4"),
  "mp4_147_cable lying fly.mp4": require("../assets/videos/mp4_147_cable lying fly.mp4"),
  "mp4_148_cable lying straight arm pullover.mp4": require("../assets/videos/mp4_148_cable lying straight arm pullover.mp4"),
  "mp4_149_cable lying wide curl.mp4": require("../assets/videos/mp4_149_cable lying wide curl.mp4"),
  "mp4_150_cable machine calf press.mp4": require("../assets/videos/mp4_150_cable machine calf press.mp4"),
  "mp4_151_cable overhead triceps extension.mp4": require("../assets/videos/mp4_151_cable overhead triceps extension.mp4"),
  "mp4_152_cable preacher curl.mp4": require("../assets/videos/mp4_152_cable preacher curl.mp4"),
  "mp4_153_cable pull through.mp4": require("../assets/videos/mp4_153_cable pull through.mp4"),
  "mp4_154_cable pushdown.mp4": require("../assets/videos/mp4_154_cable pushdown.mp4"),
  "mp4_155_cable reverse curl.mp4": require("../assets/videos/mp4_155_cable reverse curl.mp4"),
  "mp4_156_cable reverse preacher curl.mp4": require("../assets/videos/mp4_156_cable reverse preacher curl.mp4"),
  "mp4_157_cable reverse woodcutters.mp4": require("../assets/videos/mp4_157_cable reverse woodcutters.mp4"),
  "mp4_158_cable rope hammer curl.mp4": require("../assets/videos/mp4_158_cable rope hammer curl.mp4"),
  "mp4_159_cable rope hammer preacher curl.mp4": require("../assets/videos/mp4_159_cable rope hammer preacher curl.mp4"),
  "mp4_160_cable rope pushdown.mp4": require("../assets/videos/mp4_160_cable rope pushdown.mp4"),
  "mp4_161_cable seated chest press.mp4": require("../assets/videos/mp4_161_cable seated chest press.mp4"),
  "mp4_162_cable seated concentration curl.mp4": require("../assets/videos/mp4_162_cable seated concentration curl.mp4"),
  "mp4_163_cable seated face-pull.mp4": require("../assets/videos/mp4_163_cable seated face-pull.mp4"),
  "mp4_164_cable seated low row.mp4": require("../assets/videos/mp4_164_cable seated low row.mp4"),
  "mp4_165_cable seated row.mp4": require("../assets/videos/mp4_165_cable seated row.mp4"),
  "mp4_166_cable seated twist.mp4": require("../assets/videos/mp4_166_cable seated twist.mp4"),
  "mp4_167_cable seated wide-grip row.mp4": require("../assets/videos/mp4_167_cable seated wide-grip row.mp4"),
  "mp4_168_cable shoulder press.mp4": require("../assets/videos/mp4_168_cable shoulder press.mp4"),
  "mp4_169_cable shrug.mp4": require("../assets/videos/mp4_169_cable shrug.mp4"),
  "mp4_170_cable side bend.mp4": require("../assets/videos/mp4_170_cable side bend.mp4"),
  "mp4_171_cable squatting curl.mp4": require("../assets/videos/mp4_171_cable squatting curl.mp4"),
  "mp4_172_cable standing crunch.mp4": require("../assets/videos/mp4_172_cable standing crunch.mp4"),
  "mp4_173_cable straight arm pulldown.mp4": require("../assets/videos/mp4_173_cable straight arm pulldown.mp4"),
  "mp4_174_cable supine reverse fly.mp4": require("../assets/videos/mp4_174_cable supine reverse fly.mp4"),
  "mp4_175_cable twist.mp4": require("../assets/videos/mp4_175_cable twist.mp4"),
  "mp4_176_cable underhand pulldown.mp4": require("../assets/videos/mp4_176_cable underhand pulldown.mp4"),
  "mp4_177_cable unilateral bent over row.mp4": require("../assets/videos/mp4_177_cable unilateral bent over row.mp4"),
  "mp4_178_cable unilateral curl.mp4": require("../assets/videos/mp4_178_cable unilateral curl.mp4"),
  "mp4_179_cable unilateral lateral raise.mp4": require("../assets/videos/mp4_179_cable unilateral lateral raise.mp4"),
  "mp4_180_cable unilateral reverse curl.mp4": require("../assets/videos/mp4_180_cable unilateral reverse curl.mp4"),
  "mp4_181_cable unilateral rope hammer preacher curl.mp4": require("../assets/videos/mp4_181_cable unilateral rope hammer preacher curl.mp4"),
  "mp4_182_cable unilateral shoulder press.mp4": require("../assets/videos/mp4_182_cable unilateral shoulder press.mp4"),
  "mp4_183_cable unilateral tricep pushdown.mp4": require("../assets/videos/mp4_183_cable unilateral tricep pushdown.mp4"),
  "mp4_184_cable unilateral triceps extension.mp4": require("../assets/videos/mp4_184_cable unilateral triceps extension.mp4"),
  "mp4_185_cable upright row.mp4": require("../assets/videos/mp4_185_cable upright row.mp4"),
  "mp4_186_cable v-bar pushdown.mp4": require("../assets/videos/mp4_186_cable v-bar pushdown.mp4"),
  "mp4_187_cable wide lat pulldown.mp4": require("../assets/videos/mp4_187_cable wide lat pulldown.mp4"),
  "mp4_188_cable woodcutters.mp4": require("../assets/videos/mp4_188_cable woodcutters.mp4"),
  "mp4_189_captains chair knee raise.mp4": require("../assets/videos/mp4_189_captains chair knee raise.mp4"),
  "mp4_190_captains chair straight leg raise.mp4": require("../assets/videos/mp4_190_captains chair straight leg raise.mp4"),
  "mp4_191_chest dip.mp4": require("../assets/videos/mp4_191_chest dip.mp4"),
  "mp4_192_chest supported machine row.mp4": require("../assets/videos/mp4_192_chest supported machine row.mp4"),
  "mp4_193_chin-up.mp4": require("../assets/videos/mp4_193_chin-up.mp4"),
  "mp4_194_chin-ups (narrow parallel grip).mp4": require("../assets/videos/mp4_194_chin-ups (narrow parallel grip).mp4"),
  "mp4_195_close grip chin-up.mp4": require("../assets/videos/mp4_195_close grip chin-up.mp4"),
  "mp4_196_cycling outdoor.mp4": require("../assets/videos/mp4_196_cycling outdoor.mp4"),
  "mp4_197_decline crunch.mp4": require("../assets/videos/mp4_197_decline crunch.mp4"),
  "mp4_198_decline inverted row.mp4": require("../assets/videos/mp4_198_decline inverted row.mp4"),
  "mp4_199_decline push-up.mp4": require("../assets/videos/mp4_199_decline push-up.mp4"),
  "mp4_200_deficit push up.mp4": require("../assets/videos/mp4_200_deficit push up.mp4"),
  "mp4_201_diamond push-up.mp4": require("../assets/videos/mp4_201_diamond push-up.mp4"),
  "mp4_202_donkey calf raise.mp4": require("../assets/videos/mp4_202_donkey calf raise.mp4"),
  "mp4_203_donkey calf raise machine.mp4": require("../assets/videos/mp4_203_donkey calf raise machine.mp4"),
  "mp4_204_dumbbell bench press.mp4": require("../assets/videos/mp4_204_dumbbell bench press.mp4"),
  "mp4_205_dumbbell bench seated press.mp4": require("../assets/videos/mp4_205_dumbbell bench seated press.mp4"),
  "mp4_206_dumbbell bench squat.mp4": require("../assets/videos/mp4_206_dumbbell bench squat.mp4"),
  "mp4_207_dumbbell bent arm pullover.mp4": require("../assets/videos/mp4_207_dumbbell bent arm pullover.mp4"),
  "mp4_208_dumbbell bent over row.mp4": require("../assets/videos/mp4_208_dumbbell bent over row.mp4"),
  "mp4_209_dumbbell biceps curl.mp4": require("../assets/videos/mp4_209_dumbbell biceps curl.mp4"),
  "mp4_210_dumbbell bulgarian split squat.mp4": require("../assets/videos/mp4_210_dumbbell bulgarian split squat.mp4"),
  "mp4_211_dumbbell close grip press.mp4": require("../assets/videos/mp4_211_dumbbell close grip press.mp4"),
  "mp4_212_dumbbell concentration curl.mp4": require("../assets/videos/mp4_212_dumbbell concentration curl.mp4"),
  "mp4_213_dumbbell cross body hammer curl.mp4": require("../assets/videos/mp4_213_dumbbell cross body hammer curl.mp4"),
  "mp4_214_dumbbell deadlift.mp4": require("../assets/videos/mp4_214_dumbbell deadlift.mp4"),
  "mp4_215_dumbbell decline bench press.mp4": require("../assets/videos/mp4_215_dumbbell decline bench press.mp4"),
  "mp4_216_dumbbell decline fly.mp4": require("../assets/videos/mp4_216_dumbbell decline fly.mp4"),
  "mp4_217_dumbbell decline shrug.mp4": require("../assets/videos/mp4_217_dumbbell decline shrug.mp4"),
  "mp4_218_dumbbell decline triceps extension.mp4": require("../assets/videos/mp4_218_dumbbell decline triceps extension.mp4"),
  "mp4_219_dumbbell fly.mp4": require("../assets/videos/mp4_219_dumbbell fly.mp4"),
  "mp4_220_dumbbell front raise.mp4": require("../assets/videos/mp4_220_dumbbell front raise.mp4"),
  "mp4_221_dumbbell goblet squat.mp4": require("../assets/videos/mp4_221_dumbbell goblet squat.mp4"),
  "mp4_222_dumbbell hammer curl.mp4": require("../assets/videos/mp4_222_dumbbell hammer curl.mp4"),
  "mp4_223_dumbbell incline bench press.mp4": require("../assets/videos/mp4_223_dumbbell incline bench press.mp4"),
  "mp4_224_dumbbell incline biceps curl.mp4": require("../assets/videos/mp4_224_dumbbell incline biceps curl.mp4"),
  "mp4_225_dumbbell incline fly.mp4": require("../assets/videos/mp4_225_dumbbell incline fly.mp4"),
  "mp4_226_dumbbell incline hammer curl.mp4": require("../assets/videos/mp4_226_dumbbell incline hammer curl.mp4"),
  "mp4_227_dumbbell incline row.mp4": require("../assets/videos/mp4_227_dumbbell incline row.mp4"),
  "mp4_228_dumbbell kickback.mp4": require("../assets/videos/mp4_228_dumbbell kickback.mp4"),
  "mp4_229_dumbbell lateral raise.mp4": require("../assets/videos/mp4_229_dumbbell lateral raise.mp4"),
  "mp4_230_dumbbell lu raises.mp4": require("../assets/videos/mp4_230_dumbbell lu raises.mp4"),
  "mp4_231_dumbbell lunge.mp4": require("../assets/videos/mp4_231_dumbbell lunge.mp4"),
  "mp4_232_dumbbell lying femoral.mp4": require("../assets/videos/mp4_232_dumbbell lying femoral.mp4"),
  "mp4_233_dumbbell lying rear delt raise.mp4": require("../assets/videos/mp4_233_dumbbell lying rear delt raise.mp4"),
  "mp4_234_dumbbell lying supine biceps curl.mp4": require("../assets/videos/mp4_234_dumbbell lying supine biceps curl.mp4"),
  "mp4_235_dumbbell lying triceps extension.mp4": require("../assets/videos/mp4_235_dumbbell lying triceps extension.mp4"),
  "mp4_236_dumbbell lying wide curl.mp4": require("../assets/videos/mp4_236_dumbbell lying wide curl.mp4"),
  "mp4_237_dumbbell overhead press.mp4": require("../assets/videos/mp4_237_dumbbell overhead press.mp4"),
  "mp4_238_dumbbell pistol squat.mp4": require("../assets/videos/mp4_238_dumbbell pistol squat.mp4"),
  "mp4_239_dumbbell preacher curl.mp4": require("../assets/videos/mp4_239_dumbbell preacher curl.mp4"),
  "mp4_240_dumbbell preacher hammer curl.mp4": require("../assets/videos/mp4_240_dumbbell preacher hammer curl.mp4"),
  "mp4_241_dumbbell push press.mp4": require("../assets/videos/mp4_241_dumbbell push press.mp4"),
  "mp4_242_dumbbell rear delt raise.mp4": require("../assets/videos/mp4_242_dumbbell rear delt raise.mp4"),
  "mp4_243_dumbbell rear delt row.mp4": require("../assets/videos/mp4_243_dumbbell rear delt row.mp4"),
  "mp4_244_dumbbell reverse curl.mp4": require("../assets/videos/mp4_244_dumbbell reverse curl.mp4"),
  "mp4_245_dumbbell reverse grip concentration curl.mp4": require("../assets/videos/mp4_245_dumbbell reverse grip concentration curl.mp4"),
  "mp4_246_dumbbell reverse grip incline chest supported row.mp4": require("../assets/videos/mp4_246_dumbbell reverse grip incline chest supported row.mp4"),
  "mp4_247_dumbbell reverse lunge.mp4": require("../assets/videos/mp4_247_dumbbell reverse lunge.mp4"),
  "mp4_248_dumbbell reverse preacher curl.mp4": require("../assets/videos/mp4_248_dumbbell reverse preacher curl.mp4"),
  "mp4_249_dumbbell reverse spider curl.mp4": require("../assets/videos/mp4_249_dumbbell reverse spider curl.mp4"),
  "mp4_250_dumbbell romanian deadlift.mp4": require("../assets/videos/mp4_250_dumbbell romanian deadlift.mp4"),
  "mp4_251_dumbbell row.mp4": require("../assets/videos/mp4_251_dumbbell row.mp4"),
  "mp4_252_dumbbell seated calf raise.mp4": require("../assets/videos/mp4_252_dumbbell seated calf raise.mp4"),
  "mp4_253_dumbbell seated french press.mp4": require("../assets/videos/mp4_253_dumbbell seated french press.mp4"),
  "mp4_254_dumbbell seated lateral raise.mp4": require("../assets/videos/mp4_254_dumbbell seated lateral raise.mp4"),
  "mp4_255_dumbbell seated shoulder press.mp4": require("../assets/videos/mp4_255_dumbbell seated shoulder press.mp4"),
  "mp4_256_dumbbell shrug.mp4": require("../assets/videos/mp4_256_dumbbell shrug.mp4"),
  "mp4_257_dumbbell side bend.mp4": require("../assets/videos/mp4_257_dumbbell side bend.mp4"),
  "mp4_258_dumbbell spider curl.mp4": require("../assets/videos/mp4_258_dumbbell spider curl.mp4"),
  "mp4_259_dumbbell spider hammer curl.mp4": require("../assets/videos/mp4_259_dumbbell spider hammer curl.mp4"),
  "mp4_260_dumbbell squat.mp4": require("../assets/videos/mp4_260_dumbbell squat.mp4"),
  "mp4_261_dumbbell standing calf raise.mp4": require("../assets/videos/mp4_261_dumbbell standing calf raise.mp4"),
  "mp4_262_dumbbell standing concentration curl.mp4": require("../assets/videos/mp4_262_dumbbell standing concentration curl.mp4"),
  "mp4_263_dumbbell standing french press.mp4": require("../assets/videos/mp4_263_dumbbell standing french press.mp4"),
  "mp4_264_dumbbell standing unilateral tricep extension.mp4": require("../assets/videos/mp4_264_dumbbell standing unilateral tricep extension.mp4"),
  "mp4_265_dumbbell stiff leg deadlift.mp4": require("../assets/videos/mp4_265_dumbbell stiff leg deadlift.mp4"),
  "mp4_266_dumbbell straight arm pullover.mp4": require("../assets/videos/mp4_266_dumbbell straight arm pullover.mp4"),
  "mp4_267_dumbbell sumo pull through.mp4": require("../assets/videos/mp4_267_dumbbell sumo pull through.mp4"),
  "mp4_268_dumbbell tricep kickbacks.mp4": require("../assets/videos/mp4_268_dumbbell tricep kickbacks.mp4"),
  "mp4_269_dumbbell unilateral curl.mp4": require("../assets/videos/mp4_269_dumbbell unilateral curl.mp4"),
  "mp4_270_dumbbell unilateral hammer curl.mp4": require("../assets/videos/mp4_270_dumbbell unilateral hammer curl.mp4"),
  "mp4_271_dumbbell unilateral hammer preacher curl.mp4": require("../assets/videos/mp4_271_dumbbell unilateral hammer preacher curl.mp4"),
  "mp4_272_dumbbell unilateral lateral raise.mp4": require("../assets/videos/mp4_272_dumbbell unilateral lateral raise.mp4"),
  "mp4_273_dumbbell unilateral preacher curl.mp4": require("../assets/videos/mp4_273_dumbbell unilateral preacher curl.mp4"),
  "mp4_274_dumbbell unilateral reverse fly.mp4": require("../assets/videos/mp4_274_dumbbell unilateral reverse fly.mp4"),
  "mp4_275_dumbbell unilateral triceps extension.mp4": require("../assets/videos/mp4_275_dumbbell unilateral triceps extension.mp4"),
  "mp4_276_dumbbell upright row.mp4": require("../assets/videos/mp4_276_dumbbell upright row.mp4"),
  "mp4_277_dumbbell waiter biceps curl.mp4": require("../assets/videos/mp4_277_dumbbell waiter biceps curl.mp4"),
  "mp4_278_elliptical trainer.mp4": require("../assets/videos/mp4_278_elliptical trainer.mp4"),
  "mp4_279_ez bar close grip preacher curl.mp4": require("../assets/videos/mp4_279_ez bar close grip preacher curl.mp4"),
  "mp4_280_ez bar curl.mp4": require("../assets/videos/mp4_280_ez bar curl.mp4"),
  "mp4_281_ez bar jm bench press.mp4": require("../assets/videos/mp4_281_ez bar jm bench press.mp4"),
  "mp4_282_ez bar reverse grip bent over row.mp4": require("../assets/videos/mp4_282_ez bar reverse grip bent over row.mp4"),
  "mp4_283_ez bar reverse grip curl.mp4": require("../assets/videos/mp4_283_ez bar reverse grip curl.mp4"),
  "mp4_284_ez bar reverse grip preacher curl.mp4": require("../assets/videos/mp4_284_ez bar reverse grip preacher curl.mp4"),
  "mp4_285_ez bar seated close grip concentration curl.mp4": require("../assets/videos/mp4_285_ez bar seated close grip concentration curl.mp4"),
  "mp4_286_ez bar seated french press.mp4": require("../assets/videos/mp4_286_ez bar seated french press.mp4"),
  "mp4_287_ez bar skullcrushers.mp4": require("../assets/videos/mp4_287_ez bar skullcrushers.mp4"),
  "mp4_288_ez bar spider curl.mp4": require("../assets/videos/mp4_288_ez bar spider curl.mp4"),
  "mp4_289_ez bar standing french press.mp4": require("../assets/videos/mp4_289_ez bar standing french press.mp4"),
  "mp4_290_farmers walk.mp4": require("../assets/videos/mp4_290_farmers walk.mp4"),
  "mp4_291_front lever reps.mp4": require("../assets/videos/mp4_291_front lever reps.mp4"),
  "mp4_292_glute kickback machine.mp4": require("../assets/videos/mp4_292_glute kickback machine.mp4"),
  "mp4_293_glute-ham raise.mp4": require("../assets/videos/mp4_293_glute-ham raise.mp4"),
  "mp4_294_hack calf raise.mp4": require("../assets/videos/mp4_294_hack calf raise.mp4"),
  "mp4_295_hack squat.mp4": require("../assets/videos/mp4_295_hack squat.mp4"),
  "mp4_296_hack unilateral calf raise.mp4": require("../assets/videos/mp4_296_hack unilateral calf raise.mp4"),
  "mp4_297_hammer strength chest press.mp4": require("../assets/videos/mp4_297_hammer strength chest press.mp4"),
  "mp4_298_hammer strength deadlift.mp4": require("../assets/videos/mp4_298_hammer strength deadlift.mp4"),
  "mp4_299_hammer strength decline chest press.mp4": require("../assets/videos/mp4_299_hammer strength decline chest press.mp4"),
  "mp4_300_hammer strength incline chest press.mp4": require("../assets/videos/mp4_300_hammer strength incline chest press.mp4"),
  "mp4_301_hammer strength machine shrug.mp4": require("../assets/videos/mp4_301_hammer strength machine shrug.mp4"),
  "mp4_302_hammer strength shoulder press.mp4": require("../assets/videos/mp4_302_hammer strength shoulder press.mp4"),
  "mp4_303_hands bike.mp4": require("../assets/videos/mp4_303_hands bike.mp4"),
  "mp4_304_hanging leg hip raise.mp4": require("../assets/videos/mp4_304_hanging leg hip raise.mp4"),
  "mp4_305_hanging leg raise.mp4": require("../assets/videos/mp4_305_hanging leg raise.mp4"),
  "mp4_306_hanging oblique knee raise.mp4": require("../assets/videos/mp4_306_hanging oblique knee raise.mp4"),
  "mp4_307_hip abduction machine.mp4": require("../assets/videos/mp4_307_hip abduction machine.mp4"),
  "mp4_308_hip adduction machine.mp4": require("../assets/videos/mp4_308_hip adduction machine.mp4"),
  "mp4_309_hip thrust (leg extension machine).mp4": require("../assets/videos/mp4_309_hip thrust (leg extension machine).mp4"),
  "mp4_310_hyperextension.mp4": require("../assets/videos/mp4_310_hyperextension.mp4"),
  "mp4_311_incline dumbbell reverse fly.mp4": require("../assets/videos/mp4_311_incline dumbbell reverse fly.mp4"),
  "mp4_312_incline push-up.mp4": require("../assets/videos/mp4_312_incline push-up.mp4"),
  "mp4_313_inverted row.mp4": require("../assets/videos/mp4_313_inverted row.mp4"),
  "mp4_314_jump rope.mp4": require("../assets/videos/mp4_314_jump rope.mp4"),
  "mp4_315_kettlebell advanced windmill.mp4": require("../assets/videos/mp4_315_kettlebell advanced windmill.mp4"),
  "mp4_316_kettlebell alternating hang clean.mp4": require("../assets/videos/mp4_316_kettlebell alternating hang clean.mp4"),
  "mp4_317_kettlebell alternating press.mp4": require("../assets/videos/mp4_317_kettlebell alternating press.mp4"),
  "mp4_318_kettlebell alternating press on floor.mp4": require("../assets/videos/mp4_318_kettlebell alternating press on floor.mp4"),
  "mp4_319_kettlebell alternating renegade row.mp4": require("../assets/videos/mp4_319_kettlebell alternating renegade row.mp4"),
  "mp4_320_kettlebell alternating row.mp4": require("../assets/videos/mp4_320_kettlebell alternating row.mp4"),
  "mp4_321_kettlebell arnold press.mp4": require("../assets/videos/mp4_321_kettlebell arnold press.mp4"),
  "mp4_322_kettlebell bent press.mp4": require("../assets/videos/mp4_322_kettlebell bent press.mp4"),
  "mp4_323_kettlebell bottoms up clean from the hang position.mp4": require("../assets/videos/mp4_323_kettlebell bottoms up clean from the hang position.mp4"),
  "mp4_324_kettlebell double alternating hang clean.mp4": require("../assets/videos/mp4_324_kettlebell double alternating hang clean.mp4"),
  "mp4_325_kettlebell double jerk.mp4": require("../assets/videos/mp4_325_kettlebell double jerk.mp4"),
  "mp4_326_kettlebell double push press.mp4": require("../assets/videos/mp4_326_kettlebell double push press.mp4"),
  "mp4_327_kettlebell double snatch.mp4": require("../assets/videos/mp4_327_kettlebell double snatch.mp4"),
  "mp4_328_kettlebell double windmill.mp4": require("../assets/videos/mp4_328_kettlebell double windmill.mp4"),
  "mp4_329_kettlebell extended range one arm press on floor.mp4": require("../assets/videos/mp4_329_kettlebell extended range one arm press on floor.mp4"),
  "mp4_330_kettlebell figure 8.mp4": require("../assets/videos/mp4_330_kettlebell figure 8.mp4"),
  "mp4_331_kettlebell front squat.mp4": require("../assets/videos/mp4_331_kettlebell front squat.mp4"),
  "mp4_332_kettlebell goblet squat.mp4": require("../assets/videos/mp4_332_kettlebell goblet squat.mp4"),
  "mp4_333_kettlebell hang clean.mp4": require("../assets/videos/mp4_333_kettlebell hang clean.mp4"),
  "mp4_334_kettlebell lunge pass through.mp4": require("../assets/videos/mp4_334_kettlebell lunge pass through.mp4"),
  "mp4_335_kettlebell one arm clean and jerk.mp4": require("../assets/videos/mp4_335_kettlebell one arm clean and jerk.mp4"),
  "mp4_336_kettlebell one arm floor press.mp4": require("../assets/videos/mp4_336_kettlebell one arm floor press.mp4"),
  "mp4_337_kettlebell one arm jerk.mp4": require("../assets/videos/mp4_337_kettlebell one arm jerk.mp4"),
  "mp4_338_kettlebell one arm military press to the side.mp4": require("../assets/videos/mp4_338_kettlebell one arm military press to the side.mp4"),
  "mp4_339_kettlebell one arm push press.mp4": require("../assets/videos/mp4_339_kettlebell one arm push press.mp4"),
  "mp4_340_kettlebell one arm row.mp4": require("../assets/videos/mp4_340_kettlebell one arm row.mp4"),
  "mp4_341_kettlebell one arm snatch.mp4": require("../assets/videos/mp4_341_kettlebell one arm snatch.mp4"),
  "mp4_342_kettlebell pirate ships.mp4": require("../assets/videos/mp4_342_kettlebell pirate ships.mp4"),
  "mp4_343_kettlebell pistol squat.mp4": require("../assets/videos/mp4_343_kettlebell pistol squat.mp4"),
  "mp4_344_kettlebell plyo push-up.mp4": require("../assets/videos/mp4_344_kettlebell plyo push-up.mp4"),
  "mp4_345_kettlebell seated press.mp4": require("../assets/videos/mp4_345_kettlebell seated press.mp4"),
  "mp4_346_kettlebell seated two arm military press.mp4": require("../assets/videos/mp4_346_kettlebell seated two arm military press.mp4"),
  "mp4_347_kettlebell seesaw press.mp4": require("../assets/videos/mp4_347_kettlebell seesaw press.mp4"),
  "mp4_348_kettlebell sumo high pull.mp4": require("../assets/videos/mp4_348_kettlebell sumo high pull.mp4"),
  "mp4_349_kettlebell swing.mp4": require("../assets/videos/mp4_349_kettlebell swing.mp4"),
  "mp4_350_kettlebell thruster.mp4": require("../assets/videos/mp4_350_kettlebell thruster.mp4"),
  "mp4_351_kettlebell turkish get up.mp4": require("../assets/videos/mp4_351_kettlebell turkish get up.mp4"),
  "mp4_352_kettlebell two arm clean.mp4": require("../assets/videos/mp4_352_kettlebell two arm clean.mp4"),
  "mp4_353_kettlebell two arm military press.mp4": require("../assets/videos/mp4_353_kettlebell two arm military press.mp4"),
  "mp4_354_kettlebell two arm row.mp4": require("../assets/videos/mp4_354_kettlebell two arm row.mp4"),
  "mp4_355_kettlebell windmill.mp4": require("../assets/videos/mp4_355_kettlebell windmill.mp4"),
  "mp4_356_kneeling standing unilateral leg curl machine.mp4": require("../assets/videos/mp4_356_kneeling standing unilateral leg curl machine.mp4"),
  "mp4_357_landmine 180.mp4": require("../assets/videos/mp4_357_landmine 180.mp4"),
  "mp4_358_landmine lateral raise.mp4": require("../assets/videos/mp4_358_landmine lateral raise.mp4"),
  "mp4_359_lat pulldown machine.mp4": require("../assets/videos/mp4_359_lat pulldown machine.mp4"),
  "mp4_360_leg press calf raise.mp4": require("../assets/videos/mp4_360_leg press calf raise.mp4"),
  "mp4_361_linear leg press.mp4": require("../assets/videos/mp4_361_linear leg press.mp4"),
  "mp4_362_linear leg press calf raise.mp4": require("../assets/videos/mp4_362_linear leg press calf raise.mp4"),
  "mp4_363_machine calf press.mp4": require("../assets/videos/mp4_363_machine calf press.mp4"),
  "mp4_364_machine chest press.mp4": require("../assets/videos/mp4_364_machine chest press.mp4"),
  "mp4_365_machine chest supported underhand row.mp4": require("../assets/videos/mp4_365_machine chest supported underhand row.mp4"),
  "mp4_366_machine chest supported wide row.mp4": require("../assets/videos/mp4_366_machine chest supported wide row.mp4"),
  "mp4_367_machine high row.mp4": require("../assets/videos/mp4_367_machine high row.mp4"),
  "mp4_368_machine hip thrust.mp4": require("../assets/videos/mp4_368_machine hip thrust.mp4"),
  "mp4_369_machine incline chest press.mp4": require("../assets/videos/mp4_369_machine incline chest press.mp4"),
  "mp4_370_machine lateral raise.mp4": require("../assets/videos/mp4_370_machine lateral raise.mp4"),
  "mp4_371_machine leg extension.mp4": require("../assets/videos/mp4_371_machine leg extension.mp4"),
  "mp4_372_machine lying leg curl.mp4": require("../assets/videos/mp4_372_machine lying leg curl.mp4"),
  "mp4_373_machine preacher curl.mp4": require("../assets/videos/mp4_373_machine preacher curl.mp4"),
  "mp4_374_machine preacher hammer curl.mp4": require("../assets/videos/mp4_374_machine preacher hammer curl.mp4"),
  "mp4_375_machine pullover.mp4": require("../assets/videos/mp4_375_machine pullover.mp4"),
  "mp4_376_machine reverse grip preacher curl.mp4": require("../assets/videos/mp4_376_machine reverse grip preacher curl.mp4"),
  "mp4_377_machine reverse hyperextension.mp4": require("../assets/videos/mp4_377_machine reverse hyperextension.mp4"),
  "mp4_378_machine seated crunch.mp4": require("../assets/videos/mp4_378_machine seated crunch.mp4"),
  "mp4_379_machine seated leg curl.mp4": require("../assets/videos/mp4_379_machine seated leg curl.mp4"),
  "mp4_380_machine seated reverse fly.mp4": require("../assets/videos/mp4_380_machine seated reverse fly.mp4"),
  "mp4_381_machine seated reverse fly (neutral grip).mp4": require("../assets/videos/mp4_381_machine seated reverse fly (neutral grip).mp4"),
  "mp4_382_machine shoulder press.mp4": require("../assets/videos/mp4_382_machine shoulder press.mp4"),
  "mp4_383_machine shrug.mp4": require("../assets/videos/mp4_383_machine shrug.mp4"),
  "mp4_384_machine standing calf raise.mp4": require("../assets/videos/mp4_384_machine standing calf raise.mp4"),
  "mp4_385_machine triceps extension.mp4": require("../assets/videos/mp4_385_machine triceps extension.mp4"),
  "mp4_386_machine unilateral high row.mp4": require("../assets/videos/mp4_386_machine unilateral high row.mp4"),
  "mp4_387_machine unilateral lat pulldown.mp4": require("../assets/videos/mp4_387_machine unilateral lat pulldown.mp4"),
  "mp4_388_mountain climber.mp4": require("../assets/videos/mp4_388_mountain climber.mp4"),
  "mp4_389_muscle up.mp4": require("../assets/videos/mp4_389_muscle up.mp4"),
  "mp4_390_neutral grip pull-up.mp4": require("../assets/videos/mp4_390_neutral grip pull-up.mp4"),
  "mp4_391_one arm chin-up.mp4": require("../assets/videos/mp4_391_one arm chin-up.mp4"),
  "mp4_392_one arm lying rear delt dumbbell fly.mp4": require("../assets/videos/mp4_392_one arm lying rear delt dumbbell fly.mp4"),
  "mp4_393_pistol squat.mp4": require("../assets/videos/mp4_393_pistol squat.mp4"),
  "mp4_394_power clean.mp4": require("../assets/videos/mp4_394_power clean.mp4"),
  "mp4_395_pull-up.mp4": require("../assets/videos/mp4_395_pull-up.mp4"),
  "mp4_396_push-up.mp4": require("../assets/videos/mp4_396_push-up.mp4"),
  "mp4_397_reverse hack squat calf raise.mp4": require("../assets/videos/mp4_397_reverse hack squat calf raise.mp4"),
  "mp4_398_reverse hyperextension on flat bench.mp4": require("../assets/videos/mp4_398_reverse hyperextension on flat bench.mp4"),
  "mp4_399_ring dips.mp4": require("../assets/videos/mp4_399_ring dips.mp4"),
  "mp4_400_ring muscle up.mp4": require("../assets/videos/mp4_400_ring muscle up.mp4"),
  "mp4_401_rope climb.mp4": require("../assets/videos/mp4_401_rope climb.mp4"),
  "mp4_402_rowing machine.mp4": require("../assets/videos/mp4_402_rowing machine.mp4"),
  "mp4_403_running (Treadmill).mp4": require("../assets/videos/mp4_403_running (Treadmill).mp4"),
  "mp4_404_running (Outdoor).mp4": require("../assets/videos/mp4_404_running (Outdoor).mp4"),
  "mp4_405_seated calf raise machine.mp4": require("../assets/videos/mp4_405_seated calf raise machine.mp4"),
  "mp4_406_seated leg raise.mp4": require("../assets/videos/mp4_406_seated leg raise.mp4"),
  "mp4_407_seated machine fly.mp4": require("../assets/videos/mp4_407_seated machine fly.mp4"),
  "mp4_408_self assisted nordic ham curl.mp4": require("../assets/videos/mp4_408_self assisted nordic ham curl.mp4"),
  "mp4_409_sissy squat.mp4": require("../assets/videos/mp4_409_sissy squat.mp4"),
  "mp4_410_sit-up.mp4": require("../assets/videos/mp4_410_sit-up.mp4"),
  "mp4_411_ski ergometer.mp4": require("../assets/videos/mp4_411_ski ergometer.mp4"),
  "mp4_412_smith behind the back shrug.mp4": require("../assets/videos/mp4_412_smith behind the back shrug.mp4"),
  "mp4_413_smith bench press.mp4": require("../assets/videos/mp4_413_smith bench press.mp4"),
  "mp4_414_smith bent knee good morning.mp4": require("../assets/videos/mp4_414_smith bent knee good morning.mp4"),
  "mp4_415_smith bent over row.mp4": require("../assets/videos/mp4_415_smith bent over row.mp4"),
  "mp4_416_smith bulgarian split squat.mp4": require("../assets/videos/mp4_416_smith bulgarian split squat.mp4"),
  "mp4_417_smith chair squat.mp4": require("../assets/videos/mp4_417_smith chair squat.mp4"),
  "mp4_418_smith close-grip bench press.mp4": require("../assets/videos/mp4_418_smith close-grip bench press.mp4"),
  "mp4_419_smith deadlift.mp4": require("../assets/videos/mp4_419_smith deadlift.mp4"),
  "mp4_420_smith decline bench press.mp4": require("../assets/videos/mp4_420_smith decline bench press.mp4"),
  "mp4_421_smith front squat (clean grip).mp4": require("../assets/videos/mp4_421_smith front squat (clean grip).mp4"),
  "mp4_422_smith hack squat.mp4": require("../assets/videos/mp4_422_smith hack squat.mp4"),
  "mp4_423_smith hip thrust.mp4": require("../assets/videos/mp4_423_smith hip thrust.mp4"),
  "mp4_424_smith incline bench press.mp4": require("../assets/videos/mp4_424_smith incline bench press.mp4"),
  "mp4_425_smith machine incline tricep extension.mp4": require("../assets/videos/mp4_425_smith machine incline tricep extension.mp4"),
  "mp4_426_smith low bar squat.mp4": require("../assets/videos/mp4_426_smith low bar squat.mp4"),
  "mp4_427_smith lunge.mp4": require("../assets/videos/mp4_427_smith lunge.mp4"),
  "mp4_428_smith narrow row.mp4": require("../assets/videos/mp4_428_smith narrow row.mp4"),
  "mp4_429_smith reverse grip bench press.mp4": require("../assets/videos/mp4_429_smith reverse grip bench press.mp4"),
  "mp4_430_smith reverse grip bent over row.mp4": require("../assets/videos/mp4_430_smith reverse grip bent over row.mp4"),
  "mp4_431_smith seated calf raise.mp4": require("../assets/videos/mp4_431_smith seated calf raise.mp4"),
  "mp4_432_smith seated shoulder press.mp4": require("../assets/videos/mp4_432_smith seated shoulder press.mp4"),
  "mp4_433_smith seated unilateral calf raise.mp4": require("../assets/videos/mp4_433_smith seated unilateral calf raise.mp4"),
  "mp4_434_smith shrug.mp4": require("../assets/videos/mp4_434_smith shrug.mp4"),
  "mp4_435_smith squat.mp4": require("../assets/videos/mp4_435_smith squat.mp4"),
  "mp4_436_smith standing calf raise.mp4": require("../assets/videos/mp4_436_smith standing calf raise.mp4"),
  "mp4_437_smith standing military press.mp4": require("../assets/videos/mp4_437_smith standing military press.mp4"),
  "mp4_438_smith sumo squat.mp4": require("../assets/videos/mp4_438_smith sumo squat.mp4"),
  "mp4_439_smith unilateral calf raise.mp4": require("../assets/videos/mp4_439_smith unilateral calf raise.mp4"),
  "mp4_440_smith unilateral row.mp4": require("../assets/videos/mp4_440_smith unilateral row.mp4"),
  "mp4_441_smith upright row.mp4": require("../assets/videos/mp4_441_smith upright row.mp4"),
  "mp4_442_snatch pull.mp4": require("../assets/videos/mp4_442_snatch pull.mp4"),
  "mp4_443_squat jerk.mp4": require("../assets/videos/mp4_443_squat jerk.mp4"),
  "mp4_444_stair climber.mp4": require("../assets/videos/mp4_444_stair climber.mp4"),
  "mp4_445_stationary bike.mp4": require("../assets/videos/mp4_445_stationary bike.mp4"),
  "mp4_447_t bar row.mp4": require("../assets/videos/mp4_447_t bar row.mp4"),
  "mp4_448_trap bar deadlift.mp4": require("../assets/videos/mp4_448_trap bar deadlift.mp4"),
  "mp4_449_triceps dip.mp4": require("../assets/videos/mp4_449_triceps dip.mp4"),
  "mp4_450_triceps dip machine.mp4": require("../assets/videos/mp4_450_triceps dip machine.mp4"),
  "mp4_451_underhand machine lat pulldown.mp4": require("../assets/videos/mp4_451_underhand machine lat pulldown.mp4"),
  "mp4_452_underhand t-bar row.mp4": require("../assets/videos/mp4_452_underhand t-bar row.mp4"),
  "mp4_453_unilateral chest supported machine row.mp4": require("../assets/videos/mp4_453_unilateral chest supported machine row.mp4"),
  "mp4_454_unilateral linear leg press.mp4": require("../assets/videos/mp4_454_unilateral linear leg press.mp4"),
  "mp4_455_unilateral linear leg press calf raise.mp4": require("../assets/videos/mp4_455_unilateral linear leg press calf raise.mp4"),
  "mp4_456_unilateral lat pulldown.mp4": require("../assets/videos/mp4_456_unilateral lat pulldown.mp4"),
  "mp4_457_weighted bench dip.mp4": require("../assets/videos/mp4_457_weighted bench dip.mp4"),
  "mp4_458_weighted captains chair knee raises.mp4": require("../assets/videos/mp4_458_weighted captains chair knee raises.mp4"),
  "mp4_459_weighted chin up.mp4": require("../assets/videos/mp4_459_weighted chin up.mp4"),
  "mp4_460_weighted close grip chin-up.mp4": require("../assets/videos/mp4_460_weighted close grip chin-up.mp4"),
  "mp4_461_weighted decline sit-up.mp4": require("../assets/videos/mp4_461_weighted decline sit-up.mp4"),
  "mp4_462_weighted front plank.mp4": require("../assets/videos/mp4_462_weighted front plank.mp4"),
  "mp4_463_weighted hanging knee raise.mp4": require("../assets/videos/mp4_463_weighted hanging knee raise.mp4"),
  "mp4_464_weighted muscle up.mp4": require("../assets/videos/mp4_464_weighted muscle up.mp4"),
  "mp4_465_weighted neutral grip pull-up.mp4": require("../assets/videos/mp4_465_weighted neutral grip pull-up.mp4"),
  "mp4_466_weighted one hand pull up.mp4": require("../assets/videos/mp4_466_weighted one hand pull up.mp4"),
  "mp4_467_weighted pull-up.mp4": require("../assets/videos/mp4_467_weighted pull-up.mp4"),
  "mp4_468_weighted ring muscle up.mp4": require("../assets/videos/mp4_468_weighted ring muscle up.mp4"),
  "mp4_469_weighted russian twist.mp4": require("../assets/videos/mp4_469_weighted russian twist.mp4"),
  "mp4_470_weighted sissy squat.mp4": require("../assets/videos/mp4_470_weighted sissy squat.mp4"),
  "mp4_471_weighted tricep dips.mp4": require("../assets/videos/mp4_471_weighted tricep dips.mp4"),
  "mp4_472_wide grip pull-up.mp4": require("../assets/videos/mp4_472_wide grip pull-up.mp4"),
  "mp4_473_wrist roller.mp4": require("../assets/videos/mp4_473_wrist roller.mp4"),
  "mp4_474_zombie squat.mp4": require("../assets/videos/mp4_474_zombie squat.mp4"),
};

type VideoFileName = keyof typeof videoAssets;

/**
 * Retrieves a video asset by its file name.
 *
 * @param {VideoFileName} fileName - The name of the video file to retrieve.
 * @returns {Promise<Asset | null>} A promise that resolves to the video asset, or null if not found.
 * @throws An error if the video file is not found.
 */
const getVideoAsset = async (
  fileName: VideoFileName
): Promise<Asset | null> => {
  if (!videoAssets[fileName]) {
    throw new Error(`Video file not found: ${fileName}`);
  }

  const asset = Asset.fromModule(videoAssets[fileName]);
  await asset.downloadAsync();
  return asset;
};

/**
 * Saves a video file to the filesystem if it does not already exist.
 *
 * @remarks For the love of god DO NOT allow this to run everytime the app starts,
 * only run this once throughout the lifecycle of the app on the users device.
 *
 * @param {VideoFileName} fileName - The name of the video file to save.
 * @returns {Promise<string>} A promise that resolves to the URI of the saved video file.
 * @throws An error if the video file cannot be saved to the filesystem.
 */
const saveVideoToFilesystem = async (
  fileName: VideoFileName
): Promise<string> => {
  const vidUri = `${FileSystem.documentDirectory}/videos/${fileName}`;

  if (!(await FileSystem.getInfoAsync(vidUri)).exists) {
    try {
      const asset = await getVideoAsset(fileName);
      if (asset && asset.localUri) {
        await FileSystem.copyAsync({
          from: asset.localUri,
          to: vidUri,
        });
      }
    } catch (error) {
      throw new Error(`Failed to save video to filesystem: ${error}`);
    }
  }

  return vidUri;
};

/**
 * Seeds the database with categories and exercises if they don't exist.
 * If in development mode, also resets exercises and categories and
 * seeds the database with test workout data.
 *
 * @async
 * @param {ExpoSQLiteDatabase<Record<string, never>>} db - The database to seed.
 * @returns {Promise<void>} A promise that resolves when the database is seeded.
 */
export const seedDatabase = async (
  db: ExpoSQLiteDatabase<Record<string, never>>
): Promise<void> => {
  // When in development mode we need to clear the database of any existing
  // workout data and seed the database with the test workout
  if (__DEV__) {
    // During testing we may add or remove categories and exercises so we need to clear these too
    await db.delete(schema.categories);
    await db.delete(schema.exercises);
    await db.delete(schema.setsData);
    await db.delete(schema.personalRecords);

    await db
      .insert(schema.setsData)
      .values(processWorkoutData(workoutsTestData as unknown as Set[][]));
  }

  const categories = db.select().from(schema.categories).all();
  const exercises = db.select().from(schema.exercises).all();

  if (categories.length === 0) {
    await db.insert(schema.categories).values(categoriesData);
  }

  // Check the directory for the videos exists and if not create one, we don't need to put this in a loop
  const videoDirInfo = await FileSystem.getInfoAsync(
    `${FileSystem.documentDirectory}/videos/`
  );
  if (!videoDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}/videos/`,
      { intermediates: true }
    );
  }

  if (exercises.length === 0) {
    // Here we want to format our exercise data to replace the mp4Url with
    // the local URI generated during the seeding operation
    const mp4FormattedExercises = await Promise.all(
      exercisesData.map(async (exercise) => {
        // Not every exercise has a video so we need to check if it does so we dont get errors
        if (exercise.mp4Url && videoAssets[exercise.mp4Url as VideoFileName]) {
          const videoUri = await saveVideoToFilesystem(
            exercise.mp4Url as VideoFileName
          );
          return { ...exercise, mp4Url: videoUri };
        }
        return exercise;
      })
    );

    await db
      .insert(schema.exercises)
      .values(mp4FormattedExercises as Exercise[]);
  }
};
