/** Comando "prumo conectar": mostra a proposta e, com a confirmação digitada, configura o Codex. */
import { Projeto } from '../compartilhado/projeto/contratos.js';
import { aplicarConexao } from '../conexoes/ia/conectarIa.js';
import { prepararConexao } from '../conexoes/ia/conectarIa.js';
import { imprimirJson } from './saidaDoTerminal.js';
import { perguntarNoTerminal } from './perguntarNoTerminal.js';
import { textoSeguroNoTerminal } from './saidaDoTerminal.js';

export async function comandoConectar(p:Projeto,cliente:string,contrato?:string,json=false,interagir=true) {
  const plano=prepararConexao(p,cliente,contrato);
  if(json){imprimirJson(plano);return;}
  console.log(`CONEXÃO · ${cliente}\nProjeto validado: ${textoSeguroNoTerminal(p.manifesto.name)}\nRaiz: ${p.raiz}\nDestino: ${plano.destination}\nNome: ${plano.name}\nCliente ${plano.installed?'localizado':'não instalado'}\n\n${plano.command}\n\n${plano.notice}`);
  if(!interagir||!process.stdin.isTTY||!process.stdout.isTTY||!plano.installed||plano.manualOnly||cliente!=='codex'){console.log('Revise e execute o comando acima quando desejar configurar o cliente.');return;}
  const confirmacao=await perguntarNoTerminal(`Para adicionar SEM sobrescrever, digite "${plano.confirmation}" (Enter cancela): `);
  imprimirJson(aplicarConexao(plano,confirmacao));
}
