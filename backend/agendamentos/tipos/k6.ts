/** Formato da configuração do k6 e seus limites (50 usuários, 600 segundos). */

/**
 * Adaptador do k6. Usa o executável oficial; não existe motor próprio de carga e nenhum código do k6 é copiado.
 * Regras: executável procurado só em pastas absolutas do PATH (nunca na pasta atual), sem shell; script dentro da raiz do
 * projeto; usuários virtuais e duração com teto; destino declarado; produção bloqueada; mesma aprovação humana das demais
 * execuções (manual pelo broker nativo, agendada por autorização delegada restrita ao hash exato).
 */
export type ConfigK6 = { script: string; alvo: string; usuarios: number; duracaoSegundos: number };

export const LIMITE_USUARIOS = 50;

export const LIMITE_DURACAO_S = 600;

export type ExecutavelK6 = { executable: string; argsIniciais?: string[] };
