import test from 'node:test';
import assert from 'node:assert/strict';
import {planoDaMigracaoDeProducao} from '../../../../backend/login/regras/planoDaMigracao.mjs';

const env = {BETTER_AUTH_URL:'https://prumo-qa-servico.onrender.com'};

test('migração de produção é preview sem consentimento de execução', () => {
  assert.deepEqual(planoDaMigracaoDeProducao(env),{executar:false});
  assert.throws(()=>planoDaMigracaoDeProducao({BETTER_AUTH_URL:'https://prumo-qa-auth-dev.onrender.com'}),/MIGRATION_PROD_URL_REQUIRED/);
});

test('migração real requer aprovação explícita e backup confirmado', () => {
  assert.throws(()=>planoDaMigracaoDeProducao({...env,PRUMO_APROVAR_MIGRACAO_PROD:'SIM'}),/MIGRATION_PROD_BACKUP_REQUIRED/);
  assert.throws(()=>planoDaMigracaoDeProducao({...env,PRUMO_APROVAR_MIGRACAO_PROD:'SIM',PRUMO_BACKUP_CONFIRMADO:'SIM'}),/MIGRATION_PROD_CREDENTIAL_ROTATION_REQUIRED/);
  assert.deepEqual(planoDaMigracaoDeProducao({...env,PRUMO_APROVAR_MIGRACAO_PROD:'SIM',PRUMO_BACKUP_CONFIRMADO:'SIM',PRUMO_CREDENCIAL_ROTACIONADA:'SIM'}),{executar:true});
});
