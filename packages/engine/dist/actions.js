"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actionMetadata = void 0;
exports.actionForMinutes = actionForMinutes;
exports.getValidDurations = getValidDurations;
exports.isValidDuration = isValidDuration;
/**
 * Maps session duration in minutes to the corresponding action
 * Minutes (inclusive) → Action
 * 5–15 → Train
 * 16–30 → Eat
 * 31–45 → Learn
 * 46–60 → Bathe
 * 61–75 → Sleep
 * 76–90 → Maintain
 * 91–105 → Fight
 * 106–120 → Adventure
 */
function actionForMinutes(minutes) {
    // Clamp to supported 5–120 range (5-min steps assumed upstream)
    const m = Math.max(5, Math.min(120, Math.round(minutes)));
    if (m <= 15)
        return "Train";
    if (m <= 30)
        return "Eat";
    if (m <= 45)
        return "Learn";
    if (m <= 60)
        return "Bathe";
    if (m <= 75)
        return "Sleep";
    if (m <= 90)
        return "Maintain";
    if (m <= 105)
        return "Fight";
    return "Adventure"; // 106–120
}
/**
 * Get action metadata including emoji, description, and background theme
 */
exports.actionMetadata = {
    Train: {
        emoji: "⚔️",
        label: "Train",
        description: "Practice combat skills and build strength",
        background: "campfire",
        idleAnimation: "training"
    },
    Eat: {
        emoji: "🍎",
        label: "Eat",
        description: "Restore energy with a hearty meal",
        background: "kitchen",
        idleAnimation: "eating"
    },
    Learn: {
        emoji: "🧠",
        label: "Learn",
        description: "Study ancient knowledge and spells",
        background: "library",
        idleAnimation: "studying"
    },
    Bathe: {
        emoji: "🛁",
        label: "Bathe",
        description: "Clean and refresh your spirit",
        background: "bathhouse",
        idleAnimation: "bathing"
    },
    Sleep: {
        emoji: "😴",
        label: "Sleep",
        description: "Rest and recover your strength",
        background: "bedroll",
        idleAnimation: "sleeping"
    },
    Maintain: {
        emoji: "🔧",
        label: "Maintain",
        description: "Care for your equipment and gear",
        background: "workshop",
        idleAnimation: "maintaining"
    },
    Fight: {
        emoji: "⚡",
        label: "Fight",
        description: "Engage in intense combat training",
        background: "arena",
        idleAnimation: "fighting"
    },
    Adventure: {
        emoji: "🗺️",
        label: "Adventure",
        description: "Explore unknown territories",
        background: "cave_mouth",
        idleAnimation: "exploring"
    }
};
/**
 * Get valid session durations (5-minute steps from 5 to 120)
 */
function getValidDurations() {
    const durations = [];
    for (let i = 5; i <= 120; i += 5) {
        durations.push(i);
    }
    return durations;
}
/**
 * Validate if a duration is supported
 */
function isValidDuration(minutes) {
    return minutes >= 5 && minutes <= 120 && minutes % 5 === 0;
}
