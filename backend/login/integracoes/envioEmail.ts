/** Configuração do serviço de autenticação e solicitação de códigos por e-mail. */
import { chamarServico } from '../../compartilhado/servicoRemoto.js';

/** Valida o endereço HTTPS da autenticação central, sem fazer chamadas de rede. */
export function enderecoDeAutenticacao() {
  const origem = String(process.env.PRUMO_AUTH_API_URL || '');
  let endereco: URL;
  try {
    endereco = new URL(origem);
  } catch {
    return null;
  }

  if (
    endereco.protocol !== 'https:' ||
    endereco.pathname !== '/' ||
    endereco.search ||
    endereco.hash ||
    endereco.username ||
    endereco.password ||
    endereco.port
  ) return null;

  return endereco.origin;
}

export const usarAutenticacaoRemota = () => !!enderecoDeAutenticacao();

export type PedidoDeCodigo = {
  email: string;
  codigo: string;
  finalidade: 'CADASTRO' | 'SENHA' | 'ENTRADA';
  idioma: 'pt-BR' | 'en';
};

/** Envia o código sem registrar o segredo nos logs; preserva erros de limite e e-mail inválido. */
export async function enviarCodigoPorEmail(pedido: PedidoDeCodigo): Promise<void> {
  const resposta = await chamarServico('/v1/codigos', {
    metodo: 'POST',
    cabecalhos: { 'Content-Type': 'application/json' },
    corpo: JSON.stringify(pedido)
  }, 'EMAIL_SERVICE_UNAVAILABLE');

  if (resposta.status === 202) return;
  if (resposta.status === 429) {
    throw new Error('EMAIL_RATE_LIMIT: muitos códigos pedidos para este e-mail; espere alguns minutos.');
  }
  if (resposta.status === 400) {
    throw new Error('EMAIL_INVALID: o serviço de envio recusou este e-mail; confira o endereço.');
  }
  throw new Error('EMAIL_SEND_FAILED: o serviço de envio não conseguiu mandar o e-mail agora; tente de novo em instantes.');
}
