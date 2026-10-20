/** chamadosDaPessoa: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { lerLocal, gravarLocal } from "../../compartilhado/banco/persistenciaLocal.js";
import { meusChamadosSchema, AnexoEscolhido, TipoDeAnexo, quantosAnexos, tiposDeAnexo, solicitacaoSchema, estadoDoChamadoSchema } from "../contratos.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { prepararRelato, resumoDoDiagnosticoParaRelato, servicoDeChamados } from "../servicoRelato.js";
import { Protetor } from "../../conexoes/tipos/adaptador.js";
import { Usuario } from "../../login/tipos/contas.js";
import { cofreCredenciais } from "../../conexoes/banco/credenciais.js";

// --- suporte ---
type Registro = z.infer<typeof meusChamadosSchema>;

const ARQUIVO = 'chamados-de-suporte.json';

export const lerMeusChamados = (b?: string): Registro => lerLocal<Registro>(ARQUIVO, meusChamadosSchema, { version: 1, chamados: [] }, b);

export function gravarMeusChamados(r: Registro, b?: string): void { gravarLocal(ARQUIVO, meusChamadosSchema.parse(r), b); }

// --- chamadosDaPessoa ---
// --- chamadosDaPessoa ---
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

// --- chamadosDaAdministracao ---
/** Id fixo da chave de administração no cofre (o cofre exige um UUID). */
const ID_DA_CHAVE = '3f8a1c2e-9b4d-4e6f-8a17-5c2d9e0b7a41';

export function lerChaveDeAdministracao(protetor: Protetor, base?: string): string | null {
  try { const c = cofreCredenciais(protetor, base).ler(ID_DA_CHAVE); return c && c.length >= 32 ? c : null; } catch { return null; }
}

/** Guarda (ou, vazia, apaga) a chave. Precisa ter pelo menos 32 caracteres, como o serviço exige. */
export function salvarChaveDeAdministracao(chave: string, protetor: Protetor, base?: string) {
  const c = chave.trim();
  if (!c) { try { cofreCredenciais(protetor, base).remover(ID_DA_CHAVE); } catch { /* já não existia */ } return { configurada: false }; }
  if (c.length < 32 || c.length > 200 || /\s/.test(c)) throw new Error('SUPPORT_ADMIN_KEY_INVALID: a chave de administração precisa ter de 32 a 200 caracteres, sem espaços.');
  if (!protetor.disponivel()) throw new Error('CREDENTIAL_PROTECTION_UNAVAILABLE');
  cofreCredenciais(protetor, base).salvar(ID_DA_CHAVE, c); return { configurada: true };
}

function comChave(protetor: Protetor, base?: string, servico = servicoDeChamados) {
  const chave = lerChaveDeAdministracao(protetor, base);
  if (!chave) throw new Error('SUPPORT_ADMIN_KEY_MISSING: informe a chave de administração do suporte nesta tela.');
  return servico.admin(chave);
}

type Dep = { protetor: Protetor; base?: string; servico?: typeof servicoDeChamados };

export const chamadosDaAdministracao = {
  listar: (estado: string | undefined, d: Dep) => comChave(d.protetor, d.base, d.servico).listar(estado ? estadoDoChamadoSchema.parse(estado) : undefined),
  detalhe: (numero: number, d: Dep) => comChave(d.protetor, d.base, d.servico).detalhe(numero),
  /** Imagem ou vídeo: volta como base64 com o tipo conferido pelo serviço, para a janela mostrar sem gravar arquivo. */
  anexo: async (numero: number, indice: number, d: Dep) => { const a = await comChave(d.protetor, d.base, d.servico).anexo(numero, indice); if (!/^(image\/(png|jpeg|webp)|video\/(mp4|webm))$/.test(a.tipo)) throw new Error('ATTACHMENT_INVALID: tipo de anexo inesperado.'); return { tipo: a.tipo, base64: a.bytes.toString('base64') }; },
  responder: (numero: number, texto: string, d: Dep) => comChave(d.protetor, d.base, d.servico).responder(numero, texto),
  mudarEstado: (numero: number, estado: string, d: Dep) => comChave(d.protetor, d.base, d.servico).mudarEstado(numero, estadoDoChamadoSchema.parse(estado))
};
