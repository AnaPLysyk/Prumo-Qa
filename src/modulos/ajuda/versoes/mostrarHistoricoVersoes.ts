/** Apresenta o histórico marcando qual versão está instalada neste computador. */
import type { Versao } from './definirFormatoVersao.js';

/** Estado exibido: a versão em execução é "instalada"; as demais mantêm o estado da fonte. */
export const apresentarVersoes = (versoes: Versao[], instalada: string) =>
  versoes.map(v => ({ ...v, state: v.version === instalada ? 'instalada' as const : v.status }));

