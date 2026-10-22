/** Cria uma pasta nova para um projeto manual, sem substituir uma pasta existente. */
import fs from 'node:fs';
import path from 'node:path';
import { semLinks } from '../compartilhado/seguranca/semLinks.js';

export function criarProjetoLocal(pai: string, nome: string, titulo: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(nome) || /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(nome)) throw new Error('PROJECT_FOLDER_NAME_INVALID');
  semLinks(pai);
  const destino = path.join(fs.realpathSync(pai), nome);
  fs.mkdirSync(destino); // EEXIST preserva qualquer pasta ou arquivo prévio
  fs.writeFileSync(path.join(destino, 'README.md'), '# ' + titulo.replace(/[\r\n]/g, ' ') + '\n\nProjeto local criado no Prumo QA.\n', { flag: 'wx' });
  fs.writeFileSync(path.join(destino, '.gitignore'), 'node_modules/\n.prumo/\ndist/\n.env\n.env.*\n', { flag: 'wx' });
  fs.mkdirSync(path.join(destino, 'testes'));
  fs.writeFileSync(path.join(destino, 'testes', '.gitkeep'), '', { flag: 'wx' });
  return destino;
}
