/** Edita o nome e a descrição do projeto e registra a edição. */
import {z} from 'zod';
import {dadosEspaco} from './definicoesEspaco.js';
import {atualizar, eventoEspaco} from './armazenarEspacos.js';

export function editarEspaco(id:string,dados:z.input<typeof dadosEspaco>,base?:string){const d=dadosEspaco.parse(dados);return atualizar(id,e=>{e.nome=d.nome;e.descricao=d.descricao;eventoEspaco(e,'EDITADO');},base);}
