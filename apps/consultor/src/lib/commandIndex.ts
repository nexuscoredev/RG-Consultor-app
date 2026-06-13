import { FUNNEL_HUB } from '@/lib/commercialFunnel';
import { TOOL_CONTENT } from '@/lib/commercialContent';
import { getJson } from '@/lib/storage';
import type { ClientRow } from '@/lib/api';
import { loadLocalPipeline } from '@/lib/pipelineStore';

export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  path: string;
  keywords?: string;
};

const NAV: CommandItem[] = [
  { id: 'nav-home', label: 'Início', group: 'Navegação', path: '/', keywords: 'home painel dashboard' },
  { id: 'nav-agenda', label: 'Agenda', group: 'Navegação', path: '/agenda', keywords: 'visitas paradas rota' },
  { id: 'nav-visita', label: 'Modo visita', group: 'Navegação', path: '/comercial/visita', keywords: 'check-in visita campo' },
  { id: 'nav-comercial', label: 'Funil comercial', group: 'Navegação', path: '/comercial', keywords: 'comercial funil' },
  { id: 'nav-pipeline', label: 'Pipeline', group: 'Navegação', path: '/comercial/pipeline', keywords: 'crm oportunidades' },
  { id: 'nav-clientes', label: 'Clientes', group: 'Navegação', path: '/comercial/clientes', keywords: 'cadastro empresa' },
  { id: 'nav-proposta', label: 'Nova proposta', group: 'Navegação', path: '/comercial/proposta', keywords: 'pdf proposta' },
  { id: 'nav-settings', label: 'Configurações', group: 'Navegação', path: '/configuracoes', keywords: 'conta tema api' },
];

function toolItems(): CommandItem[] {
  const items: CommandItem[] = [];
  for (const phase of FUNNEL_HUB) {
    for (const tool of phase.tools) {
      const slug = tool.path.replace('/comercial/', '');
      const content = TOOL_CONTENT[slug];
      items.push({
        id: `tool-${slug}`,
        label: tool.label,
        hint: phase.title,
        group: 'Ferramentas',
        path: tool.path,
        keywords: content?.title ?? slug,
      });
    }
  }
  return items;
}

function clientItems(): CommandItem[] {
  const local = getJson<ClientRow[]>('rg_clients_local', []);
  return local.map((c) => ({
    id: `client-${c.id}`,
    label: c.company,
    hint: c.contact ?? 'Cliente local',
    group: 'Clientes',
    path: `/comercial/prospecao?company=${encodeURIComponent(c.company)}`,
    keywords: `${c.company} ${c.contact ?? ''} ${c.segment ?? ''}`,
  }));
}

function pipelineItems(): CommandItem[] {
  return loadLocalPipeline().map((r) => ({
    id: `pipe-${r.id}`,
    label: r.account,
    hint: r.stage,
    group: 'Pipeline',
    path: '/comercial/pipeline',
    keywords: `${r.account} ${r.stage} ${r.value}`,
  }));
}

export function buildCommandIndex(): CommandItem[] {
  return [...NAV, ...toolItems(), ...clientItems(), ...pipelineItems()];
}

export function filterCommands(query: string, items: CommandItem[]): CommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, 12);
  const scored = items
    .map((item) => {
      const blob = `${item.label} ${item.hint ?? ''} ${item.keywords ?? ''} ${item.group}`.toLowerCase();
      if (blob.includes(q)) return { item, score: blob.indexOf(q) === 0 ? 2 : 1 };
      return null;
    })
    .filter((x): x is { item: CommandItem; score: number } => x != null)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 12).map((s) => s.item);
}
