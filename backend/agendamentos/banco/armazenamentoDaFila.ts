/** Persistência da fila: leitura, gravação, estado das tarefas e batimentos. */
import { z } from 'zod';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { LIMITE, Registro, registro, Trabalho, trabalhoSchema } from '../tipos/fila.js';

export const lerFila = (base?: string): Registro =>
  lerLocal<Registro>(
    'fila.json',
    registro as unknown as z.ZodType<Registro>,
    { version: 1, trabalhos: [] },
    base
  );

export const gravarFila = (registroFila: Registro, base?: string) => {
  // Preserva sempre pendências e execuções; limita apenas o histórico concluído.
  if (registroFila.trabalhos.length > LIMITE) {
    const ativos = registroFila.trabalhos.filter(
      trabalho => trabalho.estado === 'PENDENTE' || trabalho.estado === 'EXECUTANDO'
    );
    const finalizados = registroFila.trabalhos
      .filter(trabalho => trabalho.estado !== 'PENDENTE' && trabalho.estado !== 'EXECUTANDO')
      .sort((primeiro, segundo) => primeiro.criadoEm.localeCompare(segundo.criadoEm))
      .slice(-(LIMITE - ativos.length));

    registroFila.trabalhos = [...finalizados, ...ativos];
  }
  gravarLocal('fila.json', registro.parse(registroFila), base);
};

export function obterTrabalho(id: string, base?: string) {
  const trabalho = lerFila(base).trabalhos.find(item => item.id === id);
  if (!trabalho) throw new Error('JOB_NOT_FOUND');
  return trabalho;
}

export function mudarTrabalho(id: string, alterar: (trabalho: Trabalho) => void, base?: string) {
  const fila = lerFila(base);
  const trabalho = fila.trabalhos.find(item => item.id === id);
  if (!trabalho) throw new Error('JOB_NOT_FOUND');

  alterar(trabalho);
  trabalhoSchema.parse(trabalho);
  gravarFila(fila, base);
  return trabalho;
}

export const definirEstadoJiraDoTrabalho = (id: string, jira: Trabalho['jira'], base?: string) =>
  mudarTrabalho(id, trabalho => {
    trabalho.jira = trabalhoSchema.shape.jira.parse(jira);
  }, base);

export const fecharTentativa = (
  trabalho: Trabalho,
  estado: 'CONCLUIDA' | 'ERRO' | 'INTERROMPIDA',
  iso: string,
  codigo?: string
) => {
  const tentativa = trabalho.log.at(-1);
  if (tentativa && tentativa.fim === null) {
    tentativa.fim = iso;
    tentativa.estado = estado;
    if (codigo) tentativa.codigo = codigo;
  }
};

export const registrarBatimento = (id: string, base?: string, agora = new Date()) =>
  mudarTrabalho(id, trabalho => {
    if (trabalho.estado === 'EXECUTANDO') {
      trabalho.heartbeat = agora.toISOString();
    }
  }, base);
