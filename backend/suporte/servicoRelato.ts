/** Lógica e contratos de suporte: operações relacionadas no mesmo módulo. */
import { repositorio } from "../ajuda/contratos.js";
import { lerDiagnostico } from "../logs/banco/diagnostico.js";
import os from "node:os";
import { hash } from "../compartilhado/seguranca/hash.js";
import { Contexto, Solicitacao, rotulo, AVISO_PUBLICO, limiteUrl, modelo, solicitacaoSchema, urlBase, Achado } from "./contratos.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";

/** Validação do endereço antes de abrir: só o formulário oficial do repositório, em https. */
export function enderecoOficialDoRelato(url: string) {
  try { const u = new URL(url); return u.protocol === 'https:' && u.hostname === 'github.com' && u.pathname === `/${repositorio}/issues/new` && !u.username && !u.port && u.hash === ''; } catch { return false; }
}

/** Texto do relatório (Markdown), incluindo só o que a pessoa autorizou. */
export function montarTextoDoRelato(s: Solicitacao, c: Contexto) {
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
function montarEnderecoDoRelato(s: Solicitacao, corpo: ReturnType<typeof montarTextoDoRelato>) {
  const q = new URLSearchParams({ template: modelo[s.categoria], title: `[${rotulo[s.categoria]}] ${s.titulo}` });
  let truncado = false;
  for (const [id, valor] of [['descricao', corpo.descricao], ['esperado', corpo.esperado], ['passos', corpo.passos], ['ambiente', corpo.ambiente]] as const) {
    if (!valor) continue; let v: string = valor;
    q.set(id, v);
    while (`${urlBase}?${q}`.length > limiteUrl && v.length > 200) { v = v.slice(0, Math.floor(v.length * 0.8)); q.set(id, v + '…'); truncado = true; }
  }
  return { url: `${urlBase}?${q}`, truncado };
}

export function prepararRelato(entrada: unknown, c: Contexto) {
  const s = solicitacaoSchema.parse(entrada);
  if (s.categoria === 'bug' && !s.passos) return { ok: false as const, bloqueios: [{ tipo: 'passos para reproduzir são obrigatórios em bug', trecho: '' }], avisos: [], aviso: AVISO_PUBLICO };
  const corpo = montarTextoDoRelato(s, c);
  const { bloqueios, avisos } = revisarPrivacidadeDoRelato({ titulo: s.titulo, descricao: s.descricao, esperado: s.esperado, passos: s.passos, diagnostico: s.incluirDiagnostico ? c.diagnostico : undefined });
  if(bloqueios.length)return {ok:false as const,bloqueios,avisos:[],aviso:AVISO_PUBLICO};
  const { url, truncado } = montarEnderecoDoRelato(s, corpo);
  return { ok:true as const, bloqueios, avisos, aviso: AVISO_PUBLICO, idLocal:corpo.idLocal, titulo: `[${rotulo[s.categoria]}] ${s.titulo}`, markdown: corpo.markdown, url, truncado, publico: true, campos: { descricao: corpo.descricao, esperado: corpo.esperado, passos: corpo.passos, ambiente: corpo.ambiente } };
}

/** Revisão de privacidade: bloqueia segredos; apenas avisa dados pessoais e caminhos locais (a pessoa decide). Trechos já mascarados. */
export function revisarPrivacidadeDoRelato(textos: Record<string, string | undefined>) {
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

/** Resume somente os metadados recentes do diagnóstico para anexar ao relato autorizado. */
export function resumoDoDiagnosticoParaRelato() {
  return lerDiagnostico(undefined, 20).events
    .map(e => [e.at, e.channel, e.state, e.code ?? '', e.durationMs + 'ms'].filter(Boolean).join(' '))
    .join('\n');
}
