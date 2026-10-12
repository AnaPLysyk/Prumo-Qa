/** Grava uma conversa com segredos mascarados e limite de tamanho. */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { arquivoDeConversas } from './arquivoDeConversas.js';
import { lerConversas } from './lerConversas.js';
import { pastaDasConversas } from './pastaDasConversas.js';
import { RegistroConversa, limitesConversa, registro } from '../tipos/conversas.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';

export function registrarConversa(espacoId: string | null, r: Omit<RegistroConversa, 'versao' | 'id' | 'em'>, base?: string): RegistroConversa {
  const novo = registro.parse({ versao: 1, id: randomUUID(), em: new Date().toISOString(), ...r, pergunta: mascarar(r.pergunta).slice(0, 400), linhas: r.linhas.map((l) => mascarar(l).slice(0, 6000)).slice(0, 20) });
  const alvo = arquivoDeConversas(espacoId, base); fs.mkdirSync(pastaDasConversas(base), { recursive: true, mode: 0o700 }); semLinks(alvo);
  let todos = [...lerConversas(espacoId, base), novo];
  let texto = todos.map((x) => JSON.stringify(x)).join('\n') + '\n';
  while ((todos.length > limitesConversa.registros || Buffer.byteLength(texto) > limitesConversa.bytes) && todos.length > 1) { todos = todos.slice(Math.ceil(todos.length * .1)); texto = todos.map((x) => JSON.stringify(x)).join('\n') + '\n'; }
  const tmp = `${alvo}.${randomUUID()}.tmp`; fs.writeFileSync(tmp, texto, { mode: 0o600 }); fs.renameSync(tmp, alvo);
  return novo;
}
