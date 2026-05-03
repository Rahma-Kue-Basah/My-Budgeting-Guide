const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type UserProfile = {
  full_name: string;
  initials: string;
  profile_color: string;
};

export type AuthUser = {
  pk: number;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile | null;
};

type ApiResult<T> = { data: T | null; error: string | null; status: number };

// Tracks an in-flight refresh so concurrent 401s only trigger one refresh attempt.
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${BASE_URL}/api/auth/token/refresh/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResult<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return { data: null, error: null, status: 204 };
  }

  // Access token expired — try to refresh once, then retry the original request.
  if (res.status === 401 && retry) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      return apiFetch<T>(path, options, false);
    }
    // Refresh token also expired → fire auth:expired only if not on a public page.
    if (typeof window !== "undefined") {
      const { pathname } = window.location;
      const isPublic =
        pathname === "/" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup");
      if (!isPublic) {
        window.dispatchEvent(new Event("auth:expired"));
      }
    }
    return { data: null, error: "Session expired.", status: 401 };
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    let message = "An error occurred";
    if (json && typeof json === "object") {
      message =
        json.non_field_errors?.[0] ??
        json.detail ??
        json.email?.[0] ??
        JSON.stringify(json);
    }
    return { data: null, error: message, status: res.status };
  }

  return { data: json as T, error: null, status: res.status };
}

export async function getUser() {
  return apiFetch<AuthUser>("/api/auth/user/");
}

export async function login(email: string, password: string) {
  return apiFetch<AuthUser>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return apiFetch<null>("/api/auth/logout/", { method: "GET" });
}

export async function register(payload: {
  email: string;
  password1: string;
  password2: string;
  full_name: string;
}) {
  return apiFetch<{ detail: string }>("/api/auth/registration/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
