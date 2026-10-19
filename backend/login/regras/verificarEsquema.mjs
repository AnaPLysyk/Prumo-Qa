/** Saúde real da identidade: conexão ativa não basta sem as tabelas do Better Auth. */
const SQL_ESQUEMA = `SELECT
  to_regclass('"user"') AS usuario,
  to_regclass('"session"') AS sessao,
  to_regclass('"account"') AS conta,
  to_regclass('"verification"') AS verificacao`;

/** Rejeita banco vazio ou migração incompleta sem registrar detalhes de conexão. */
export async function verificarEsquemaDaAutenticacao(pool) {
  const resultado = await pool.query(SQL_ESQUEMA);
  const tabelas = resultado.rows?.[0];
  if (!tabelas || !['usuario', 'sessao', 'conta', 'verificacao'].every(chave => tabelas[chave] != null)) {
    throw new Error('AUTH_SCHEMA_REQUIRED');
  }
}
