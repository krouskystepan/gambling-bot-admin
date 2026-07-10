/**
 * Client-safe presentation constants.
 *
 * These live outside {@link ./presentationMode} (which is `server-only`) so both
 * client and server code can import the sentinel ids without pulling in the
 * server-only barrel. Do not add runtime/Node-only logic here.
 */

/** Sentinel guild id rendered by the always-on `/present` demo. */
export const DEMO_GUILD_ID = '000000000000000000'

/** Synthetic user id attached to the presentation session. */
export const PRESENTATION_USER_ID = 'presentation-viewer'

/** Internal request header the proxy sets for `/present/*` routes. */
export const PRESENTATION_HEADER = 'x-presentation'
