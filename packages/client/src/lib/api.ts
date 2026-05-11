import { useMemo } from "react";
import { useActiveCollection } from "./collection-context";
import { getToken, clearToken } from "./auth";

const BASE = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || res.statusText);
  }

  return res.json();
}

function makeClient(prefix: string) {
  const p = (path: string) => `${prefix}${path}`;
  return {
    get: <T>(path: string) => request<T>(p(path)),
    post: <T>(path: string, body: unknown) =>
      request<T>(p(path), { method: "POST", body: JSON.stringify(body) }),
    put: <T>(path: string, body: unknown) =>
      request<T>(p(path), { method: "PUT", body: JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(p(path), { method: "DELETE" }),
  };
}

// Global API client — used for routes that are not collection-scoped:
//   /auth, /decks, /settings, /health
export const api = {
  ...makeClient(""),

  login: async (password: string) => {
    const res = await fetch(`${BASE}/auth/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return res.json() as Promise<{ ok: boolean; token?: string; error?: string }>;
  },
};

// Hook returning an API client whose paths are prefixed with the active collection.
export function useCollectionApi() {
  const { collection } = useActiveCollection();
  return useMemo(() => makeClient(`/${collection.id}`), [collection.id]);
}

// Programmatic factory (for one-off cases outside React hooks). Prefer useCollectionApi().
export function collectionApi(collectionId: string) {
  return makeClient(`/${collectionId}`);
}
