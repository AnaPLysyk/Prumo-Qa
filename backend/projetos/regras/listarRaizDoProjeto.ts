/** Lista só a primeira camada de arquivos e pastas do projeto, sem seguir atalhos nem itens sensíveis. */
import fs from 'node:fs';
import { sensivel } from '../../compartilhado/seguranca/sensivel.js';

/** Lê só a raiz da pasta escolhida. Links, itens sensíveis e pastas geradas (node_modules, dist…) ficam de fora. */
export function listarRaizDoProjeto(raiz: string) {
  return fs.readdirSync(raiz, { withFileTypes: true }).filter((d) => !d.isSymbolicLink() && !sensivel(d.name)).map((d) => ({ nome: d.name, pasta: d.isDirectory() }));
}
