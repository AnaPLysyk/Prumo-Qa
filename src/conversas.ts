import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { diretorioDados, semLinks } from './atividades.js';
import { mascarar } from './projeto.js';

/**
 * Conversas do chat, gravadas SOMENTE neste computador (escolha da pessoa, 2.9): pergunta, agente escolhido, fontes e
 * resposta, para o Cérebro mostrar os ramos de conversa e permitir testes controlados. Um arquivo por projeto,
 * limitado; segredos conhecidos são mascarados; a pessoa pode apagar tudo. Nada sai da máquina.
 */
const registro = z.object({
  versao: z.literal(1), id: z.string().uuid(), em: z.string().datetime(), agente: z.string().regex(/^[a-z0-9-]{1,40}$/),
  pergunta: z.string().max(400), linhas: z.array(z.string().max(6000)).max(20), fontes: z.array(z.object({ rotulo: z.string().max(60), aba: z.string().max(40) }).strict()).max(10),
  modo: z.enum(['LOCAL', 'CLAUDE', 'CODEX']), estilo: z.enum(['amigavel', 'direto', 'tecnico'])
}).strict();
export type RegistroConversa = z.infer<typeof registro>;
export const limitesConversa = { registros: 1500, bytes: 4 * 1024 * 1024 } as const;
const pasta = (base?: string) => path.join(diretorioDados(base), 'conversas');
const arquivo = (espacoId: string | null, base?: string) => path.join(pasta(base), (espacoId && /^[0-9a-f-]{36}$/.test(espacoId) ? espacoId : 'geral') + '.jsonl');

export function lerConversas(espacoId: string | null, base?: string): RegistroConversa[] {
  const alvo = arquivo(espacoId, base);
  try { semLinks(alvo); const st = fs.statSync(alvo); if (!st.isFile() || st.size > limitesConversa.bytes * 2) return []; } catch { return []; }
  const saida: RegistroConversa[] = [];
  for (const linha of fs.readFileSync(alvo, 'utf8').split('\n')) { if (!linha.trim()) continue; try { saida.push(registro.parse(JSON.parse(linha))); } catch { /* linha inválida ignorada */ } }
  return saida;
}
export function registrarConversa(espacoId: string | null, r: Omit<RegistroConversa, 'versao' | 'id' | 'em'>, base?: string): RegistroConversa {
  const novo = registro.parse({ versao: 1, id: randomUUID(), em: new Date().toISOString(), ...r, pergunta: mascarar(r.pergunta).slice(0, 400), linhas: r.linhas.map((l) => mascarar(l).slice(0, 6000)).slice(0, 20) });
  const alvo = arquivo(espacoId, base); fs.mkdirSync(pasta(base), { recursive: true, mode: 0o700 }); semLinks(alvo);
  let todos = [...lerConversas(espacoId, base), novo];
  let texto = todos.map((x) => JSON.stringify(x)).join('\n') + '\n';
  while ((todos.length > limitesConversa.registros || Buffer.byteLength(texto) > limitesConversa.bytes) && todos.length > 1) { todos = todos.slice(Math.ceil(todos.length * .1)); texto = todos.map((x) => JSON.stringify(x)).join('\n') + '\n'; }
  const tmp = `${alvo}.${randomUUID()}.tmp`; fs.writeFileSync(tmp, texto, { mode: 0o600 }); fs.renameSync(tmp, alvo);
  return novo;
}
/** Conversas de um agente (mais recentes primeiro), para o Cérebro. */
export const conversasDoAgente = (espacoId: string | null, agente: string, limite = 40, base?: string) => lerConversas(espacoId, base).filter((r) => r.agente === agente).reverse().slice(0, limite);
export function apagarConversas(espacoId: string | null, base?: string) { const alvo = arquivo(espacoId, base); try { semLinks(alvo); fs.rmSync(alvo, { force: true }); return { apagado: true }; } catch { return { apagado: false }; } }
