/** Formato do histórico de versões (docs/catalogo/versoes.json), o padrão de número de versão e o repositório oficial. */
import { z } from 'zod';

export const repositorio = 'AnaPLysyk/Prumo-Qa';

export const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export const lista = z.array(z.string().min(1).max(600)).max(30);

export const versaoSchema = z.object({
  version: z.string().regex(semver),
  // publicada: release oficial; repositorio: código no GitHub sem release; planejada: ainda não publicada.
  status: z.enum(['publicada', 'repositorio', 'planejada']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  title: z.string().min(1).max(120), objective: z.string().min(1).max(800),
  features: lista, improvements: lista, fixes: lista, differential: z.string().max(800), howItWorks: lista,
  security: lista, compatibility: lista, limitations: lista, migration: z.string().max(600), afterUpdate: lista,
  releaseUrl: z.string().url().nullable(),
  // Instalador oficial: o SHA-256 vem do arquivo .sha256 anexado à release (conferido no CI); só existe para versão publicada.
  installer: z.object({ file: z.string().regex(/^Prumo-QA-Setup-\d+\.\d+\.\d+\.exe$/), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict().optional()
}).strict();

export const versoesSchema = z.object({ schemaVersion: z.literal(1), versions: z.array(versaoSchema).min(1).max(100) }).strict();

export type Versao = z.infer<typeof versaoSchema>;
