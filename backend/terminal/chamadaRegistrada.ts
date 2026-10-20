/** Executa uma ação do terminal e registra a operação no diário de atividades. */
import { Projeto } from '../compartilhado/projeto/contratos.js';
import { observar } from '../logs/regras/observar.js';

/** Erros ao registrar o diário não descartam a resposta da operação. */
const avisarFalhaDeRegistroNoTerminal = (fase: string, id: string): void => {
  console.error(
    `PRUMO_OBSERVABILITY_ERROR phase=${fase} operationId=${id}; resultado do núcleo preservado. Confira diretório de dados, permissões e limites.`
  );
  if (!process.exitCode) process.exitCode = 3;
};

export const chamadaRegistrada = <T>(
  projeto: Projeto,
  ferramenta: string,
  entrada: unknown,
  executar: () => Promise<T>
) => observar(projeto, ferramenta, { origin: 'CLI' }, entrada, executar, {
  diagnostico: avisarFalhaDeRegistroNoTerminal
});
