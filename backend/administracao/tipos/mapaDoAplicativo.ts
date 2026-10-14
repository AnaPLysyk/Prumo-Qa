/** Formato do mapa da Documentação viva: telas com interface, canais IPC, backend por papel e testes, gerado do código no build. */
import { z } from 'zod';

const arquivo = z.object({ caminho: z.string().max(300), descricao: z.string().max(2000).nullable(), funcoes: z.array(z.string().max(120)).max(400), usadoPor: z.number().int().min(0) }).strict();

export const mapaDoAplicativoSchema = z.object({
  schemaVersion: z.literal(1), geradoEm: z.string().max(40), versao: z.string().max(40), commit: z.string().max(40).nullable(),
  papeis: z.record(z.string().max(40), z.string().max(400)),
  telas: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]{1,40}$/), descricao: z.string().max(400).nullable(),
    frontend: z.array(arquivo).max(500),
    canais: z.array(z.object({ canal: z.string().max(60), ponte: z.string().max(80).nullable(), api: z.string().max(300), chama: z.array(z.string().max(120)).max(100), telas: z.array(z.string().max(300)).max(100) }).strict()).max(300),
    backend: z.record(z.enum(['api', 'regras', 'banco', 'integracoes', 'tipos', 'outros']), z.array(arquivo).max(1000)),
    testes: z.array(z.object({ caminho: z.string().max(300), descricao: z.string().max(2000).nullable() }).strict()).max(500)
  }).strict()).max(100),
  totais: z.object({ telas: z.number().int(), arquivosFrontend: z.number().int(), arquivosBackend: z.number().int(), canais: z.number().int(), testes: z.number().int() }).strict()
}).strict();

export type MapaDoAplicativo = z.infer<typeof mapaDoAplicativoSchema>;

/** O mapa tem no máximo este tamanho em bytes; maior que isso é recusado sem ler. */
export const LIMITE_MAPA = 4 * 1024 * 1024;

/** Código de cada arquivo do mapa, gerado no build em dist/documentacao/codigo.json (caminho → texto). Lido um arquivo por pedido. */
export const LIMITE_CODIGO_TOTAL = 12 * 1024 * 1024;
export const LIMITE_CODIGO_ARQUIVO = 200 * 1024;
export const caminhoDeCodigoSchema = z.string().max(300).regex(/^(frontend|backend|testes)\/[A-Za-z0-9_./-]+\.(ts|js|mjs|cjs|css|html)$/).refine((c) => !c.split('/').includes('..'));
export type CodigoDoArquivo = { caminho: string; texto: string; linhas: number; bytes: number; truncado: boolean };
