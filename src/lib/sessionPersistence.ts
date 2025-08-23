// HELPER FUNCTIONS FOR SESSION PERSISTENCE
const SESSION_CLEANUP_DAYS = 7;

export const getSessionStorageKey = (sessionId: string, key: string) =>
  `session_${sessionId}_${key}`;

export const getSessionTimestampKey = (sessionId: string) =>
  `session_${sessionId}_timestamp`;

export const persistSessionData = (
  sessionId: string,
  key: string,
  data: unknown
) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      getSessionStorageKey(sessionId, key),
      JSON.stringify(data)
    );
    localStorage.setItem(
      getSessionTimestampKey(sessionId),
      Date.now().toString()
    );
  } catch (error) {
    console.error("Error persisting session data:", error);
  }
};

export const loadSessionData = (sessionId: string, key: string) => {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem(getSessionStorageKey(sessionId, key));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error loading session data:", error);
    return null;
  }
};

export const cleanupOldSessions = () => {
  if (typeof window === "undefined") return;

  const cutoffTime = Date.now() - SESSION_CLEANUP_DAYS * 24 * 60 * 60 * 1000;
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("session_") && key.includes("_timestamp")) {
      try {
        const timestamp = parseInt(localStorage.getItem(key) || "0");
        if (timestamp < cutoffTime) {
          const sessionId = key
            .replace("session_", "")
            .replace("_timestamp", "");

          for (let j = 0; j < localStorage.length; j++) {
            const sessionKey = localStorage.key(j);
            if (sessionKey && sessionKey.startsWith(`session_${sessionId}_`)) {
              keysToRemove.push(sessionKey);
            }
          }
        }
      } catch (error) {
        console.error("Error checking session timestamp:", error);
      }
    }
  }

  // remove session data
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

export const clearSessionData = (sessionId: string) => {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`session_${sessionId}_`)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
};
