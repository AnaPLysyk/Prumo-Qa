/** Textos de privacidade (retenção, o que não é transmitido, limites) e as categorias da pasta de dados. */

/**
 * Transparência sobre os dados locais. Só mede tamanhos; não lê conteúdo e não segue links simbólicos.
 * A exclusão de cada categoria vive no módulo dono do formato (atividades, evidencias, diagnostico).
 */
export const politicaRetencao = 'Sem retenção automática: nada é apagado ou arquivado sozinho. Você decide quando excluir.';

export const naoTransmitido = [
  'Histórico, métricas, logs e evidências não são enviados ao desenvolvedor nem a qualquer servidor do Prumo.',
  'Lista de projetos e caminhos locais ficam somente neste computador.',
  'A janela não faz requisições de rede. O processo principal consulta atualizações e, por ação explícita, chamados públicos no GitHub oficial; nessas consultas públicas nenhum dado de projeto é enviado.',
  'Nas consultas autenticadas explícitas Jira/Qase/GitHub, o processo principal envia a credencial ao serviço oficial junto de instância, IDs, filtros e paginação selecionados. Não envia documentos, código local nem logs; respostas não são transferidas automaticamente para IA.'
];

export const limitesPrivacidade = [
  'O que o servidor MCP devolve a um cliente de IA (contexto autorizado, análises, evidências) passa a ser tratado por esse cliente e por seu provedor, conforme as políticas deles.',
  'O Prumo não recebe as conversas, o raciocínio nem os prompts do cliente de IA; só vê as chamadas que chegam às suas quatro ferramentas.',
  'Metadados do histórico (identificadores, contagens, estados, horários) podem revelar informações sobre o projeto se forem exportados.'
];

export const categorias: Record<string, string> = { projects: 'historico', plataforma:'plataforma-e-credenciais-protegidas', espacos:'projetos-prumo', integracoes:'integracoes', contextos: 'contextos', diagnostico: 'diagnostico', demonstracao: 'demonstracao', app: 'aplicativo', 'vinculos.json': 'vinculos' };
