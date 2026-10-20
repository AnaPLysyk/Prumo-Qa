/** Chamados e anexos enviados pela pessoa — arquivos relacionados agrupados para manutenção. */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { AnexoEscolhido, TipoDeAnexo, quantosAnexos, tiposDeAnexo, solicitacaoSchema } from "../contratos.js";
import os from "node:os";
import { prepararRelato, resumoDoDiagnosticoParaRelato } from "../servicoRelato.js";
import { lerMeusChamados, gravarMeusChamados } from "../banco/suporte.js";
import { servicoDeChamados } from "../integracoes.js";
import { Protetor } from "../../conexoes/tipos/transporte.js";
import { Usuario } from "../../login/tipos/contas.js";

// ── anexosDoChamado ──
type Guardado = AnexoEscolhido & { caminho: string; usuarioId: string; em: number };

const escolhidos = new Map<string, Guardado>();

const VALIDADE = 3 * 3_600_000;

/** Tipo pelo conteúdo: os primeiros bytes de PNG, JPEG, WebP, MP4 e WebM. */
export function tipoPelaAssinatura(b: Buffer): TipoDeAnexo | null {
  const comeca = (...x: number[]) => x.every((v, i) => b[i] === v);
  if (comeca(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  if (comeca(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  if (b.length > 12 && b.toString('latin1', 4, 8) === 'ftyp') return 'video/mp4';
  if (comeca(0x1a, 0x45, 0xdf, 0xa3)) return 'video/webm';
  return null;
}

/** Lê o arquivo inteiro e confere: arquivo comum (sem atalho), tamanho, assinatura e extensão coerente com o conteúdo. */
function lerAnexoDoChamado(caminho: string): { nome: string; tipo: TipoDeAnexo; bytes: Buffer } {
  const nome = path.basename(caminho);
  let st: fs.Stats; try { st = fs.lstatSync(caminho); } catch { throw new Error('ATTACHMENT_INVALID: ' + nome + ' não foi encontrado.'); }
  if (!st.isFile()) throw new Error('ATTACHMENT_INVALID: ' + nome + ' não é um arquivo comum.');
  if (st.size < 1 || st.size > 25 * 1024 * 1024) throw new Error('ATTACHMENT_TOO_LARGE: ' + nome + ' passa do tamanho máximo.');
  const bytes = fs.readFileSync(caminho); const tipo = tipoPelaAssinatura(bytes);
  if (!tipo) throw new Error('ATTACHMENT_INVALID: ' + nome + ' não é PNG, JPEG, WebP, MP4 nem WebM.');
  const regra = tiposDeAnexo[tipo]; const extensao = path.extname(nome).slice(1).toLowerCase();
  if (!(regra.extensoes as readonly string[]).includes(extensao)) throw new Error('ATTACHMENT_INVALID: a extensão de ' + nome + ' não combina com o conteúdo.');
  if (bytes.length > regra.maximo) throw new Error('ATTACHMENT_TOO_LARGE: ' + nome + ' passa de ' + regra.maximo / (1024 * 1024) + ' MB.');
  return { nome, tipo, bytes };
}

/** Guarda os arquivos escolhidos para a pessoa da sessão; recusados voltam com o motivo, sem caminho. */
export function guardarAnexos(caminhos: string[], usuarioId: string, agora = Date.now()) {
  for (const [id, g] of escolhidos) if (agora - g.em > VALIDADE) escolhidos.delete(id);
  const aceitos: AnexoEscolhido[] = []; const recusados: { nome: string; motivo: string }[] = [];
  for (const caminho of caminhos.slice(0, 8)) {
    try { const a = lerAnexoDoChamado(caminho); const id = randomUUID(); const item = { id, nome: a.nome, tipo: a.tipo, tamanho: a.bytes.length };
      escolhidos.set(id, { ...item, caminho, usuarioId, em: agora }); aceitos.push(item); }
    catch (e) { recusados.push({ nome: path.basename(caminho), motivo: String((e as Error).message).replace(/^[A-Z_]+: /, '') }); }
  }
  return { aceitos, recusados };
}

/** Anexos de um envio: só ids desta pessoa, dentro da quantidade permitida, relidos do disco na hora (arquivo trocado depois é conferido de novo). */
export function anexosDoEnvio(ids: string[], usuarioId: string) {
  const contagem = { imagem: 0, video: 0 };
  return [...new Set(ids)].map((id) => {
    const g = escolhidos.get(id); if (!g || g.usuarioId !== usuarioId) throw new Error('ATTACHMENT_INVALID: um anexo não foi encontrado; escolha os arquivos de novo.');
    const a = lerAnexoDoChamado(g.caminho); const regra = tiposDeAnexo[a.tipo];
    if (++contagem[regra.tipo] > quantosAnexos[regra.tipo]) throw new Error('ATTACHMENT_LIMIT: no máximo ' + quantosAnexos.imagem + ' imagens e ' + quantosAnexos.video + ' vídeo por chamado.');
    return { id, ...a };
  });
}

export function esquecerAnexos(ids: string[]): void { for (const id of ids) escolhidos.delete(id); }

// ── chamadosDaPessoa ──
type Dependencias = { usuario: Pick<Usuario, 'id' | 'nome' | 'email'>; protetor: Protetor; versao: string; base?: string; servico?: typeof servicoDeChamados; agora?: () => Date };

export async function enviarChamado(a: { relato: unknown; anexos: string[] }, d: Dependencias) {
  const s = solicitacaoSchema.parse(a.relato); const diagnostico = s.incluirDiagnostico ? resumoDoDiagnosticoParaRelato() : undefined;
  const versao = d.versao; const revisado = prepararRelato(s, { versao, diagnostico });
  if (!revisado.ok) throw new Error('SUPPORT_BLOCKED_SECRET: o relato contém algo que parece segredo ou está incompleto; revise antes de enviar.');
  const anexos = anexosDoEnvio(a.anexos, d.usuario.id); const servico = d.servico ?? servicoDeChamados;
  const { numero, chave } = await servico.abrir({
    categoria: s.categoria, titulo: s.titulo, descricao: s.descricao, ...(s.passos ? { passos: s.passos } : {}), ...(s.esperado ? { esperado: s.esperado } : {}),
    ...(s.incluirVersao ? { versao } : {}), ...(s.incluirSistema ? { sistema: `${os.platform()} ${os.release()} (${os.arch()})` } : {}), ...(diagnostico ? { diagnostico } : {}),
    contato: { nome: d.usuario.nome, ...(d.usuario.email ? { email: d.usuario.email } : {}) }, anexos: anexos.map((x) => ({ nome: x.nome, tipo: x.tipo, tamanho: x.bytes.length }))
  });
  // Os anexos vão um por vez, depois do chamado; falha num anexo não desfaz o chamado e aparece para a pessoa.
  const comFalha: string[] = [];
  for (const [i, x] of anexos.entries()) { try { await servico.anexar(numero, i, chave, x.tipo, x.bytes); } catch { comFalha.push(x.nome); } }
  esquecerAnexos(anexos.map((x) => x.id));
  const r = lerMeusChamados(d.base); const guardavel = d.protetor.disponivel();
  r.chamados.push({ usuarioId: d.usuario.id, numero, titulo: s.titulo, categoria: s.categoria, criadoEm: (d.agora?.() ?? new Date()).toISOString(), chave: guardavel ? d.protetor.proteger(chave).toString('base64') : null });
  gravarMeusChamados(r, d.base);
  return { numero, anexosEnviados: anexos.length - comFalha.length, anexosComFalha: comFalha, acompanhamento: guardavel };
}

const chaveDe = (c: { chave: string | null }, protetor: Protetor) => { if (!c.chave || !protetor.disponivel()) return null; try { return protetor.abrir(Buffer.from(c.chave, 'base64')); } catch { return null; } };

/** Os chamados desta pessoa (mais novos primeiro), com o estado atual consultado no serviço; sem resposta do serviço, estado null. */
export async function meusChamados(d: Omit<Dependencias, 'agora' | 'versao'>) {
  const servico = d.servico ?? servicoDeChamados;
  const meus = lerMeusChamados(d.base).chamados.filter((c) => c.usuarioId === d.usuario.id).sort((x, y) => y.criadoEm.localeCompare(x.criadoEm)).slice(0, 30);
  return Promise.all(meus.map(async (c) => {
    const chave = chaveDe(c, d.protetor); let atual: Awaited<ReturnType<typeof servico.acompanhar>> | null = null;
    if (chave) { try { atual = await servico.acompanhar(c.numero, chave); } catch { atual = null; } }
    return { numero: c.numero, titulo: c.titulo, categoria: c.categoria, criadoEm: c.criadoEm, estado: atual?.estado ?? null, atualizadoEm: atual?.atualizadoEm ?? null, respostas: atual?.respostas.length ?? 0, acompanhamento: !!chave };
  }));
}

/** Um chamado desta pessoa com as respostas da equipe. Número de outra pessoa responde como inexistente. */
export async function meuChamado(numero: number, d: Omit<Dependencias, 'agora' | 'versao'>) {
  const c = lerMeusChamados(d.base).chamados.find((x) => x.numero === numero && x.usuarioId === d.usuario.id);
  if (!c) throw new Error('TICKET_NOT_FOUND: chamado não encontrado.');
  const chave = chaveDe(c, d.protetor); if (!chave) throw new Error('SUPPORT_TRACKING_UNAVAILABLE: a chave de acompanhamento deste chamado não está disponível neste computador.');
  return (d.servico ?? servicoDeChamados).acompanhar(numero, chave);
}
