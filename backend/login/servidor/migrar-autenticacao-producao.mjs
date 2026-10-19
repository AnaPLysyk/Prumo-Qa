/** Migracao manual do Better Auth em producao, nunca executada no boot.
 * Sem autorizacao explicita: apenas calcula e mostra a quantidade de alteracoes.
 */
import {pathToFileURL} from 'node:url';
import {getMigrations} from 'better-auth/db/migration';
import {criarAutenticacao} from './autenticacao.mjs';
import {planoDaMigracaoDeProducao} from '../regras/planoDaMigracao.mjs';

export async function executarPlanoDeMigracao(env=process.env) {
  const {executar}=planoDaMigracaoDeProducao(env);
  const cliente=criarAutenticacao({env});
  try {
    const {toBeCreated,toBeAdded,runMigrations}=await getMigrations(cliente.auth.options);
    console.log('Tabelas a criar:',toBeCreated.length,'colunas a adicionar:',toBeAdded.length);
    if (!executar) {
      console.log('PREVIEW: sem alteracoes no banco. Backup, rotacao de credencial e autorizacao ainda obrigatorios.');
      return;
    }
    await runMigrations();
    await cliente.checar();
    console.log('Esquema de autenticacao conferido apos migracao.');
  } finally {
    await cliente.fechar();
  }
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  await executarPlanoDeMigracao();
}
