/** Cliente HTTP do serviço central do Prumo, usado no login e no suporte. */
export const ENDERECO_DO_SERVICO = 'https://prumo-qa-servico.onrender.com';

/** Fora de HTTPS, permite apenas o loopback explícito usado em testes. */
export function urlDoServico(caminho: string, codigoDeFalha: string): URL {
  let endereco: URL;
  try {
    endereco = new URL(process.env.PRUMO_SERVICO || ENDERECO_DO_SERVICO);
  } catch {
    throw new Error(codigoDeFalha + ': endereço do serviço do Prumo inválido.');
  }

  const seguro = endereco.protocol === 'https:';
  const testeLocal = endereco.protocol === 'http:' && endereco.hostname === '127.0.0.1';
  if (!seguro && !testeLocal) {
    throw new Error(codigoDeFalha + ': endereço do serviço do Prumo recusado.');
  }

  // O caminho é definido pelo backend, nunca recebido diretamente da janela.
  return new URL(caminho, endereco);
}

type RequisicaoDoServico = {
  metodo: 'GET' | 'POST' | 'PUT' | 'PATCH';
  cabecalhos?: Record<string, string>;
  corpo?: string | Uint8Array;
  segundos?: number;
};

/** Aguarda a inicialização do Render sem seguir redirecionamentos nem expor detalhes de rede. */
export async function chamarServico(
  caminho: string,
  op: RequisicaoDoServico,
  codigoDeFalha: string
): Promise<Response> {
  const destino = urlDoServico(caminho, codigoDeFalha);
  const corpo = typeof op.corpo === 'string' || op.corpo === undefined
    ? op.corpo
    : new Blob([new Uint8Array(op.corpo)]);

  try {
    return await fetch(destino, {
      method: op.metodo,
      headers: { 'User-Agent': 'Prumo-QA', ...(op.cabecalhos ?? {}) },
      body: corpo,
      redirect: 'error',
      signal: AbortSignal.timeout((op.segundos ?? 75) * 1000)
    });
  } catch {
    throw new Error(
      codigoDeFalha + ': não foi possível falar com o serviço do Prumo; confira a internet e tente de novo.'
    );
  }
}
