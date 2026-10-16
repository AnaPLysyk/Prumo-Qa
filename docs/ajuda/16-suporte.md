# Suporte e avisos de atualização

## Pedir ajuda ou reportar um problema

Na tela **Suporte** você relata um bug, pede uma melhoria ou envia uma sugestão. O chamado vai direto para a equipe do Prumo QA: não precisa de conta no GitHub.

1. Preencha o tipo, o título e a descrição. Para um bug, inclua os passos para reproduzi-lo.
2. Se quiser, use **Anexar imagem ou vídeo**: até 3 imagens (PNG, JPEG ou WebP, 5 MB cada) e 1 vídeo (MP4 ou WebM, até 25 MB). O Prumo confere o arquivo pelo conteúdo, não só pela extensão.
3. Escolha se quer incluir a versão, o sistema operacional ou os eventos recentes de diagnóstico. Só vai o que você marcar. Logs, evidências, caminhos, contextos e código do projeto não são anexados sozinhos.
4. Marque que entende para onde o relato vai e clique em **Revisar**. O Prumo mostra o texto final, bloqueia o que parece segredo (token, senha ou chave) e avisa se encontrar e-mail, telefone, CPF ou caminhos locais.
5. Clique em **Enviar chamado**. Junto vão o seu nome e o e-mail da sua conta, para a equipe responder.

Em **Meus chamados**, ao lado, você vê os chamados que abriu, o estado (Novo, Em análise, Resolvido ou Fechado) e as respostas da equipe. Cada pessoa vê só os próprios chamados.

Prefere uma issue pública? Na revisão, **Abrir no GitHub (público)** abre o formulário do GitHub Issues já preenchido; e **Exportar para arquivo** guarda o relato no computador. Falha de segurança vai pelo canal privado de vulnerabilidades do GitHub.

O envio precisa de internet: o chamado passa pelo serviço do Prumo e fica guardado num repositório privado da equipe.

## Chamados na Administração

Quem tem a marca admin vê todos os chamados em **Administração › Chamados**: o texto, quem abriu, as imagens e o vídeo, as respostas. Dali dá para responder e mudar o estado. Na primeira vez, informe a **chave de administração do suporte** (a mesma configurada no serviço do Prumo); ela fica só no cofre do sistema deste computador.

## Aviso de versão nova

Quando há uma versão nova, aparece um ponto no sino do cabeçalho. Passe o mouse para ver um resumo ou clique para abrir **Ajuda › Atualizações** e ler as notas completas.

Em **Ajuda › Atualizações › Preferências de aviso**:

- **Avisar quando houver versão nova** (ligado por padrão): consulta ao abrir e a cada 6 horas, mesmo só na bandeja, e avisa uma vez por versão, no sino e numa notificação do sistema.
- **Tocar um som curto quando houver uma versão nova**: uma vez por versão.
- **Silenciar**: nunca toca som, mesmo com o som ligado.

A consulta acontece apenas enquanto o Prumo está aberto. Ela acessa o GitHub oficial e não envia seus dados.

## Atualizar com um clique

Em **Ajuda › Atualizações**, clique em **Atualizar agora** e confirme. O Prumo baixa o instalador oficial do seu sistema, confere o SHA-256, fecha, instala a atualização e abre novamente. Seus projetos, histórico e evidências são mantidos. Se houver uma execução em andamento, espere que ela termine. Se não houver instalador para o seu sistema (por exemplo, Linux em ARM), use a página **Download**.
