/** Lê os registros mais recentes do diagnóstico da janela. */
import fs from 'node:fs';
import path from 'node:path';
import { eAtalho } from './eAtalho.js';
import { pastaDoDiagnostico } from './pastaDoDiagnostico.js';
import { EventoDiagnostico, eventoDiagnosticoSchema, nomeValido } from '../tipos/diagnostico.js';

export function lerDiagnostico(base?: string, limite = 200) {
  const dir = pastaDoDiagnostico(base); const eventos: EventoDiagnostico[] = []; let invalidos = 0;
  if (eAtalho(dir)) return { events: eventos, invalid: 0 };
  let nomes: string[] = []; try { nomes = fs.readdirSync(dir).filter(n => nomeValido.test(n)).sort(); } catch { return { events: eventos, invalid: 0 }; }
  for (const n of nomes) {
    if (eAtalho(path.join(dir, n))) continue;
    for (const l of fs.readFileSync(path.join(dir, n), 'utf8').split('\n').filter(Boolean)) {
      try { eventos.push(eventoDiagnosticoSchema.parse(JSON.parse(l))); } catch { invalidos++; }
    }
  }
  return { events: eventos.slice(-limite), invalid: invalidos };
}
