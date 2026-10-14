/** Canal projetos:demo: Copiar o projeto de demonstração para uma pasta gravável e vinculá-lo. */
import { app } from 'electron';
import path from 'node:path';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { raizDoAplicativo } from '../../compartilhado/raizDoAplicativo.js';
import { adicionarVinculo } from '../regras/adicionarVinculo.js';
import { copiarDemonstracao } from '../regras/copiarDemonstracao.js';

export const projetosDemo: TratadorDoCanal<'projetos:demo'> = async () => {
  const origem = app.isPackaged ? path.join(process.resourcesPath, 'demo') : path.join(raizDoAplicativo, 'backend', 'projetos', 'exemplos', 'projeto-demo');
  return adicionarVinculo(copiarDemonstracao(origem));
};
