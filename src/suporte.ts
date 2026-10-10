import os from 'node:os';
import { z } from 'zod';
import { hash, mascarar } from './projeto.js';
import { repositorio } from './versoes.js';

/**
 * Central de suporte (marco 2.5). Prepara uma solicitação LOCALMENTE (bug, melhoria ou sugestão), revisa a privacidade e
 * monta o endereço oficial de GitHub Issues para a pessoa REVISAR e ENVIAR. Nada é enviado por este módulo: não há rede,
 * não há anexo automático e nenhum e-mail de suporte é inventado. Issues de repositório público são públicas.
 */
export const categorias = ['bug', 'melhoria', 'sugestao'] as const;
const rotulo = { bug: 'Bug', melhoria: 'Melhoria', sugestao: 'Sugestão' } as const;
const modelo = { bug: 'bug.yml', melhoria: 'melhoria.yml', sugestao: 'sugestao.yml' } as const;
export const solicitacaoSchema = z.object({
  categoria: z.enum(categorias), titulo: z.string().trim().min(5).max(120), descricao: z.string().trim().min(10).max(4000),
  esperado: z.string().trim().max(2000).optional(), passos: z.string().trim().max(2000).optional(),
  incluirVersao: z.boolean().default(true), incluirSistema: z.boolean().default(false), incluirDiagnostico: z.boolean().default(false),
  consentimento: z.literal(true)
}).strict();
export type Solicitacao = z.infer<typeof solicitacaoSchema>;
export type Contexto = { versao: string; diagnostico?: string };

export const AVISO_PUBLICO = 'Não inclua senhas, tokens, documentos privados, código confidencial ou dados pessoais nos relatos públicos.';
export const urlBase = `https://github.com/${repositorio}/issues/new`;
const limiteUrl = 7000;

type Achado = { tipo: string; trecho: string };
/** Revisão de privacidade: BLOQUEIA segredos; apenas AVISA dados pessoais e caminhos locais (a pessoa decide). Trechos já mascarados. */
export function revisarPrivacidade(textos: Record<string, string | undefined>) {
  const bloqueios: Achado[] = []; const avisos: Achado[] = [];
  const regras: { tipo: string; re: RegExp; grave: boolean }[] = [
    { tipo: 'chave privada', re: /-----BEGIN [^-]*PRIVATE KEY-----/, grave: true },
    { tipo: 'token de acesso', re: /\b(?:gh[pousr]_[\w]{10,}|sk-[\w-]{15,}|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}|xox[abp]-[\w-]{10,}|AKIA[0-9A-Z]{12,})\b/, grave: true },
    { tipo: 'credencial em endereço', re: /https?:\/\/[^/\s:@]+:[^/\s@]+@/, grave: true },
    { tipo: 'segredo atribuído (senha, token, chave)', re: /\b(?:password|passwd|senha|token|secret|segredo|api[_-]?key|authorization)\s*["']?\s*[:=]\s*["']?(?!\[REDACTED\])[^\s,"'}]{4,}/i, grave: true },
    { tipo: 'cabeçalho Authorization', re: /\bBearer\s+[\w.+/=-]{8,}/i, grave: true },
    { tipo: 'arquivo de segredos (.env)', re: /(^|[\s"'\\/])\.env(\.[\w.-]+)?\b/, grave: true },
    { tipo: 'e-mail', re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/, grave: false },
    { tipo: 'CPF', re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, grave: false },
    { tipo: 'telefone', re: /(?:\+?55\s*)?\(?\b\d{2}\)?\s*9?\d{4}[-\s]?\d{4}\b/, grave: false },
    { tipo: 'caminho local do computador', re: /\b[A-Za-z]:\\(?:Users|Usuários)\\[^\s"']+|\\\\[\w.-]+\\[\w$.-]+|\/home\/[\w.-]+\/|\/Users\/[\w.-]+\//, grave: false }
  ];
  for (const [campo, texto] of Object.entries(textos)) {
    if (!texto) continue;
    for (const r of regras) { const m = r.re.exec(texto); if (m) (r.grave ? bloqueios : avisos).push({ tipo: `${r.tipo} (${campo})`, trecho: r.grave?'[REDACTED]':mascarar(m[0]).slice(0, 60) }); }
  }
  return { bloqueios, avisos };
}

/** Texto do relatório (Markdown), incluindo só o que a pessoa autorizou. */
export function montarCorpo(s: Solicitacao, c: Contexto) {
  const idLocal = 'LOCAL-' + hash(JSON.stringify({ categoria:s.categoria,titulo:s.titulo,descricao:s.descricao,esperado:s.esperado,passos:s.passos })).slice(0,16);
  const ambiente: string[] = [];
  if (s.incluirVersao) ambiente.push(`Prumo QA ${c.versao}`);
  if (s.incluirSistema) ambiente.push(`Sistema: ${os.platform()} ${os.release()} (${os.arch()})`);
  if (s.incluirDiagnostico) ambiente.push('Diagnóstico da interface (somente metadados):\n' + (c.diagnostico || '(nenhum evento registrado)'));
  return {
    descricao: s.descricao, esperado: s.esperado ?? '', passos: s.passos ?? '', ambiente: ambiente.join('\n'),
    idLocal,
    markdown: ['---', `id: ${idLocal}`, `tipo: ${s.categoria}`, 'status: rascunho_local', 'origem: aplicativo', ...(s.incluirVersao ? [`versao: ${JSON.stringify(c.versao)}`] : []), '---', '', `# [${rotulo[s.categoria]}] ${s.titulo}`, '', 'Identificador local do relato; não é número de chamado GitHub.', '', '## Descrição', s.descricao,
      ...(s.esperado ? ['', s.categoria === 'bug' ? '## Comportamento esperado' : '## Benefício esperado', s.esperado] : []),
      ...(s.passos ? ['', '## Passos para reproduzir', s.passos] : []), ...(ambiente.length ? ['', '## Ambiente', ambiente.join('\n')] : [])].join('\n')
  };
}
/** Endereço oficial do formulário do GitHub com os campos do template preenchidos (ids: descricao, esperado, passos, ambiente). */
export function montarUrl(s: Solicitacao, corpo: ReturnType<typeof montarCorpo>) {
  const q = new URLSearchParams({ template: modelo[s.categoria], title: `[${rotulo[s.categoria]}] ${s.titulo}` });
  let truncado = false;
  for (const [id, valor] of [['descricao', corpo.descricao], ['esperado', corpo.esperado], ['passos', corpo.passos], ['ambiente', corpo.ambiente]] as const) {
    if (!valor) continue; let v: string = valor;
    q.set(id, v);
    while (`${urlBase}?${q}`.length > limiteUrl && v.length > 200) { v = v.slice(0, Math.floor(v.length * 0.8)); q.set(id, v + '…'); truncado = true; }
  }
  return { url: `${urlBase}?${q}`, truncado };
}
/** Validação do endereço antes de abrir: só o formulário oficial do repositório, em https. */
export function urlOficial(url: string) {
  try { const u = new URL(url); return u.protocol === 'https:' && u.hostname === 'github.com' && u.pathname === `/${repositorio}/issues/new` && !u.username && !u.port && u.hash === ''; } catch { return false; }
}
const padraoLink = new RegExp(`^https://github\\.com/${repositorio.replace('/', '\\/').replace('.', '\\.')}/issues/\\d{1,9}$`);
export const linkDeIssueValido = (l: string) => padraoLink.test(l);

export function prepararSolicitacao(entrada: unknown, c: Contexto) {
  const s = solicitacaoSchema.parse(entrada);
  if (s.categoria === 'bug' && !s.passos) return { ok: false as const, bloqueios: [{ tipo: 'passos para reproduzir são obrigatórios em bug', trecho: '' }], avisos: [], aviso: AVISO_PUBLICO };
  const corpo = montarCorpo(s, c);
  const { bloqueios, avisos } = revisarPrivacidade({ titulo: s.titulo, descricao: s.descricao, esperado: s.esperado, passos: s.passos, diagnostico: s.incluirDiagnostico ? c.diagnostico : undefined });
  if(bloqueios.length)return {ok:false as const,bloqueios,avisos:[],aviso:AVISO_PUBLICO};
  const { url, truncado } = montarUrl(s, corpo);
  return { ok:true as const, bloqueios, avisos, aviso: AVISO_PUBLICO, idLocal:corpo.idLocal, titulo: `[${rotulo[s.categoria]}] ${s.titulo}`, markdown: corpo.markdown, url, truncado, publico: true, campos: { descricao: corpo.descricao, esperado: corpo.esperado, passos: corpo.passos, ambiente: corpo.ambiente } };
}
