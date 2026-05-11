import type { Setting } from "./schemas/setting.js";

export const SETTING_KEYS = {
  SPEED_TIMEOUT_CLASSIC_MS: "speed_timeout_classic_ms",
  SPEED_TIMEOUT_PICK_FLAG_MS: "speed_timeout_pick_flag_ms",
  SPEED_TIMEOUT_PICK_ITEM_MS: "speed_timeout_pick_item_ms",
  PICK_OPTIONS_MIN: "pick_options_min",
  PICK_OPTIONS_MAX: "pick_options_max",
  FSRS_REQUEST_RETENTION: "fsrs_request_retention",
  FSRS_MAXIMUM_INTERVAL: "fsrs_maximum_interval",
  PRESENTATION_CONFIG: "presentation_config",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export const DEFAULT_SETTINGS: Setting[] = [
  {
    key: "speed_timeout_classic_ms",
    value: "10000",
    type: "number",
    label: "Speed timeout — Classic (ms)",
    category: "Speed Mode",
  },
  {
    key: "speed_timeout_pick_flag_ms",
    value: "5000",
    type: "number",
    label: "Speed timeout — Pick the Flag (ms)",
    category: "Speed Mode",
  },
  {
    key: "speed_timeout_pick_item_ms",
    value: "5000",
    type: "number",
    label: "Speed timeout — Pick the Name (ms)",
    category: "Speed Mode",
  },
  {
    key: "pick_options_min",
    value: "2",
    type: "number",
    label: "Minimum answer choices",
    category: "Pick Mode",
  },
  {
    key: "pick_options_max",
    value: "6",
    type: "number",
    label: "Maximum answer choices",
    category: "Pick Mode",
  },
  {
    key: "fsrs_request_retention",
    value: "0.9",
    type: "number",
    label: "Target retention rate (0-1)",
    category: "Advanced",
  },
  {
    key: "fsrs_maximum_interval",
    value: "365",
    type: "number",
    label: "Maximum review interval (days)",
    category: "Advanced",
  },
  {
    key: "presentation_config",
    value: '{"tag_order":[],"show_title_slide":true,"show_end_slide":true,"show_analytics":true,"show_mnemonics":true}',
    type: "string",
    label: "Presentation config",
    category: "Presentation",
  },
];
