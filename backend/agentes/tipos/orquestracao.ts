/** Formato da orquestração observável: quais agentes participaram, em que ordem, quanto tempo cada etapa levou e o que consultou. */

/** Uma etapa: um agente respondendo com os dados locais. SEM_DADOS = rodou e não achou nada; FALHOU = a consulta deu erro. */
export type EstadoEtapa = 'CONCLUIDA' | 'SEM_DADOS' | 'FALHOU';

export type EtapaDaOrquestracao = { ordem: number; agente: string; inicio: string; fim: string; duracaoMs: number; estado: EstadoEtapa; fontes: string[]; fatos: string[]; linhas: number; erro?: string };

/**
 * Registro de uma orquestração (sem a pergunta e sem a resposta, como os atendimentos): o orquestrador escolhe as
 * especializações pela pontuação do roteamento, delega uma etapa a cada uma, em ordem, e junta os resultados.
 * As etapas são independentes (nenhuma usa o resultado de outra); isso fica explícito em `dependencias`.
 */
export type Orquestracao = {
  id: string; em: string; espacoId: string | null; responsavel: 'orquestrador'; modo: 'LOCAL';
  motivo: { agente: string; pontos: number }[]; agentes: string[]; dependencias: 'INDEPENDENTES';
  etapas: EtapaDaOrquestracao[]; estado: 'CONCLUIDA' | 'PARCIAL' | 'FALHOU'; duracaoMs: number;
};

/** No máximo 3 especialistas por pergunta, cada um com pelo menos 3 pontos no roteamento (sinal forte da especialidade); 500 registros guardados. */
export const limitesOrquestracao = { agentes: 3, pontosMinimos: 3, registros: 500, porConsulta: 50 } as const;
