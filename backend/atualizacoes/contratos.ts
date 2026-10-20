/** Lógica e contratos de atualizacoes: operações relacionadas no mesmo módulo. */
import { z } from "zod";
import { repositorio } from "../ajuda/contratos.js";

/**
 * Verificação manual de atualização. Só consulta a release oficial; nunca baixa nem executa instalador.
 * Enviado ao GitHub: uma requisição HTTPS GET sem corpo, sem cookies e com User-Agent "PrumoQA/<versão>".
 * Não enviado: logs, projetos, caminhos, identificadores, evidências, tokens. O servidor remoto vê, como em qualquer
 * conexão HTTPS, o endereço IP de origem e dados normais de rede; isto não é anonimato.
 */
export const urlConsulta = `https://api.github.com/repos/${repositorio}/releases/latest`;

export const mensagemOffline = 'Não foi possível verificar atualizações: a consulta não foi concluída. Isto não significa que não exista uma atualização. O aplicativo continua disponível para uso local.';

export const limiteResposta = 1_000_000;

export type Resultado = {
  status: 'ATUALIZACAO_DISPONIVEL' | 'ATUALIZADO' | 'INSTALADA_MAIS_NOVA' | 'SEM_RELEASE' | 'INDISPONIVEL' | 'LIMITE_DE_TAXA' | 'RESPOSTA_INVALIDA';
  installed: string; latest?: string; notes?: string; url?: string; message: string;
  /** Só as respostas conclusivas dizem se existe ou não atualização. Falhas (rede, tempo, recusa, limite, resposta inválida) não dizem nada sobre isso. */
  conclusivo: boolean;
  /** Por que a consulta não concluiu (somente quando conclusivo é falso). */
  motivo?: 'REDE' | 'TEMPO_ESGOTADO' | 'RECUSADO' | 'SERVIDOR' | 'LIMITE_DE_TAXA' | 'RESPOSTA_INVALIDA';
  /** Quando tentar de novo, se o GitHub informou (cabeçalhos x-ratelimit-reset ou retry-after). */
  tentarApos?: string;
};

export const releaseSchema = z.object({
  tag_name: z.string().regex(/^v\d+\.\d+\.\d+$/), html_url: z.string().url(), body: z.string().nullable().optional(),
  draft: z.boolean().optional(), prerelease: z.boolean().optional()
}).passthrough();

/** Endereços permitidos, limites e argumentos do instalador baixado na atualização. */

/**
 * Atualizar com um clique: só depois da confirmação da pessoa, baixa o instalador oficial da release (URL montada
 * aqui a partir da versão validada, nunca recebida da janela), baixa o .sha256 publicado pelo CI na mesma release e só
 * devolve o arquivo se o resumo conferir. Redirecionamentos só para os hosts de download do GitHub, sempre HTTPS.
 * O SHA-256 vem da mesma release: protege contra download corrompido ou trocado no caminho, não contra a conta do
 * repositório comprometida (o instalador não é assinado; ver docs/SEGURANCA.md).
 */
export const HOSTS = new Set(['github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com']);

export const LIMITE_INSTALADOR = 512 * 1024 * 1024;

export type Opcoes = { buscar?: typeof fetch; base?: string; permitirLocal?: boolean; pasta?: string; timeoutMs?: number };

/** Argumentos do instalador NSIS do electron-builder: silencioso, mantém atalhos e reabre o aplicativo ao terminar. */
export const argumentosInstalador = ['/S', '--updated', '--force-run'] as const;
