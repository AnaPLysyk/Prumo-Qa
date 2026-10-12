/** Prepara a lista de versões para a Ajuda, marcando a instalada. */
import { Versao } from '../tipos/versao.js';

/** Estado exibido: a versão em execução é "instalada"; as demais mantêm o estado da fonte. */
export const apresentarVersoes = (versoes: Versao[], instalada: string) =>
  versoes.map(v => ({ ...v, state: v.version === instalada ? 'instalada' as const : v.status }));
