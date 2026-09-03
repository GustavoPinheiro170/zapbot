/**
 * There is no login system yet — every flow today belongs to this one constant "owner"
 * (the business running the bot). Routes already read the real user id from the
 * `x-user-id` header when present, falling back to this value otherwise, so wiring up
 * real authentication later is a matter of setting that header — no repository or schema
 * change needed.
 */
export const DEFAULT_USER_ID = "default-owner";
