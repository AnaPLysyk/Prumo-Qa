/** Entrar ou se cadastrar pelo GitHub: a lógica é a mesma do Google (entradaPorProvedor.ts); aqui só ficam os nomes que o GitHub usa. */
import { DependenciasDeEntrada, EstadoDaEntrada, ModoDaEntrada, estadoDaEntrada, iniciarEntrada } from './entradaPorProvedor.js';

export type DependenciasDoGithub = DependenciasDeEntrada;
export type EstadoDaEntradaGithub = EstadoDaEntrada;
export type { ModoDaEntrada };

/** Abre o navegador na autorização do GitHub; a conta entra já com a conexão do GitHub. */
export const iniciarEntradaGithub = (d: DependenciasDoGithub, modo: ModoDaEntrada = 'entrar') => iniciarEntrada('github', d, modo);

/** Como está a entrada pelo GitHub; `cancelar` desiste e fecha o endereço local. */
export const estadoDaEntradaGithub = (cancelar = false) => estadoDaEntrada(cancelar);
