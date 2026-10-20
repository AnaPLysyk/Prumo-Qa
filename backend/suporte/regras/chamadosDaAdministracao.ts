/** Administração › Chamados: lê todos os chamados e anexos, responde e muda o estado, com a chave de administração guardada no cofre. */
// Administração › Chamados: lê todos os chamados, os anexos, responde e muda o estado, pelo serviço do Prumo e com a chave de administração do suporte. A chave fica só no cofre do sistema deste computador e nunca volta para a janela.
import { cofreCredenciais } from '../../conexoes/banco/cofreCredenciais.js';
import { servicoDeChamados } from '../integracoes.js';
import { estadoDoChamadoSchema } from '../contratos.js';
import type { Protetor } from '../../conexoes/tipos/credenciais.js';

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
