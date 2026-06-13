import assert from 'node:assert/strict';

import { mergePipelineRows } from '../localPipelineStore';

const api = [
  {
    id: 'api-1',
    account: 'Empresa A',
    stage: 'Proposta enviada',
    phase: 'proposal' as const,
    owner: 'API',
    value: 'R$ 10k',
    updatedAt: 1000,
  },
];

const localNewer = [
  {
    id: 'local-a',
    account: 'Empresa A',
    stage: 'Proposta aceita',
    phase: 'acceptance' as const,
    owner: 'Você',
    value: 'R$ 12k',
    source: 'acceptance' as const,
    updatedAt: 2000,
  },
];

const merged = mergePipelineRows(api, localNewer);
assert.equal(merged.length, 1);
assert.equal(merged[0].stage, 'Proposta aceita');
assert.equal(merged[0].source, 'local');

const localOlder = [
  {
    id: 'local-b',
    account: 'Empresa B',
    stage: 'Prospecção',
    phase: 'prospecting' as const,
    owner: 'Você',
    value: 'Qualificação',
    source: 'prospecting' as const,
    updatedAt: 500,
  },
];

const apiB = [
  {
    id: 'api-b',
    account: 'Empresa B',
    stage: 'Proposta enviada',
    phase: 'proposal' as const,
    owner: 'API',
    value: 'R$ 8k',
    updatedAt: 1500,
  },
];

const mergedB = mergePipelineRows(apiB, localOlder);
assert.equal(mergedB[0].source, 'api');

console.log('pipelineMerge.test.ts: ok');
