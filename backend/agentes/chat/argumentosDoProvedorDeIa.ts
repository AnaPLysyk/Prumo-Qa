/** Monta os argumentos do CLI do Claude ou do Codex com tudo bloqueado (sem ferramentas, sem edição, só leitura). */
import { Provedor } from '../tipos/chat.js';

export function argumentosDoProvedorDeIa(provedor: Exclude<Provedor, 'local'>, prompt: string) {
  // A delegação do chat autoriza uma resposta, nunca edição, execução ou publicação.
  // Flags incompatíveis falham fechadas e conversar volta para a resposta local.
  return provedor === 'claude'
    ? ['-p', '--tools', '', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--settings', '{"disableAllHooks":true}', '--setting-sources', '', '--no-session-persistence', '--', prompt]
    : ['exec', '--skip-git-repo-check', '--sandbox', 'read-only', '--ephemeral', '--ignore-user-config', '--disable', 'hooks', '--disable', 'apps', '--disable', 'plugins', '--disable', 'remote_plugin', '--disable', 'shell_tool', '--disable', 'unified_exec', '-c', 'approval_policy="never"', '--', prompt];
}
