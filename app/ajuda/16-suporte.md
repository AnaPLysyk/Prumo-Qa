# Suporte e avisos de atualização

## Pedir ajuda ou reportar um problema

A aba **Suporte** permite relatar um **bug**, pedir uma **melhoria** ou enviar uma **sugestão**. O canal oficial é o **GitHub Issues** do repositório do Prumo QA. Não há e-mail de suporte.

1. Preencha tipo, título, descrição e (em bugs) os passos para reproduzir.
2. Escolha o que incluir: a versão do Prumo QA, o sistema operacional e os últimos eventos do diagnóstico da interface. **Nada é anexado sem a sua marcação.** Logs, evidências, caminhos, contextos e código do seu projeto nunca são anexados.
3. Marque que entende que a issue é pública e clique em **Revisar**. O Prumo mostra exatamente o texto que será usado, bloqueia o envio se encontrar algo que parece segredo (token, senha, chave privada) e apenas avisa sobre e-mails, telefones, CPF e caminhos do seu computador.
4. **Abrir formulário no GitHub** pede uma confirmação do Windows e abre o navegador no formulário oficial já preenchido. **Nada é publicado até você enviar lá.** Ou use **Exportar para arquivo** para guardar o relato localmente, sem usar o GitHub.

**Atenção:** issues do repositório público são visíveis para qualquer pessoa. Não inclua senhas, tokens, documentos privados, código confidencial ou dados pessoais. Falhas de segurança devem ser relatadas pelo canal privado de vulnerabilidades do GitHub, não em issue pública.

O texto de uma issue é tratado como **dado**: a triagem automática apenas aplica rótulos e nunca executa comandos, corrige código ou altera a versão principal.

## Aviso de novas versões (sino)

O **sino** no cabeçalho mostra um ponto quando existe uma versão publicada que você ainda não viu. Passe o mouse, use o teclado (Tab até o sino) ou clique: aparecem o número da versão e um resumo; o clique abre **Ajuda › Atualizações** com as notas completas (correções, segurança e compatibilidade) e marca a versão como vista.

Em **Ajuda › Atualizações › Preferências de aviso** você escolhe:

- **Avisar quando houver versão nova** (ligado por padrão desde a 2.10.1): consulta ao abrir e a cada 6 horas, mesmo com o aplicativo só na bandeja, e avisa uma vez por versão no sino e com uma notificação do Windows.
- **Som**: um som curto (dois tons) quando há versão nova. Toca **uma única vez por versão**, não repete ao reabrir.
- **Silenciar**: nunca toca som.

A consulta só acontece com o aplicativo aberto (janela ou bandeja); não há serviço nem tarefa agendada do Windows. Ela vai somente ao GitHub oficial, sem enviar logs, projetos, caminhos ou identificadores (o GitHub vê o seu endereço IP, como em qualquer conexão).

## Atualizar com um clique (2.10.2)

Em **Ajuda › Atualizações**, quando há versão nova, clique em **Atualizar agora** e confirme. O Prumo baixa o instalador oficial e o arquivo .sha256 da release no GitHub, confere o SHA-256, fecha, instala e abre de novo na versão nova. Projetos, histórico e evidências são mantidos. Se houver uma execução em andamento, ele pede para esperar terminar. **Nada é baixado nem instalado sem o seu clique.** Quem está numa versão anterior à 2.10.2 instala a nova pelo instalador baixado da página oficial.
