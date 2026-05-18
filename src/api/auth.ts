import apiFetch from "@/api/client";

import type { LoginPayload, RegisterPayload } from "@/interfaces/apiAuth";

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function register(payload: RegisterPayload) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(res);
  return { ok: res.ok, status: res.status, body };
}

export async function login(payload: LoginPayload) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(res);
  return { ok: res.ok, status: res.status, body };
}

export async function syncUser(email: string, name?: string) {
  const res = await apiFetch("/auth/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name }),
  });

  const body = await parseJsonSafe(res);
  return { ok: res.ok, status: res.status, body };
}

export async function webhook(payload: any, secret?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) headers["x-supabase-webhook-secret"] = secret;

  const res = await apiFetch("/auth/webhook", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(res);
  return { ok: res.ok, status: res.status, body };
}

export async function getMe() {
  const res = await apiFetch("/me", { credentials: "include" });
  const body = await parseJsonSafe(res);
  return { ok: res.ok, status: res.status, body };
}

export default {
  register,
  login,
  syncUser,
  webhook,
  getMe,
};
