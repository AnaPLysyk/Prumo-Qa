/** Cada projeto do Jira ou do Qase, cada repositório do GitHub e cada pasta local ficam em um único projeto do Prumo: sem destino ambíguo para os agentes. */
import fs from "node:fs";
import { Espaco, Recurso, Servico } from "./contratos.js";

const ROTULO: Record<Servico, string> = { jira: 'projeto do Jira', qase: 'projeto do Qase', github: 'repositório do GitHub' };

/** Mesmo serviço, mesma instância e mesmo ID/código: a conta usada para conectar não faz diferença (duas contas podem enxergar o mesmo projeto). */
export const identidadeDoRecurso = (servico: Servico, recurso: Recurso) =>
  [servico, recurso.instancia.toLowerCase(), String(recurso.id).toLowerCase()].join('|');

const pastaComparavel = (pasta: string) => { try { return fs.realpathSync.native(pasta).toLowerCase(); } catch { return String(pasta).toLowerCase(); } };

/** O projeto do Prumo que já usa este recurso, sem contar `exceto` (o projeto que está sendo editado). */
export const donoDoRecurso = (espacos: Espaco[], servico: Servico, recurso: Recurso, exceto?: string) =>
  espacos.find(e => e.id !== exceto && e.vinculos.some(v => v.servico === servico && identidadeDoRecurso(v.servico, v.recurso) === identidadeDoRecurso(servico, recurso))) ?? null;

export const donoDaPasta = (espacos: Espaco[], pasta: string, exceto?: string) =>
  espacos.find(e => e.id !== exceto && e.pastaLocal && pastaComparavel(e.pastaLocal) === pastaComparavel(pasta)) ?? null;

export function exigirRecursoLivre(espacos: Espaco[], servico: Servico, recurso: Recurso, exceto?: string) {
  const dono = donoDoRecurso(espacos, servico, recurso, exceto);
  if (dono) throw new Error(`RESOURCE_ALREADY_LINKED: o ${ROTULO[servico]} ${recurso.chave} já está no projeto "${dono.nome}" do Prumo. Cada projeto, repositório ou pasta fica em um só projeto do Prumo: abra "${dono.nome}" ou remova o vínculo de lá antes.`);
}

export function exigirPastaLivre(espacos: Espaco[], pasta: string, exceto?: string) {
  const dono = donoDaPasta(espacos, pasta, exceto);
  if (dono) throw new Error(`WORKSPACE_LOCAL_DUPLICATE: esta pasta já é do projeto "${dono.nome}" do Prumo. Cada pasta fica em um só projeto: abra "${dono.nome}" ou troque a pasta de lá antes.`);
}

/** Duplicidades que já existiam antes desta regra: o que este projeto divide com outro (para avisar a pessoa e os agentes). */
export function duplicidadesDoEspaco(espaco: Espaco, espacos: Espaco[]): { onde: Servico | 'local'; projeto: string }[] {
  const achadas: { onde: Servico | 'local'; projeto: string }[] = [];
  for (const v of espaco.vinculos) { const dono = donoDoRecurso(espacos, v.servico, v.recurso, espaco.id); if (dono) achadas.push({ onde: v.servico, projeto: dono.nome }); }
  const pasta = espaco.pastaLocal ? donoDaPasta(espacos, espaco.pastaLocal, espaco.id) : null;
  if (pasta) achadas.push({ onde: 'local', projeto: pasta.nome });
  return achadas;
}
