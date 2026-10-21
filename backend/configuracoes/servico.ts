/** Configurações: armazenamento e regras — arquivos relacionados agrupados para manutenção. */
import { z } from "zod";
import path from "node:path";
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { semLinks } from "../compartilhado/seguranca/semLinks.js";
import { Idioma } from "../aplicativo/tipos/textosDaBandeja.js";
import os from "node:os";

// ── contratos ──
const versaoTxt = z.string().regex(/^\d+\.\d+\.\d+$/);

// Configuração do assistente. A delegação a IA externa só muda por autorizarDelegacaoDeIa (confirmação nativa).
const nomeIa = z.string().trim().min(1).max(40).regex(/^[\p{L}\p{N} ._-]+$/u);

const iaSchema = z.object({ nome: nomeIa, estilo: z.enum(['amigavel', 'direto', 'tecnico']), voz: z.string().max(120).nullable(), lerRespostas: z.boolean(), delegacao: z.object({ claude: z.boolean(), codex: z.boolean(), copilot: z.boolean().default(false), gemini: z.boolean().default(false) }).strict() }).strict();

const iaPadrao = { nome: 'Prumo', estilo: 'amigavel' as const, voz: null, lerRespostas: false, delegacao: { claude: false, codex: false, copilot: false, gemini: false } };

export const preferenciasSchema = z.object({
  version: z.literal(1),
  verificarAoIniciar: z.boolean(), som: z.boolean(), silenciar: z.boolean(),
  // 2.8: arquivos antigos (sem estes campos) continuam válidos e recebem os padrões.
  tema: z.enum(['claro', 'escuro', 'sistema']).default('sistema'), idioma: z.enum(['pt-BR', 'en']).default('pt-BR'),
  iniciarComWindows: z.boolean().default(false), notificarAgenda: z.boolean().default(true),
  versaoVisualizada: versaoTxt.nullable(),  // última versão disponível que a pessoa já viu/reconheceu
  versaoNotificada: versaoTxt.nullable(),   // última versão para a qual o aviso (e o som) já foram emitidos
  disponivel: z.object({ versao: versaoTxt, notas: z.string().max(4000) }).strict().nullable(), // última release mais nova que a instalada (dado público do GitHub)
  ultimaConsulta: z.string().datetime().nullable(),
  // 2.10.1: arquivos antigos não têm o campo e recebem o padrão ligado (a 2.9 gravava verificarAoIniciar=false sem escolha da pessoa).
  avisoAutomatico: z.boolean().default(true),
  ia: iaSchema.default(iaPadrao)
}).strict();

export type Preferencias = z.infer<typeof preferenciasSchema>;

export const padrao: Preferencias = { version: 1, verificarAoIniciar: false, som: false, silenciar: false, tema: 'sistema', idioma: 'pt-BR', iniciarComWindows: false, notificarAgenda: true, versaoVisualizada: null, versaoNotificada: null, disponivel: null, ultimaConsulta: null, avisoAutomatico: true, ia: { ...iaPadrao, delegacao: { ...iaPadrao.delegacao } } };

/** Campos que a interface pode alterar diretamente. As versões só mudam por ações específicas abaixo. */
export const alteracaoSchema = z.object({ verificarAoIniciar: z.boolean().optional(), avisoAutomatico: z.boolean().optional(), som: z.boolean().optional(), silenciar: z.boolean().optional(), tema: z.enum(['claro', 'escuro', 'sistema']).optional(), idioma: z.enum(['pt-BR', 'en']).optional(), iniciarComWindows: z.boolean().optional(), notificarAgenda: z.boolean().optional(), ia: z.object({ nome: nomeIa.optional(), estilo: z.enum(['amigavel', 'direto', 'tecnico']).optional(), voz: z.string().max(120).nullable().optional(), lerRespostas: z.boolean().optional() }).strict().optional() }).strict();

// ── configuracoes ──
export const arquivoDePreferencias = (base?: string) => path.join(diretorioDados(base), 'preferencias.json');

export function gravarPreferencias(p: Preferencias, base?: string) {
  const alvo = arquivoDePreferencias(base); semLinks(alvo); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 });
  const tmp = `${alvo}.${randomUUID()}.tmp`; fs.writeFileSync(tmp, JSON.stringify(preferenciasSchema.parse(p), null, 2), { mode: 0o600 }); fs.renameSync(tmp, alvo); return p;
}

export function lerPreferencias(base?: string): Preferencias {
  try { semLinks(arquivoDePreferencias(base)); return preferenciasSchema.parse(JSON.parse(fs.readFileSync(arquivoDePreferencias(base), 'utf8'))); } catch { return { ...padrao }; }
}

// ── servico ──
export function alterarPreferencias(alteracao: unknown, base?: string) {
  const a = alteracaoSchema.parse(alteracao); const atual = lerPreferencias(base);
  return gravarPreferencias({ ...atual, ...a, ia: { ...atual.ia, ...(a.ia ?? {}), delegacao: atual.ia.delegacao } }, base);
}

export const idiomaAtual = (): Idioma => lerPreferencias().idioma;

type ItemDeLogin = { setLoginItemSettings: (o: { openAtLogin: boolean; args: string[] }) => void };

/** Texto do atalho de autostart (freedesktop). O caminho do executável vai entre aspas; a pessoa que liga é quem o usa. */
export function atalhoDeAutostart(executavel: string): string {
  const exec = '"' + executavel.replace(/(["`$\\])/g, '\\$1') + '" --oculto';
  return ['[Desktop Entry]', 'Type=Application', 'Name=Prumo QA', 'Comment=Qualidade de software do ticket à evidência', `Exec=${exec}`, 'Terminal=false', 'X-GNOME-Autostart-enabled=true', ''].join('\n');
}

export function iniciarComOSistema(ligado: boolean, app: ItemDeLogin, sistema: string = process.platform, opcoes: { pastaConfig?: string; executavel?: string } = {}): void {
  if (sistema !== 'linux') { app.setLoginItemSettings({ openAtLogin: ligado, args: ligado ? ['--oculto'] : [] }); return; }
  const pasta = path.join(opcoes.pastaConfig ?? (process.env.XDG_CONFIG_HOME && path.isAbsolute(process.env.XDG_CONFIG_HOME) ? process.env.XDG_CONFIG_HOME : path.join(os.homedir(), '.config')), 'autostart');
  const arquivo = path.join(pasta, 'prumo-qa.desktop');
  if (!ligado) { fs.rmSync(arquivo, { force: true }); return; }
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(arquivo, atalhoDeAutostart(opcoes.executavel ?? process.env.APPIMAGE ?? process.execPath), { mode: 0o644 });
}
