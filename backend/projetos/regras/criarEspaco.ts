/** Cria um projeto do Prumo: pasta própria, contrato somente leitura e registro na lista de projetos. */
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { gravarEspacos } from '../banco/gravarEspacos.js';
import { lerEspacos } from '../banco/lerEspacos.js';
import { adicionarVinculo } from './adicionarVinculo.js';
import { eventoEspaco } from './eventoEspaco.js';
import { Espaco, dadosEspaco } from '../tipos/espacos.js';

export async function criarEspaco(dados:z.input<typeof dadosEspaco>,base?:string){
  const d=dadosEspaco.parse(dados);const r=lerEspacos(base);if(r.espacos.length>=200)throw new Error('WORKSPACE_LIMIT');
  const id=randomUUID();let raiz=path.join(diretorioDados(base),'espacos',id);semLinks(raiz);
  fs.mkdirSync(raiz,{recursive:true,mode:0o700});raiz=fs.realpathSync(raiz);
  fs.writeFileSync(path.join(raiz,'qa.project.json'),JSON.stringify({schemaVersion:2,id:'prumo-'+id,name:d.nome,context:{documentation:[],tests:[],code:[]},commands:{},execution:{requireApproval:true,readOnly:true,blockedByDefault:[],environment:'host'}}),{flag:'wx',mode:0o600});
  await adicionarVinculo(raiz,base);
  const atual=lerEspacos(base);if(atual.espacos.length>=200)throw new Error('WORKSPACE_LIMIT');
  const e:Espaco={id,...d,criadoEm:new Date().toISOString(),raizContextos:raiz,vinculos:[],relacoes:[],historico:[]};eventoEspaco(e,'CRIADO');atual.espacos.push(e);gravarEspacos(atual,base);return e;
}
