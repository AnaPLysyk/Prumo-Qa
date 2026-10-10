import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { diretorioDados, semLinks } from './atividades.js';
import { analisarVersao, compararVersoes } from './versoes.js';

/**
 * Preferências locais de notificação (marco 2.5). Arquivo próprio em %LOCALAPPDATA%\PrumoQA\preferencias.json.
 * Tudo opcional e transparente: nada é consultado sem a pessoa ligar "verificar ao iniciar" ou clicar em verificar.
 * Desde a 2.8 o aplicativo pode ficar residente na bandeja (processo do próprio Prumo); continua sem serviço do Windows nem tarefa agendada do sistema.
 */
const versaoTxt = z.string().regex(/^\d+\.\d+\.\d+$/);
export const preferenciasSchema = z.object({
  version: z.literal(1),
  verificarAoIniciar: z.boolean(), som: z.boolean(), silenciar: z.boolean(),
  // 2.8: arquivos antigos (sem estes campos) continuam válidos e recebem os padrões.
  tema: z.enum(['claro', 'escuro', 'sistema']).default('sistema'), idioma: z.enum(['pt-BR', 'en']).default('pt-BR'),
  iniciarComWindows: z.boolean().default(false), notificarAgenda: z.boolean().default(true),
  versaoVisualizada: versaoTxt.nullable(),  // última versão disponível que a pessoa já viu/reconheceu
  versaoNotificada: versaoTxt.nullable(),   // última versão para a qual o aviso (e o som) já foram emitidos
  disponivel: z.object({ versao: versaoTxt, notas: z.string().max(4000) }).strict().nullable(), // última release mais nova que a instalada (dado público do GitHub)
  ultimaConsulta: z.string().datetime().nullable()
}).strict();
export type Preferencias = z.infer<typeof preferenciasSchema>;
export const padrao: Preferencias = { version: 1, verificarAoIniciar: false, som: false, silenciar: false, tema: 'sistema', idioma: 'pt-BR', iniciarComWindows: false, notificarAgenda: true, versaoVisualizada: null, versaoNotificada: null, disponivel: null, ultimaConsulta: null };
/** Campos que a interface pode alterar diretamente. As versões só mudam por ações específicas abaixo. */
export const alteracaoSchema = z.object({ verificarAoIniciar: z.boolean().optional(), som: z.boolean().optional(), silenciar: z.boolean().optional(), tema: z.enum(['claro', 'escuro', 'sistema']).optional(), idioma: z.enum(['pt-BR', 'en']).optional(), iniciarComWindows: z.boolean().optional(), notificarAgenda: z.boolean().optional() }).strict();

const arquivo = (base?: string) => path.join(diretorioDados(base), 'preferencias.json');
export function lerPreferencias(base?: string): Preferencias {
  try { semLinks(arquivo(base)); return preferenciasSchema.parse(JSON.parse(fs.readFileSync(arquivo(base), 'utf8'))); } catch { return { ...padrao }; }
}
function gravar(p: Preferencias, base?: string) {
  const alvo = arquivo(base); semLinks(alvo); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 });
  const tmp = `${alvo}.${randomUUID()}.tmp`; fs.writeFileSync(tmp, JSON.stringify(preferenciasSchema.parse(p), null, 2), { mode: 0o600 }); fs.renameSync(tmp, alvo); return p;
}
export const alterarPreferencias = (alteracao: unknown, base?: string) => gravar({ ...lerPreferencias(base), ...alteracaoSchema.parse(alteracao) }, base);
/** A pessoa viu a versão: o indicador some até existir uma versão mais nova. Nunca regride. */
export function marcarVisualizada(v: string, base?: string) {
  if (!analisarVersao(v)) throw new Error('INVALID_VERSION: versão inválida.');
  const p = lerPreferencias(base); if (p.versaoVisualizada && compararVersoes(v, p.versaoVisualizada) < 0) return p;
  return gravar({ ...p, versaoVisualizada: v }, base);
}
/** Indicador persistente (funciona offline): há release mais nova que a instalada, ainda não reconhecida pela pessoa. */
export function avisoPendente(instalada: string, base?: string) {
  const p = lerPreferencias(base); const d = p.disponivel;
  if (!d || compararVersoes(d.versao, instalada) <= 0) return { indicador: false as const };
  if (p.versaoVisualizada && compararVersoes(d.versao, p.versaoVisualizada) <= 0) return { indicador: false as const };
  return { indicador: true as const, versao: d.versao, notas: d.notas };
}
/**
 * Registra uma consulta concluída. `disponivel` é a release mais nova que a instalada (ou null se já está atualizado).
 * - indicador: há versão a reconhecer (ainda não vista);
 * - tocarSom: som ligado, não silenciado, e a versão ainda não notificada: no máximo UMA vez por versão.
 * A decisão é gravada (versaoNotificada) para não repetir o som em consultas seguintes nem ao reabrir.
 */
export function registrarConsulta(disponivel: { versao: string; notas: string } | null, base?: string) {
  const p = lerPreferencias(base); const agora = new Date().toISOString();
  if (!disponivel) { gravar({ ...p, disponivel: null, ultimaConsulta: agora }, base); return { indicador: false, tocarSom: false, versao: null as string | null, notas: '' }; }
  const vista = !!p.versaoVisualizada && compararVersoes(disponivel.versao, p.versaoVisualizada) <= 0;
  const jaNotificada = !!p.versaoNotificada && compararVersoes(disponivel.versao, p.versaoNotificada) <= 0;
  const indicador = !vista; const tocarSom = indicador && p.som && !p.silenciar && !jaNotificada;
  gravar({ ...p, disponivel: { versao: disponivel.versao, notas: disponivel.notas.slice(0, 4000) }, ultimaConsulta: agora, versaoNotificada: indicador && !jaNotificada ? disponivel.versao : p.versaoNotificada }, base);
  return { indicador, tocarSom, versao: disponivel.versao, notas: disponivel.notas };
}
