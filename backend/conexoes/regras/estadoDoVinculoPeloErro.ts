/** Traduz um erro do serviço no estado do vínculo: sem permissão, sem credencial, desatualizado ou indisponível. */
import { ErroServico } from '../integracoes/ErroServico.js';

export function estadoDoVinculoPeloErro(e: unknown) {
  if (!(e instanceof ErroServico)) return 'INDISPONIVEL' as const;
  if (e.codigo === 'SERVICE_PERMISSION') return 'SEM_PERMISSAO' as const;
  if (e.codigo === 'CREDENTIAL_INVALID_OR_EXPIRED' || e.codigo === 'CREDENTIAL_UNAVAILABLE') return 'SEM_CREDENCIAL' as const;
  if (e.codigo === 'SERVICE_NOT_FOUND' || e.codigo === 'SERVICE_SCOPE_CHANGED') return 'DESATUALIZADO' as const;
  return 'INDISPONIVEL' as const;
}
