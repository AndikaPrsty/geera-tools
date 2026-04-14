export const TASK_CONSTANTS = {
	THRESHOLD_MINUTES_PER_STORY_POINT: 68,
	RETRY_INTERVAL_MS: 10 * 1000, // 10 seconds
	DEFAULT_WATCH_INTERVAL: 60, // 60 seconds
	TIMER_UPDATE_INTERVAL: 100, // 100ms for timer display
	MAX_RETRY_ATTEMPTS: 5,
} as const;

export const STATUS_PATTERNS = {
	DONE: /done/i,
	REVIEW: /review/i,
	HOLD: /hold/i,
	PROGRESS: /progress/i,
} as const;
