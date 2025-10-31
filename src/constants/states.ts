// User state constants for the Telegram bot
// These constants represent different states a user can be in during bot interactions

/** State when waiting for apartment information */
export const StateWaitingApartment = "waiting_apartment";

/** State when confirming apartment information */
export const StateConfirmApartment = "confirm_apartment";

/** State when waiting for cold meter reading */
export const StateWaitingColdMeter = "waiting_cold_meter";

/** State when waiting for hot meter reading */
export const StateWaitingHotMeter = "waiting_hot_meter";

/** State when confirming meter readings */
export const StateConfirmMeters = "confirm_meters";

/** State when waiting for meter readings */
export const StateWaitingReadings = "waiting_readings";

/** State when confirming readings */
export const StateConfirmReadings = "confirm_readings";

/** State when waiting for news title */
export const StateWaitingNewsTitle = "waiting_news_title";

/** State when waiting for news content */
export const StateWaitingNewsContent = "waiting_news_content";

/** State when confirming news */
export const StateConfirmNews = "confirm_news";

/** Idle state when user is not in any specific workflow */
export const StateIdle = "idle";

/** Export all states as a single object for easy import */
export const UserStates = {
  StateWaitingApartment,
  StateConfirmApartment,
  StateWaitingColdMeter,
  StateWaitingHotMeter,
  StateConfirmMeters,
  StateWaitingReadings,
  StateConfirmReadings,
  StateWaitingNewsTitle,
  StateWaitingNewsContent,
  StateConfirmNews,
  StateIdle
} as const;

export type UserState = typeof UserStates[keyof typeof UserStates];