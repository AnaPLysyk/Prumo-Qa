/** Migração controlada do esquema do Better Auth. Execute SOMENTE no serviço DEV,
 * com DATABASE_URL interna, configurações reais e PRUMO_APROVAR_MIGRACAO_DEV=SIM.
 * Não é chamado pelo servidor nem modifica banco no boot.
 */
import {getMigrations} from 'better-auth/db/migration';
import {criarAutenticacao} from './autenticacao.mjs';

if(process.env.PRUMO_APROVAR_MIGRACAO_DEV!=='SIM' ||
   !String(process.env.BETTER_AUTH_URL||'').includes('auth-dev'))
  throw new Error('MIGRATION_DEV_APPROVAL_REQUIRED');
const cliente=criarAutenticacao();
try {
  const {toBeCreated,toBeAdded,runMigrations}=await getMigrations(cliente.auth.options);
  console.log('Tabelas a criar:',toBeCreated.length,'colunas a adicionar:',toBeAdded.length);
  await runMigrations();
  console.log('Migração DEV concluída.');
} finally {await cliente.fechar();}
