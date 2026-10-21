/** Formato do mapa de vínculos que os agentes usam para saber onde cada projeto do Prumo está ligado. */
import type { Servico } from "../../projetos/contratos.js";

/** ATIVO: pode consultar (e agir, se a escrita estiver habilitada). DESLIGADO: nada é consultado nem enviado. PRECISA_REVISAO: a última verificação falhou. */
export type VinculoDoProjeto = {
  servico: Servico;
  situacao: 'ATIVO' | 'DESLIGADO' | 'PRECISA_REVISAO';
  estado: string;
  chave: string;
  nome: string;
  endereco: string;
  escrita: boolean;
  leitura: string[];
  escritas: string[];
};

export type MapaDeVinculos = {
  projeto: { id: string; nome: string };
  manual: { ativo: boolean };
  pastaLocal: { vinculada: boolean; nome: string | null };
  vinculos: VinculoDoProjeto[];
  semVinculo: Servico[];
  /** Ligações que este projeto divide com outro (gravadas antes da regra de um só projeto): o agente deve avisar em vez de agir. */
  duplicidades: { onde: Servico | 'local'; projeto: string }[];
};
