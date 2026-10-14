/** Formato das contas locais, dos papéis com permissão por tela e das configurações gerais de acesso. */
import { z } from 'zod';

/**
 * Login do Prumo (2.11): contas locais deste computador, guardadas em plataforma/acessos.json. Senhas e códigos de
 * recuperação só existem como resumo scrypt com sal próprio; nada é enviado pela rede. Enquanto não existe conta,
 * o Prumo funciona como antes (a conta do Windows é a dona de tudo); criar o primeiro administrador liga o login.
 */
export const modulosDoMenu = [
  { id: 'inicio', rotulo: 'Início' }, { id: 'projetos', rotulo: 'Projetos' },
  { id: 'tickets', rotulo: 'Tickets' }, { id: 'testes', rotulo: 'Testes' }, { id: 'agenda', rotulo: 'Agendamentos' },
  { id: 'metricas', rotulo: 'Métricas' }, { id: 'logs', rotulo: 'Logs' },
  { id: 'conexoes', rotulo: 'Conexões' }, { id: 'agentes', rotulo: 'Agentes' }, { id: 'suporte', rotulo: 'Suporte' },
  { id: 'ajuda', rotulo: 'Ajuda' }, { id: 'administracao', rotulo: 'Administração' }
] as const;

export type IdModulo = (typeof modulosDoMenu)[number]['id'];

export const idsDosModulos = modulosDoMenu.map((m) => m.id) as IdModulo[];

/** NENHUM esconde a tela e recusa os canais dela; VER permite consultar; USAR permite também alterar. */
export const niveisDeAcesso = ['NENHUM', 'VER', 'USAR'] as const;

export type NivelDeAcesso = (typeof niveisDeAcesso)[number];

export const estadosDaConta = ['ATIVO', 'PENDENTE', 'DESATIVADO'] as const;

export const loginSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{2,39}$/, 'Login: 3 a 40 caracteres, letras minúsculas, números, ponto, hífen ou sublinhado.');

export const nomeDaPessoaSchema = z.string().trim().min(2).max(80);

/** O tamanho é conferido aqui; letras, números e semelhança com o login são conferidos pela regra de senhas. */
export const senhaSchema = z.string().min(10).max(200);

export const codigoDeRecuperacaoSchema = z.string().trim().toUpperCase().regex(/^[A-Z2-7]{5}(-?[A-Z2-7]{5}){3}$/);

export const idPapelSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{1,29}$/);

export const resumoDeSegredoSchema = z.object({ algoritmo: z.literal('scrypt'), N: z.number().int().min(16384).max(1048576), r: z.number().int().min(8).max(32), p: z.number().int().min(1).max(4), sal: z.string().min(16).max(64), resumo: z.string().min(32).max(128) }).strict();

export type ResumoDeSegredo = z.infer<typeof resumoDeSegredoSchema>;

const quando = z.string().datetime();

export const usuarioSchema = z.object({
  id: z.string().uuid(), login: loginSchema, nome: nomeDaPessoaSchema, papel: idPapelSchema, estado: z.enum(estadosDaConta),
  // Conta criada pelo GitHub não tem senha do Prumo (null): só entra autorizando de novo no GitHub.
  senha: resumoDeSegredoSchema.nullable(), recuperacao: resumoDeSegredoSchema.nullable(), trocarSenha: z.boolean(),
  identidades: z.array(z.object({ provedor: z.enum(['github', 'google']), id: z.string().regex(/^[0-9]{1,30}$/), login: z.string().min(1).max(60) }).strict()).max(5).default([]),
  falhas: z.number().int().min(0).max(1000), bloqueadoAte: quando.nullable(),
  criadoEm: quando, atualizadoEm: quando, ultimoAcesso: quando.nullable(), origem: z.enum(['ATIVACAO', 'ADMINISTRACAO', 'CADASTRO', 'GITHUB', 'GOOGLE'])
}).strict();

export type Usuario = z.infer<typeof usuarioSchema>;

export const telasDoPapelSchema = z.record(z.enum(niveisDeAcesso));

export const papelSchema = z.object({ id: idPapelSchema, nome: z.string().trim().min(2).max(40), descricao: z.string().trim().max(200), fixo: z.boolean(), telas: telasDoPapelSchema }).strict();

export type Papel = z.infer<typeof papelSchema>;

export const configuracaoDeAcessoSchema = z.object({
  cadastroAberto: z.boolean(), aprovarCadastros: z.boolean(), papelDoCadastro: idPapelSchema,
  minutosDeInatividade: z.number().int().min(5).max(720), tentativasAntesDoBloqueio: z.number().int().min(3).max(20), minutosDeBloqueio: z.number().int().min(1).max(240),
  // Client ID do OAuth App do GitHub que a Administração registrou; o segredo fica no cofre do sistema, nunca neste arquivo.
  githubClientId: z.string().regex(/^[A-Za-z0-9._-]{10,60}$/).nullable().default(null),
  // Idem para o Google (Client ID de aplicativo para computador); o segredo também só no cofre.
  googleClientId: z.string().regex(/^[A-Za-z0-9._-]{10,120}$/).nullable().default(null)
}).strict();

export type ConfiguracaoDeAcesso = z.infer<typeof configuracaoDeAcessoSchema>;

export const registroDeContasSchema = z.object({ version: z.literal(1), usuarios: z.array(usuarioSchema).max(500), papeis: z.array(papelSchema).min(1).max(50), acesso: configuracaoDeAcessoSchema }).strict();

export type RegistroDeContas = z.infer<typeof registroDeContasSchema>;

const tudoUsar = Object.fromEntries(modulosDoMenu.map((m) => [m.id, 'USAR'])) as Record<IdModulo, NivelDeAcesso>;

const tudoVer = Object.fromEntries(modulosDoMenu.map((m) => [m.id, 'VER'])) as Record<IdModulo, NivelDeAcesso>;

/** Papéis que já vêm prontos. O administrador é fixo (tudo liberado); os outros a administração pode ajustar. */
export const papeisPadrao: Papel[] = [
  { id: 'administrador', nome: 'Administrador', descricao: 'Tudo, inclusive usuários, permissões e agentes da plataforma.', fixo: true, telas: { ...tudoUsar } },
  { id: 'qa', nome: 'Analista de QA', descricao: 'Usa todas as telas de trabalho; não entra na Administração.', fixo: false, telas: { ...tudoUsar, administracao: 'NENHUM' } },
  { id: 'leitor', nome: 'Leitor', descricao: 'Consulta as telas de trabalho sem alterar nada.', fixo: false, telas: { ...tudoVer, administracao: 'NENHUM' } }
];

export const acessoPadrao: ConfiguracaoDeAcesso = { cadastroAberto: true, aprovarCadastros: true, papelDoCadastro: 'leitor', minutosDeInatividade: 30, tentativasAntesDoBloqueio: 5, minutosDeBloqueio: 15, githubClientId: null, googleClientId: null };

export const registroDeContasVazio: RegistroDeContas = { version: 1, usuarios: [], papeis: papeisPadrao, acesso: acessoPadrao };

/** Campos que a janela pode ver de uma conta: nunca resumo de senha nem de código de recuperação. */
export type ContaVisivel = Pick<Usuario, 'id' | 'login' | 'nome' | 'papel' | 'estado' | 'trocarSenha' | 'criadoEm' | 'ultimoAcesso' | 'origem'> & { bloqueada: boolean; temRecuperacao: boolean; papelNome: string };
