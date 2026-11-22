import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { capitalizarNome } from '../src/utils/formatacao.ts';

describe('capitalizarNome', () => {
  const casos = [
    ['ruan', 'Ruan'],
    ['maria silva', 'Maria Silva'],
    ['maria da silva', 'Maria da Silva'],
    ['joao de souza', 'Joao de Souza'],
    [' ANA   SILVA', 'Ana Silva'],
    ['da silva', 'Da Silva'],
    ['', ''],
  ];

  for (const [entrada, esperado] of casos) {
    it(`transforma ${JSON.stringify(entrada)} em ${JSON.stringify(esperado)}`, () => {
      assert.equal(capitalizarNome(entrada), esperado);
    });
  }
});
