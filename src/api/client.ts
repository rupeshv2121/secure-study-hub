const API_BASE = new URL(
  (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, ""),
);

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith("/api")
    ? path
    : path.startsWith("/")
      ? `/api${path}`
      : `/api/${path}`;
  return new URL(normalizedPath, API_BASE).toString();
};

const getToken = () => {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
};

// Fired when the API rejects our stored token (expired or revoked). AuthContext
// listens for it and drops the session so the app doesn't keep sending it.
export const AUTH_EXPIRED_EVENT = "auth:expired";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = buildUrl(path);
  const defaultOptions: RequestInit = { credentials: "include" };
  // Merge headers carefully and inject Authorization if token present
  const merged: RequestInit = { ...defaultOptions, ...options } as RequestInit;
  const token = getToken();
  const existingHeaders = (merged.headers as Record<string, string>) || {};
  const headers: Record<string, string> = { ...existingHeaders };
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  merged.headers = headers;

  const res = await fetch(url, merged);

  // /auth/* returns 401 for a wrong password, which says nothing about the
  // stored session, so only other endpoints count as an expired token.
  if (res.status === 401 && token && !path.replace(/^\/?(api\/)?/, "").startsWith("auth/")) {
    try {
      localStorage.removeItem("auth_token");
    } catch {
      // storage unavailable
    }
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }

  return res;
}

export default apiFetch;
