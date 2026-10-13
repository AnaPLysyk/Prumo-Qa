// Compatibilidade: o serviço prumo-qa-docs no Render ainda chama este caminho antigo como Build Command.
// O gerador real é site/gerar.mjs; remover este arquivo depois que o comando do Render for corrigido.
import { gerarSite } from '../site/gerar.mjs';
console.log(JSON.stringify(gerarSite(), null, 2));
