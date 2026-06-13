import { getApiBaseUrl } from './apiConfig';

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

function friendlyMessage(status: number, text: string, path?: string): string {
  if (status === 401) {
    if (path?.includes('/auth/login')) {
      try {
        const j = JSON.parse(text) as { error?: string; message?: string };
        return j.error ?? j.message ?? 'E-mail ou senha incorretos.';
      } catch {
        return 'E-mail ou senha incorretos.';
      }
    }
    return 'Sessão expirada. Faça login novamente.';
  }
  if (status === 403) return 'Sem permissão para esta ação.';
  if (status === 404) return 'Recurso não encontrado.';
  if (status >= 500) return 'Erro no servidor. Tente de novo.';
  try {
    const j = JSON.parse(text) as { message?: string; error?: string };
    return j.message ?? j.error ?? `Erro ${status}`;
  } catch {
    return text || `Erro ${status}`;
  }
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timeout = opts.signal ? null : setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
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
    if (
      e instanceof TypeError ||
      (e instanceof Error && /fetch|network|failed/i.test(e.message))
    ) {
      throw new ApiError(
        `Não foi possível contactar a API (${base}). Confirme npm run api no PC e a mesma Wi‑Fi no tablet.`,
        0,
      );
    }
    throw e;
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(friendlyMessage(res.status, text, path), res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
