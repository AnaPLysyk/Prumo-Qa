/** Grava a fila de trabalhos; quando passa de 1.500, apaga só os encerrados mais antigos, nunca os pendentes. */
import { LIMITE, Registro, registro } from '../tipos/fila.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';

export const gravarFila = (r: Registro, base?: string) => {
  // Poda apenas o histórico encerrado mais antigo; nunca descarta trabalho pendente ou em execução.
  if (r.trabalhos.length > LIMITE) {
    const ativos = r.trabalhos.filter(t => t.estado === 'PENDENTE' || t.estado === 'EXECUTANDO');
    const finais = r.trabalhos.filter(t => !(t.estado === 'PENDENTE' || t.estado === 'EXECUTANDO')).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)).slice(-(LIMITE - ativos.length));
    r.trabalhos = [...finais, ...ativos];
  }
  gravarLocal('fila.json', registro.parse(r), base);
};
