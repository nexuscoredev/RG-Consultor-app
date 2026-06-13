/** Mensagens legíveis para erros HTTP da API. */
export function friendlyApiMessage(status: number, raw: string, path?: string): string {
  if (status === 0) {
    if (/tempo esgotado|abort/i.test(raw)) return 'Tempo esgotado ao contactar o servidor.';
    if (/network|fetch|failed/i.test(raw)) return 'Sem ligação ao servidor. Verifique a rede e a URL da API.';
    return raw || 'Não foi possível contactar o servidor.';
  }
  if (status === 401) {
    return path?.includes('/auth/login')
      ? 'E-mail ou senha inválidos.'
      : 'Sessão expirada. Inicie sessão novamente.';
  }
  if (status === 403) return 'Sem permissão para esta ação.';
  if (status === 404) return 'Recurso não encontrado no servidor.';
  if (status === 409) return 'Conflito de dados — atualize e tente novamente.';
  if (status === 422) return 'Dados inválidos. Revise os campos e tente novamente.';
  if (status >= 500) return 'Servidor indisponível. Tente novamente em instantes.';

  const trimmed = raw.trim();
  if (!trimmed) return `Erro inesperado (${status}).`;
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { error?: string; message?: string };
      const msg = parsed.error ?? parsed.message;
      if (msg && msg.length < 200) return msg;
    } catch {
      /* ignore */
    }
  }
  if (trimmed.length > 160) return `Erro ${status} ao contactar o servidor.`;
  return trimmed;
}
