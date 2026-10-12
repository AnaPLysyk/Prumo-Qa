/** Anota o estado da publicação do comentário no Jira para o trabalho. */
import { mudarTrabalho } from './mudarTrabalho.js';
import { Trabalho, trabalhoSchema } from '../tipos/fila.js';

export const definirEstadoJiraDoTrabalho = (id: string, jira: Trabalho['jira'], base?: string) => mudarTrabalho(id, t => { t.jira = trabalhoSchema.shape.jira.parse(jira); }, base);
