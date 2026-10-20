/** Lê, grava, lista e atualiza execuções de testes locais. */
import { z } from "zod";
import { gravarLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { lerLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { Registro, registro, RunLocal, runSchema } from "./tipos/runLocal.js";

export const lerRunsLocais = (base?: string) =>
  lerLocal<Registro>(
    'runs-qase.json',
    registro as unknown as z.ZodType<Registro>,
    { version: 1, itens: [] },
    base
  );

export const gravarRunsLocais = (execucoes: Registro, base?: string) =>
  gravarLocal('runs-qase.json', registro.parse(execucoes), base);

export function obterRunLocal(id: string, base?: string) {
  const execucao = lerRunsLocais(base).itens.find(item => item.id === id);
  if (!execucao) throw new Error('RUN_NOT_FOUND');
  return execucao;
}

export function alterarRunLocal(
  id: string,
  alterar: (execucao: RunLocal) => void,
  base?: string,
  agora = new Date()
) {
  const registroExecucoes = lerRunsLocais(base);
  const execucao = registroExecucoes.itens.find(item => item.id === id);
  if (!execucao) throw new Error('RUN_NOT_FOUND');

  alterar(execucao);
  execucao.atualizadaEm = agora.toISOString();
  runSchema.parse(execucao);
  gravarRunsLocais(registroExecucoes, base);
  return execucao;
}

export const listarRunsLocais = (espacoId?: string, b?: string) => lerRunsLocais(b).itens.filter(r => !espacoId || r.espacoId === espacoId).sort((a, c) => c.criadaEm.localeCompare(a.criadaEm));
