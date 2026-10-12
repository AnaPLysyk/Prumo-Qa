/** Executa uma ação do terminal registrando-a no diário com origem CLI. */
import { Projeto } from '../compartilhado/tipos/projeto.js';
import { observar } from '../logs/regras/observar.js';
import { avisarFalhaDeRegistroNoTerminal } from './avisarFalhaDeRegistroNoTerminal.js';

export const chamadaRegistrada=<T>(p:Projeto,tool:string,entrada:unknown,fn:()=>Promise<T>)=>observar(p,tool,{origin:'CLI'},entrada,fn,{diagnostico: avisarFalhaDeRegistroNoTerminal});
