/** Ferramenta MCP listar_politicas: mostra à IA o que ela pode e não pode pedir neste projeto (especializações e capacidades, com o motivo). */
import { z } from 'zod';
import { configuracaoDoEspaco } from '../politicas/configuracaoDoEspaco.js';
import { matrizDePoliticas } from '../politicas/matrizDePoliticas.js';
import { MeiosDoServidorMcp, somenteLeitura } from '../tipos/mcp.js';
import { especializacoes } from '../tipos/politicas.js';

export function registrarListarPoliticas(m: MeiosDoServidorMcp) {
  m.servidor.registerTool('listar_politicas', { description: 'Mostra o que você (a IA) pode e não pode pedir ao Prumo neste projeto: especializações habilitadas e o estado de cada capacidade, com o motivo. Somente leitura.', inputSchema: z.object({}), annotations: somenteLeitura },
    () => m.resposta(async () => {
      const e = m.espaco(); const c = e ? configuracaoDoEspaco(e.id) : null;
      return { projetoPrumo: e?.nome ?? null, configuracao: c ? (c.padrao ? 'padrão (nada personalizado)' : 'personalizada pela pessoa') : 'projeto sem espaço Prumo: padrão', especializacoesHabilitadas: especializacoes.filter(x => !c || c.especializacoes.includes(x.id)).map(x => ({ id: x.id, nome: x.rotulo, skill: x.skill })), capacidades: matrizDePoliticas(e?.id ?? null),
        aviso: 'SOMENTE_PESSOA significa que a ação existe, mas só a pessoa a executa na janela do Prumo, com confirmação. Você pode apenas propor.' };
    }));
}
