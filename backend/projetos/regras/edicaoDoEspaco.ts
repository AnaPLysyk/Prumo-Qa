/** Reúne edicao do espaco da funcionalidade, mantendo cada operação identificável pelo nome. */
import { z } from "zod";
import { atualizarEspaco } from "../banco/atualizarEspaco.js";
import { eventoEspaco } from "./eventoEspaco.js";
import { dadosEspaco } from "../tipos/espacos.js";

export function editarEspaco(id:string,dados:z.input<typeof dadosEspaco>,base?:string){const d=dadosEspaco.parse(dados);return atualizarEspaco(id,e=>{e.nome=d.nome;e.descricao=d.descricao;eventoEspaco(e,'EDITADO');},base);}

export function configurarAceite(id:string,campo:string,base?:string){return atualizarEspaco(id,e=>{const v=e.vinculos.find(v=>v.servico==='jira');if(!v)throw new Error('WORKSPACE_LINK_NOT_FOUND');v.campoAceite=z.string().regex(/^customfield_\d+$/).parse(campo);eventoEspaco(e,'EDITADO',{servico:'jira',vinculoId:v.id});},base);}
