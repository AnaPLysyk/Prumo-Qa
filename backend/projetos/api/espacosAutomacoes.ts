/** Canal espacos:automacoes: Mostra a pasta de código do projeto, os frameworks detectados, os comandos declarados e se o k6 está instalado. */
import { localizarK6 } from '../../agendamentos/k6/localizarK6.js';
import { contextoCompleto } from '../../agentes/mcp/contextoCompleto.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { obterEspaco } from '../banco/obterEspaco.js';

export const espacosAutomacoes: TratadorDoCanal<'espacos:automacoes'> = async a=>{const e=obterEspaco(a.id);const k6=(await localizarK6())!==null;if(!e.pastaLocal)return {pastaLocal:null,estado:'SEM_PASTA',frameworks:[],capacidades:[],k6Disponivel:k6};const p=await carregarProjeto(e.pastaLocal);const c=await contextoCompleto(p);return {pastaLocal:p.raiz,estado:'INTEGRADO',frameworks:c.frameworks,capacidades:Object.keys(p.manifesto.commands),readOnly:p.manifesto.execution.readOnly,k6Disponivel:k6};};
