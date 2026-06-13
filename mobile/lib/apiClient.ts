import { getApiBaseUrl, isApiEnabled } from '@/lib/apiConfig';
import { friendlyApiMessage } from '@/lib/apiErrors';
import { notifyUnauthorized } from '@/lib/sessionAuth';

const DEFAULT_TIMEOUT_MS = 25_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiError('API URL não configurada.', 0);
  }
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timeout = opts.signal
    ? null
    : setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const signal = opts.signal ?? controller.signal;

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ApiError('Tempo esgotado ao contactar o servidor.', 0);
    }
    throw e;
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) {
      if (!path.includes('/auth/login')) {
        void notifyUnauthorized();
      }
    }
    throw new ApiError(friendlyApiMessage(res.status, text, path), res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiHealthCheck(): Promise<boolean> {
  try {
    const base = getApiBaseUrl();
    if (!base) return false;
    const res = await fetch(`${base}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
