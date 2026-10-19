/** Modo seguro de migracao do banco de contas de producao.
 * Padrao: somente plano, sem ALTER/CREATE. Executar exige autorizacao explicita
 * apos backup verificavel e rotacao da senha exposta. Nunca roda no boot da API.
 */
export function planoDaMigracaoDeProducao(env = process.env) {
  if (env.BETTER_AUTH_URL !== 'https://prumo-qa-servico.onrender.com') {
    throw new Error('MIGRATION_PROD_URL_REQUIRED');
  }
  const executar = env.PRUMO_APROVAR_MIGRACAO_PROD === 'SIM';
  if (executar && env.PRUMO_BACKUP_CONFIRMADO !== 'SIM') {
    throw new Error('MIGRATION_PROD_BACKUP_REQUIRED');
  }
  if (executar && env.PRUMO_CREDENCIAL_ROTACIONADA !== 'SIM') {
    throw new Error('MIGRATION_PROD_CREDENTIAL_ROTATION_REQUIRED');
  }
  return {executar};
}
