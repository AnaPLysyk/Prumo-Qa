/** Cria um projeto Prumo e seu contrato local, sem executar automações. */
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {diretorioDados, semLinks} from '../../../atividades.js';
import {adicionarVinculo} from '../../../vinculos.js';
import {dadosEspaco, type Espaco} from './definicoesEspaco.js';
import {ler, gravar, eventoEspaco} from './armazenarEspacos.js';

export async function criarEspaco(dados:z.input<typeof dadosEspaco>,base?:string){
  const d=dadosEspaco.parse(dados);const r=ler(base);if(r.espacos.length>=200)throw new Error('WORKSPACE_LIMIT');
  const id=randomUUID();let raiz=path.join(diretorioDados(base),'espacos',id);semLinks(raiz);
  fs.mkdirSync(raiz,{recursive:true,mode:0o700});raiz=fs.realpathSync(raiz);
  fs.writeFileSync(path.join(raiz,'qa.project.json'),JSON.stringify({schemaVersion:2,id:'prumo-'+id,name:d.nome,context:{documentation:[],tests:[],code:[]},commands:{},execution:{requireApproval:true,readOnly:true,blockedByDefault:[],environment:'host'}}),{flag:'wx',mode:0o600});
  await adicionarVinculo(raiz,base);
  const atual=ler(base);if(atual.espacos.length>=200)throw new Error('WORKSPACE_LIMIT');
  const e:Espaco={id,...d,criadoEm:new Date().toISOString(),raizContextos:raiz,vinculos:[],relacoes:[],historico:[]};eventoEspaco(e,'CRIADO');atual.espacos.push(e);gravar(atual,base);return e;
}
