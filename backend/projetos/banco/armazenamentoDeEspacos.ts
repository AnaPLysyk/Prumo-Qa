/** Reúne armazenamento de espacos da funcionalidade, mantendo cada operação identificável pelo nome. */
import { lerLocal } from "../../compartilhado/banco/lerLocal.js";
import { registro } from "../tipos/espacos.js";
import { z } from "zod";
import { gravarLocal } from "../../compartilhado/banco/gravarLocal.js";

export const lerEspacos=(base?:string)=>lerLocal('espacos.json',registro,{version:1,espacos:[]},base);

export const gravarEspacos=(r:z.infer<typeof registro>,base?:string)=>gravarLocal('espacos.json',registro.parse(r),base);

export const listarEspacos=(base?:string)=>lerEspacos(base).espacos;
