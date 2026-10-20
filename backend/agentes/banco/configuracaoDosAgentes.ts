/** Lê e grava as configurações de agentes por projeto (agentes.json). */
import { Registro, registro } from '../tipos/politicas.js';
import { lerLocal, gravarLocal } from '../../compartilhado/banco/persistenciaLocal.js';

export const lerConfiguracaoDosAgentes = (b?: string) => lerLocal<Registro>('agentes.json', registro, { version: 1, itens: [] }, b);

/** Persistência das políticas validada pelo contrato do arquivo. */
export const gravarConfiguracaoDosAgentes = (dados: Registro, base?: string) =>
  gravarLocal("agentes.json", registro.parse(dados), base);
