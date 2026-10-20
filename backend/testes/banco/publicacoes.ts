/** Consulta e registra publicações dos resultados de teste. */
import { z } from "zod";
import { lerLocal, gravarLocal } from "../../compartilhado/banco/persistenciaLocal.js";
import { Registro, registro } from "../tipos/escritaQase.js";

export const publicacaoDoTrabalho = (id: string, b?: string) => lerPublicacoesJira(b).itens.find(x => x.trabalhoId === id) ?? null;

export const lerPublicacoesJira = (base?: string): Registro =>
  lerLocal<Registro>(
    'publicacoes-jira.json',
    registro as unknown as z.ZodType<Registro>,
    { version: 1, itens: [] },
    base
  );

export const gravarPublicacoesJira = (publicacoes: Registro, base?: string) => {
  if (publicacoes.itens.length > 1000) {
    publicacoes.itens = publicacoes.itens.slice(-1000);
  }
  gravarLocal('publicacoes-jira.json', registro.parse(publicacoes), base);
};
