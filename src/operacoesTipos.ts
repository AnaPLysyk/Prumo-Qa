import type { z } from 'zod';
import type { ContextoServico } from './adaptadoresServicos.js';
import type { Recurso, Servico } from './espacos.js';

/** Resultado remoto verificável de uma escrita: identificador, chave e link oficial quando o serviço o fornece. */
export type Remoto = { id?: string; chave?: string; url?: string; detalhes?: Record<string, string | number | boolean | null | undefined> };
/** Dados locais que uma operação pode usar além dos parâmetros: arquivos que a pessoa autorizou anexar. */
export type Auxiliar = { arquivosAutorizados: readonly string[]; raizesDeEvidencia: readonly string[] };
export type DefOperacao<P = unknown> = {
  id: string; servico: Servico; rotulo: string; efeito: string; exigeConfirmacao: true;
  schema: z.ZodType<P, z.ZodTypeDef, unknown>;
  /** Texto curto e sem segredos mostrado na confirmação nativa e gravado no histórico. */
  resumo: (p: P) => string;
  executar: (ctx: ContextoServico, rec: Recurso, p: P, chave: string, aux: Auxiliar) => Promise<Remoto>;
  /** Depois de resposta perdida: procura no serviço o que esta mesma chave já criou. Evita duplicar. */
  reconciliar?: (ctx: ContextoServico, rec: Recurso, p: P, chave: string) => Promise<Remoto | null>;
  /** Releitura no serviço para confirmar que o efeito existe. */
  confirmar?: (ctx: ContextoServico, rec: Recurso, p: P, r: Remoto, chave: string) => Promise<boolean>;
};
export const marcador = (chave: string) => 'prumo-' + chave.slice(0, 10);
