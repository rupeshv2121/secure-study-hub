const API_BASE = new URL((import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, ""));

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith("/api") ? path : path.startsWith("/") ? `/api${path}` : `/api/${path}`;
  return new URL(normalizedPath, API_BASE).toString();
};

const getToken = () => {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
};

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

  return fetch(url, merged);
}

export default apiFetch;
