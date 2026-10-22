/** Lógica e contratos de tickets: operações relacionadas no mesmo módulo. */
import { z } from "zod";
import { codificarParaUrl } from "../compartilhado/texto.js";
import { ContextoServico } from "../conexoes/tipos/adaptador.js";
import { Remoto, DefOperacao, Auxiliar } from "../conexoes/tipos/operacao.js";
import { Recurso } from "../projetos/contratos.js";
import path from "node:path";
import { montarEnvioDeArquivo } from "../conexoes/integracoes/montarEnvioDeArquivo.js";
import { anexar, comentar, criar, editar, tipos, transicionar, vincular } from "./contratos.js";
import { marcadorDaOperacao } from "../conexoes/escrita/chaveDaOperacao.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { ErroServico } from "../conexoes/integracoes/configuracaoDosServicos.js";
import { textoEntreAspasJql } from "../conexoes/integracoes/configuracaoDosServicos.js";
import { Filtros } from "../conexoes/tipos/adaptador.js";
import fs from "node:fs";

export const acharTicketCriadoPeloPrumo = async (ctx: ContextoServico, rec: Recurso, rot: string): Promise<Remoto | null> => {
  const jql = `project = ${rec.id} AND labels = "${rot}"`;
  const r = z.object({ issues: z.array(z.object({ key: z.string(), id: z.string() }).passthrough()) }).parse(await ctx.ler(`/rest/api/3/search/jql?jql=${codificarParaUrl(jql)}&fields=key&maxResults=1`));
  const i = r.issues[0]; return i ? { id: i.id, chave: i.key, url: enderecoDoTicket(ctx, i.key) } : null;
};

export const anexarArquivo: DefOperacao<z.infer<typeof anexar>> = {
  id: 'jira.anexar', servico: 'jira', rotulo: 'Anexar arquivo a ticket do Jira', efeito: 'Envia um arquivo (log, imagem, vídeo ou evidência) como anexo do ticket. Textos têm segredos mascarados; imagens e vídeos são enviados como estão.', exigeConfirmacao: true, schema: anexar,
  resumo: p => `Anexar "${path.basename(p.arquivo)}" a ${p.ticket}`,
  async executar(ctx, rec, p, _k, aux) {
    await projetoDoTicket(ctx, rec, p.ticket); const a = lerAnexo(p.arquivo, aux); const nome = p.nome ?? a.nome;
    const m = montarEnvioDeArquivo('file', { nome, tipo: a.tipo, dados: a.dados });
    const r = z.array(z.object({ id: z.string(), filename: z.string(), size: z.number() }).passthrough()).parse(await ctx.enviar('POST', `/rest/api/3/issue/${codificarParaUrl(p.ticket)}/attachments`, m.corpo, m.tipoConteudo, { 'X-Atlassian-Token': 'no-check' }));
    return { id: r[0]?.id, chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket), detalhes: { arquivo: r[0]?.filename ?? nome, bytes: r[0]?.size ?? a.tamanho } };
  },
  async reconciliar(ctx, rec, p, _k) {
    const lista = z.object({ fields: z.object({ attachment: z.array(z.object({ id: z.string(), filename: z.string(), size: z.number() }).passthrough()).default([]) }).passthrough() }).parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(p.ticket)}?fields=attachment`));
    const nome = p.nome ?? path.basename(p.arquivo); const existe = lista.fields.attachment.find(x => x.filename === nome);
    return existe ? { id: existe.id, chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket), detalhes: { arquivo: existe.filename, bytes: existe.size } } : null;
  }
};

export const acharComentarioDoPrumo = async (ctx: ContextoServico, t: string, k: string): Promise<Remoto | null> => { const c = (await comentariosDoTicket(ctx, t)).find(x => JSON.stringify(x.body).includes(marcadorNoComentario(k))); return c ? { id: c.id, chave: t, url: enderecoDoTicket(ctx, t) } : null; };

export const comentariosDoTicket = async (ctx: ContextoServico, t: string) => z.object({ comments: z.array(z.object({ id: z.string(), body: z.unknown() }).passthrough()).default([]) }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(t)}/comment?maxResults=100&orderBy=-created`)).comments;

export const marcadorNoComentario = (k: string) => `[${marcadorDaOperacao(k)}]`;

export const comentarTicket: DefOperacao<z.infer<typeof comentar>> = {
  id: 'jira.comentar', servico: 'jira', rotulo: 'Comentar em ticket do Jira', efeito: 'Adiciona um comentário de texto ao ticket do projeto vinculado. Não altera status, campos nem anexos.', exigeConfirmacao: true, schema: comentar,
  resumo: p => `Comentar em ${p.ticket}: "${p.texto.slice(0, 80)}${p.texto.length > 80 ? '…' : ''}"`,
  async executar(ctx, rec, p, k) {
    await projetoDoTicket(ctx, rec, p.ticket); const r = z.object({ id: z.string() }).passthrough().parse(await ctx.enviar('POST', `/rest/api/3/issue/${codificarParaUrl(p.ticket)}/comment`, JSON.stringify({ body: textoParaAdf(`${mascarar(p.texto)}\n\n${marcadorNoComentario(k)}`) })));
    return { id: r.id, chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket) };
  },
  reconciliar: (ctx, _rec, p, k) => acharComentarioDoPrumo(ctx, p.ticket, k),
  async confirmar(ctx, _rec, p, _r, k) { return (await acharComentarioDoPrumo(ctx, p.ticket, k)) !== null; }
};

export const criarTicket: DefOperacao<z.infer<typeof criar>> = {
  id: 'jira.criar_ticket', servico: 'jira', rotulo: 'Criar ticket no Jira', efeito: 'Cria um ticket (bug, melhoria ou tarefa) no projeto Jira vinculado e, se informado, o relaciona ao ticket de origem.', exigeConfirmacao: true, schema: criar,
  resumo: p => `Criar ticket "${p.resumo}" (tipo ${p.tipoId})${p.origem ? ` relacionado a ${p.origem}` : ''}`,
  async executar(ctx, rec, p, k) {
    const tipos = await tiposDeCriacao(ctx, rec); const t = tipos.find(x => x.id === p.tipoId);
    if (!t) throw new ErroServico('SERVICE_SCOPE_CHANGED'); if (t.subtarefa) throw new ErroServico('SERVICE_WRITE_BLOCKED');
    if (p.origem) await projetoDoTicket(ctx, rec, p.origem);
    const fields = { project: { id: rec.id }, issuetype: { id: p.tipoId }, summary: mascarar(p.resumo), description: textoParaAdf(mascarar(p.descricao)), labels: [...new Set([...p.rotulos, marcadorDaOperacao(k)])] };
    const nova = z.object({ id: z.string(), key: z.string() }).passthrough().parse(await ctx.enviar('POST', '/rest/api/3/issue', JSON.stringify({ fields })));
    const r: Remoto = { id: nova.id, chave: nova.key, url: enderecoDoTicket(ctx, nova.key), detalhes: { tipo: t.nome } };
    if (p.origem) { try { await ctx.enviar('POST', '/rest/api/3/issueLink', JSON.stringify({ type: { name: p.tipoVinculo }, inwardIssue: { key: nova.key }, outwardIssue: { key: p.origem } })); r.detalhes!.vinculo = p.origem; } catch (e) { r.detalhes!.vinculo = 'FALHOU:' + ((e as ErroServico).codigo ?? 'ERRO'); } }
    return r;
  },
  reconciliar: (ctx, rec, _p, k) => acharTicketCriadoPeloPrumo(ctx, rec, marcadorDaOperacao(k)),
  async confirmar(ctx, rec, _p, r) { await projetoDoTicket(ctx, rec, r.chave!); return true; }
};

export const editarTicket: DefOperacao<z.infer<typeof editar>> = {
  id: 'jira.editar', servico: 'jira', rotulo: 'Atualizar campos de ticket do Jira', efeito: 'Altera resumo, descrição ou adiciona rótulos de um ticket do projeto vinculado. Não remove nada.', exigeConfirmacao: true, schema: editar,
  resumo: p => `Atualizar ${p.ticket}: ${[p.resumo !== undefined && 'resumo', p.descricao !== undefined && 'descrição', p.adicionarRotulos?.length && 'rótulos'].filter(Boolean).join(', ')}`,
  async executar(ctx, rec, p) {
    await projetoDoTicket(ctx, rec, p.ticket); const corpo: Record<string, unknown> = {};
    const fields: Record<string, unknown> = {}; if (p.resumo !== undefined) fields.summary = mascarar(p.resumo); if (p.descricao !== undefined) fields.description = textoParaAdf(mascarar(p.descricao)); if (Object.keys(fields).length) corpo.fields = fields;
    if (p.adicionarRotulos?.length) corpo.update = { labels: p.adicionarRotulos.map(add => ({ add })) };
    await ctx.enviar('PUT', `/rest/api/3/issue/${codificarParaUrl(p.ticket)}`, JSON.stringify(corpo)); return { chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket) };
  },
  async confirmar(ctx, rec, p) {
    const r = z.object({ fields: z.object({
      summary: z.string().optional(), description: z.unknown().optional(), labels: z.array(z.string()).optional()
    }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(p.ticket)}?fields=summary,description,labels`));
    if (p.resumo !== undefined && r.fields.summary !== mascarar(p.resumo)) return false;
    if (p.descricao !== undefined && JSON.stringify(r.fields.description) !== JSON.stringify(textoParaAdf(mascarar(p.descricao)))) return false;
    if (p.adicionarRotulos?.some(rotulo => !r.fields.labels?.includes(rotulo))) return false;
    return true;
  }
};

export const enderecoDoTicket = (ctx: ContextoServico, k: string) => `${ctx.instancia}/browse/${k}`;

/** Converte texto simples no formato de documento do Jira (ADF), só com parágrafos, sem HTML. */

/** Converte texto simples em documento ADF para o Jira. */
/** Texto simples -> documento Atlassian (ADF) só com parágrafos. O Prumo nunca envia HTML nem marcação executável ao Jira. */
export function textoParaAdf(texto: string): { type: 'doc'; version: 1; content: unknown[] } {
  const linhas = texto.replace(/\r\n?/g, '\n').split('\n').slice(0, 400);
  return { type: 'doc', version: 1, content: linhas.map(l => (l ? { type: 'paragraph', content: [{ type: 'text', text: l.slice(0, 2000) }] } : { type: 'paragraph' })) };
}

/** Confirma que o ticket pertence ao projeto Jira vinculado (nunca escreve em ticket de outro projeto). */
export async function projetoDoTicket(ctx: ContextoServico, rec: Recurso, t: string) {
  const r = z.object({ fields: z.object({ project: z.object({ id: z.union([z.string(), z.number()]).transform(String) }).passthrough(), status: z.object({ name: z.string() }).passthrough().optional() }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(t)}?fields=project,status`));
  if (r.fields.project.id !== rec.id) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  return { status: r.fields.status?.name ?? null };
}

/** JQL do projeto vinculado com filtros validados. O projeto é sempre fixado pelo ID numérico do vínculo. */
export function jqlDeTickets(projetoId: string, f: Filtros = {}): string {
  if (!/^\d{1,20}$/.test(projetoId)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  const c = [`project = ${projetoId}`];
  if (f.q) c.push(/^[A-Z][A-Z0-9_]*-\d+$/.test(f.q) ? `key = ${f.q}` : `text ~ ${textoEntreAspasJql(f.q)}`);
  if (f.tipo) c.push(`issuetype = ${textoEntreAspasJql(f.tipo)}`); if (f.status) c.push(`status = ${textoEntreAspasJql(f.status)}`);
  // Situação vale para qualquer fluxo do Jira: categoria do status pelo ID fixo (2 a fazer, 4 em andamento, 3 concluído), que não muda com o idioma.
  if (f.situacao) c.push(`statusCategory = ${{ aberto: 2, andamento: 4, concluido: 3 }[f.situacao]}`);
  if (f.desde) c.push(`updated >= ${textoEntreAspasJql(f.desde)}`); if (f.ate) c.push(`updated <= ${textoEntreAspasJql(f.ate + ' 23:59')}`); if (f.pai) c.push(`parent = ${f.pai}`);
  return c.join(' AND ') + ' ORDER BY updated DESC';
}

/** Lê um arquivo para anexar: só dentro das pastas de evidência do projeto ou de um caminho que a pessoa escolheu no diálogo nativo. */
export function lerAnexo(caminho: string, aux: Auxiliar, limite = 10 * 1024 * 1024) {
  const real = fs.realpathSync(path.resolve(caminho)); const dentro = aux.raizesDeEvidencia.some(r => { try { const rr = fs.realpathSync(r); return real === rr || real.startsWith(rr + path.sep); } catch { return false; } });
  const escolhido = aux.arquivosAutorizados.some(a => { try { return fs.realpathSync(a) === real; } catch { return false; } });
  if (!dentro && !escolhido) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  const st = fs.lstatSync(real); if (!st.isFile() || st.nlink !== 1 || st.size === 0 || st.size > limite) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  const ext = path.extname(real).toLowerCase(); const tipo = tipos[ext]; if (!tipo || /\.(env|pem|key|pfx|p12)$/i.test(real)) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  let dados = fs.readFileSync(real); if (['.txt', '.log', '.json', '.html'].includes(ext)) dados = Buffer.from(mascarar(dados.toString('utf8')), 'utf8');
  return { nome: path.basename(real), tipo, dados, tamanho: dados.length };
}

export async function camposDoTipo(ctx: ContextoServico, rec: Recurso, tipoId: string) {
  const r = (await ctx.ler(`/rest/api/3/issue/createmeta/${codificarParaUrl(rec.chave)}/issuetypes/${codificarParaUrl(tipoId)}?maxResults=100`)) as { fields?: unknown[]; values?: unknown[] };
  return z.array(z.object({ fieldId: z.string().optional(), key: z.string().optional(), name: z.string(), required: z.boolean().optional() }).passthrough()).parse(r.fields ?? r.values ?? []).map(c => ({ id: c.fieldId ?? c.key ?? '', nome: c.name, obrigatorio: c.required === true }));
}

export async function tiposDeCriacao(ctx: ContextoServico, rec: Recurso) {
  const r = (await ctx.ler(`/rest/api/3/issue/createmeta/${codificarParaUrl(rec.chave)}/issuetypes?maxResults=50`)) as { issueTypes?: unknown[]; values?: unknown[] };
  const lista = z.array(z.object({ id: z.union([z.string(), z.number()]).transform(String), name: z.string(), subtask: z.boolean().optional() }).passthrough()).parse(r.issueTypes ?? r.values ?? []);
  return lista.map(t => ({ id: t.id, nome: t.name, subtarefa: t.subtask === true }));
}

export const transicionarTicket: DefOperacao<z.infer<typeof transicionar>> = {
  id: 'jira.transicionar', servico: 'jira', rotulo: 'Mudar o status de ticket do Jira', efeito: 'Executa uma transição de workflow disponível para o ticket. Aprovação de QA e mudança de status são decisões diferentes; isto só ocorre por ação explícita.', exigeConfirmacao: true, schema: transicionar,
  resumo: p => `Mudar status de ${p.ticket} (transição ${p.transicaoId})`,
  async executar(ctx, rec, p) {
    const lista = await transicoesDoTicket(ctx, rec, p.ticket); const t = lista.find(x => x.id === p.transicaoId); if (!t) throw new ErroServico('SERVICE_SCOPE_CHANGED');
    await ctx.enviar('POST', `/rest/api/3/issue/${codificarParaUrl(p.ticket)}/transitions`, JSON.stringify({ transition: { id: p.transicaoId } }));
    return { chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket), detalhes: { transicao: t.nome, para: t.para } };
  },
  async confirmar(ctx, rec, p, r) { const s = await projetoDoTicket(ctx, rec, p.ticket); return r.detalhes?.para == null || s.status === r.detalhes.para; }
};

export async function transicoesDoTicket(ctx: ContextoServico, rec: Recurso, t: string) {
  await projetoDoTicket(ctx, rec, t);
  const r = z.object({ transitions: z.array(z.object({ id: z.string(), name: z.string(), to: z.object({ name: z.string() }).passthrough().optional() }).passthrough()) }).parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(t)}/transitions`));
  return r.transitions.map(x => ({ id: x.id, nome: x.name, para: x.to?.name ?? null }));
}

export const vincularTickets: DefOperacao<z.infer<typeof vincular>> = {
  id: 'jira.vincular', servico: 'jira', rotulo: 'Vincular tickets do Jira', efeito: 'Cria um vínculo entre dois tickets do projeto vinculado (por exemplo, defeito e história).', exigeConfirmacao: true, schema: vincular,
  resumo: p => `Vincular ${p.ticket} a ${p.comTicket} (${p.tipoVinculo})`,
  async executar(ctx, rec, p) {
    await projetoDoTicket(ctx, rec, p.ticket); await projetoDoTicket(ctx, rec, p.comTicket);
    await ctx.enviar('POST', '/rest/api/3/issueLink', JSON.stringify({ type: { name: p.tipoVinculo }, inwardIssue: { key: p.ticket }, outwardIssue: { key: p.comTicket } })); return { chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket) };
  },
  async reconciliar(ctx, _rec, p) {
    const r = z.object({ fields: z.object({ issuelinks: z.array(z.object({ inwardIssue: z.object({ key: z.string() }).passthrough().optional(), outwardIssue: z.object({ key: z.string() }).passthrough().optional() }).passthrough()).default([]) }).passthrough() }).passthrough().parse(await ctx.ler(`/rest/api/3/issue/${codificarParaUrl(p.ticket)}?fields=issuelinks`));
    return r.fields.issuelinks.some(l => l.inwardIssue?.key === p.comTicket || l.outwardIssue?.key === p.comTicket) ? { chave: p.ticket, url: enderecoDoTicket(ctx, p.ticket) } : null;
  }
};

/** Conjunto das operações de escrita Jira disponibilizadas pelo adaptador. */
export const operacoesJira = [criarTicket, comentarTicket, anexarArquivo, editarTicket, transicionarTicket, vincularTickets] as unknown as DefOperacao<unknown>[];
