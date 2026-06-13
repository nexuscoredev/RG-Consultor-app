type UnauthorizedHandler = () => void | Promise<void>;

let handler: UnauthorizedHandler | null = null;

/** Regista callback para 401 da API (ex.: logout + redirect). Devolve cleanup. */
export function registerUnauthorizedHandler(fn: UnauthorizedHandler): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

export async function notifyUnauthorized(): Promise<void> {
  await handler?.();
}
