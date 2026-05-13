/**
 * RG Consultor — corporativo minimal + Eco-Tech
 * Cinzas claros, branco, esmeralda para ação e hierarquia.
 */
const forestDeep = '#065f46';
const forest = '#047857';
const lime = '#34d399';
/** Fundo app — branco puro (tema claro corporativo) */
const snow = '#ffffff';
const paper = '#ffffff';
const spaceLine = 'rgba(17, 24, 39, 0.08)';
const ink = '#111827';
/** Texto secundário / apoio — alinhado a slate corporativo */
const inkMuted = '#6b7280';
const danger = '#dc2626';
/** Elite / pódio / detalhes de topo — usar com parcimônia */
const goldMatte = '#b89a6a';

const softBg = '#1a2620';
const softCard = '#243028';
const softLine = '#3a4a42';

export default {
  light: {
    text: ink,
    textSecondary: inkMuted,
    background: snow,
    card: paper,
    border: spaceLine,
    tint: forest,
    forestDeep,
    lime,
    goldMatte,
    tabIconDefault: '#8a9a92',
    tabIconSelected: forestDeep,
    accentMuted: lime,
    danger,
  },
  dark: {
    text: '#f4faf7',
    textSecondary: '#a8bdb0',
    background: softBg,
    card: softCard,
    border: softLine,
    tint: lime,
    forestDeep: '#0d4d32',
    lime,
    goldMatte,
    tabIconDefault: '#7a8f85',
    tabIconSelected: lime,
    accentMuted: forest,
    danger,
  },
};
