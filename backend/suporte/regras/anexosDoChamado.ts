/** Anexos do chamado (imagem e vídeo): escolhidos no diálogo do sistema, conferidos pela assinatura do arquivo e pelos limites do serviço. */
// Anexos do chamado (imagem e vídeo). A pessoa escolhe os arquivos no diálogo do sistema; o caminho fica só no processo principal e a janela recebe um id. O tipo vem da assinatura do arquivo (extensão trocada não passa), e tamanho e quantidade seguem os limites do serviço.
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { AnexoEscolhido, TipoDeAnexo, quantosAnexos, tiposDeAnexo } from '../tipos/chamados.js';

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
export function lerAnexoDoChamado(caminho: string): { nome: string; tipo: TipoDeAnexo; bytes: Buffer } {
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
