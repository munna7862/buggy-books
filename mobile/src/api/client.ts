import { type ApiRoute, buildPath } from '@buggybooks/contracts';

const DEFAULT_ANDROID_EMULATOR_URL = 'http://10.0.2.2:4000';

/** Base URL of the backend. Inlined at bundle time by Expo from EXPO_PUBLIC_API_URL. */
export function getBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  return (fromEnv && fromEnv.trim()) || DEFAULT_ANDROID_EMULATOR_URL;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
}

interface ErrorBody {
  error?: string;
  message?: string;
}

/**
 * Sends a request to a route from @buggybooks/contracts. The method and path
 * always come from the shared contract, never from a string in the app.
 */
export async function apiRequest<T>(route: ApiRoute, options: RequestOptions = {}): Promise<T> {
  const { params, query, body, token, timeoutMs = 10000 } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${buildPath(route.path, params)}${queryString(query)}`, {
      method: route.method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('Cannot reach the BuggyBooks server', 0);
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  const data: unknown = text ? safeJson(text) : undefined;

  if (!response.ok) {
    const errorBody = (data ?? {}) as ErrorBody;
    throw new ApiError(errorBody.error || errorBody.message || `Request failed (${response.status})`, response.status);
  }
  return data as T;
}

function queryString(query: Record<string, string> = {}): string {
  const pairs = Object.entries(query).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
