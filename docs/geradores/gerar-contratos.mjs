// Gera docs/CONTRATOS.md a partir do catálogo real (backend/aplicativo/api/catalogoDeContratos.ts), a mesma fonte da tela Ajuda › Integrações técnicas.
// Uso: npm run contratos        (o teste Prumo-QA-Lab/automacao/prumo-qa/testes/regressao/backend/aplicativo/contratos.test.mjs falha se o arquivo estiver desatualizado)
import fs from 'node:fs';
import { catalogo } from '../../dist/aplicativo/api/catalogoDeContratos.js';

export function documento() {
  const ops = catalogo(); const ipc = ops.filter((o) => o.tipo === 'IPC'); const mcp = ops.filter((o) => o.tipo === 'MCP');
  const tabela = (lista) => ['| Operação | Argumentos | Efeito |', '|---|---|---|', ...lista.map((o) => `| \`${o.nome}\` | ${o.campos.length ? o.campos.map((c) => `\`${c}\``).join(', ') : '—'} | ${o.efeito.replaceAll('|', '/')} |`)].join('\n');
  const detalhe = (o) => `### \`${o.nome}\`\n\n- **Tipo:** ${o.tipo}\n- **Finalidade:** ${o.finalidade}\n- **Origem:** ${o.origem}\n- **Destino:** ${o.destino}\n- **Entrada:** ${o.entrada}\n- **Saída:** ${o.saida}\n- **Permissões:** ${o.permissoes}\n- **Efeito:** ${o.efeito}\n- **Arquivos consultados:** ${o.arquivos}\n- **Erros possíveis:** ${o.erros.join(', ')}\n- **Proteções:** ${o.protecoes.join('; ')}\n- **Registro:** ${o.registro}\n`;
  return `# Contratos técnicos do Prumo QA

> Arquivo **gerado** por \`npm run contratos\` a partir de \`backend/aplicativo/api/catalogoDeContratos.ts\`. Não edite à mão: um teste compara este texto com o catálogo real.

O Prumo não abre servidor HTTP local. Existem duas interfaces de entrada; as consultas REST externas de leitura estão documentadas separadamente em [SERVICOS.md](SERVICOS.md):

- **IPC** (${ipc.length} operações): entre a janela Electron e o processo principal, com remetente conferido e argumentos validados por esquema estrito.
- **MCP** (${mcp.length} ferramentas): para agentes de IA, por stdio, iniciado pelo próprio cliente.

## IPC (janela)

${tabela(ipc)}

## MCP (agentes de IA)

${tabela(mcp)}

## Detalhes

${[...ipc, ...mcp].map(detalhe).join('\n')}`;
}
if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href) {
  fs.writeFileSync(new URL('../../docs/CONTRATOS.md', import.meta.url), documento());
  console.log('docs/CONTRATOS.md atualizado.');
}
