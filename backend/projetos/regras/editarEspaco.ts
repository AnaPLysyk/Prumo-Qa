/** Altera o nome e a descrição de um projeto do Prumo. */
import { z } from 'zod';
import { atualizarEspaco } from '../banco/atualizarEspaco.js';
import { eventoEspaco } from './eventoEspaco.js';
import { dadosEspaco } from '../tipos/espacos.js';

export function editarEspaco(id:string,dados:z.input<typeof dadosEspaco>,base?:string){const d=dadosEspaco.parse(dados);return atualizarEspaco(id,e=>{e.nome=d.nome;e.descricao=d.descricao;eventoEspaco(e,'EDITADO');},base);}
