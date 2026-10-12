/** Canal agenda:salvar: Criar ou editar uma rotina (único, intervalo, diário ou semanal, com fuso). */
import { criarRotina } from '../regras/criarRotina.js';
import { editarRotina } from '../regras/editarRotina.js';
import { validarRotina } from '../regras/validarRotina.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const agendaSalvar: TratadorDoCanal<'agenda:salvar'> = async a => { await validarRotina(a.dados); return a.id ? editarRotina(a.id, a.dados) : criarRotina(a.dados); };
