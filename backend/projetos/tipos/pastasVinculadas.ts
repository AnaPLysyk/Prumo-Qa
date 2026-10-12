/** Formato da lista de pastas vinculadas (vinculos.json) e da situação de cada pasta. */
import { z } from 'zod';

/**
 * Vínculos locais: apenas a lista de raízes que a pessoa escolheu abrir no aplicativo.
 * O contrato continua sendo o qa.project.json do projeto; nada dele é copiado para cá.
 */
export const arquivoSchema = z.object({ version: z.literal(1), projects: z.array(z.object({ root: z.string().min(1).max(1000), addedAt: z.string().datetime() }).strict()).max(200) }).strict();

export type Situacao = {
  root: string; state: 'INTEGRADO' | 'SEM_MANIFESTO' | 'MANIFESTO_INVALIDO' | 'PASTA_AUSENTE';
  id?: string; name?: string; capabilities?: string[]; readOnly?: boolean; message: string; instructions?: string;
};

export const instrucoesManifesto = 'Vincule a pasta pelo aplicativo: o Prumo detecta a stack, mostra o qa.project.json proposto e só cria o arquivo se você aprovar. Para escrever à mão: schemaVersion 2, context (documentation, tests, code), commands e execution.requireApproval=true. Contrato existente nunca é sobrescrito; veja Ajuda › Como vincular.';
