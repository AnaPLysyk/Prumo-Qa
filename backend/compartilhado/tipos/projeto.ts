/** Formato do contrato qa.project.json (schema v2), dos comandos permitidos e do projeto carregado. */
import { z } from 'zod';

export const nome = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/);

export const relativo = z.string().min(1).max(500);

export const comandoObjeto = z.object({
  executable: z.enum(['node', 'npm']), args: z.array(z.string().max(500)).min(1).max(40),
  cwd: relativo.default('.'), env: z.record(z.string().max(2000)).default({}),
  requiredFiles: z.array(relativo).max(30).default([]), requiredEnv: z.array(nome).max(30).default([]),
  timeoutMs: z.number().int().min(50).max(300000).optional(),
  maxOutputBytes: z.number().int().min(256).max(1048576).optional()
}).strict();

export const manifestoSchema = z.object({
  schemaVersion: z.literal(2), id: nome, name: z.string().min(1).max(200),
  context: z.object({ documentation: z.array(relativo).max(50), tests: z.array(relativo).max(50), code: z.array(relativo).max(50) }).strict(),
  commands: z.record(nome, z.union([z.string().min(1).max(2000), comandoObjeto])),
  execution: z.object({ requireApproval: z.literal(true), blockedByDefault: z.array(nome), environment: z.literal('host'),
    readOnly: z.boolean().default(false), envAllowlist: z.array(nome).max(30).default([]),
    timeoutMs: z.number().int().min(50).max(300000).default(30000),
    maxOutputBytes: z.number().int().min(256).max(1048576).default(65536)
  }).strict()
}).strict();

export type Manifesto = z.infer<typeof manifestoSchema>;

export type Comando = z.infer<typeof comandoObjeto>;

export type Projeto = { raiz: string; manifesto: Manifesto; manifestoHash: string };

export const negados = /^(?:\.env(?:\..*)?|env\.local|\.git|\.ssh|\.aws|\.azure|\.npmrc|\.netrc|credentials(?:\..*)?|secrets?(?:\..*)?|id_rsa|id_ed25519|node_modules|dist|build|coverage|\.prumo)$/i;
