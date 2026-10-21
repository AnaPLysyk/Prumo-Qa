# Segurança de API: ideias do OWASP API Security Top 10 (2023)

Adaptado do OWASP API Security Top 10 2023 (OWASP API Security Project, CC-BY-SA-4.0; ver `backend/agentes/skills/TERCEIROS.md`) e reescrito em português para o Prumo QA. Este arquivo, como adaptação, fica sob a mesma licença CC-BY-SA-4.0. Serve para revisar se os testes existentes cobrem riscos de autorização e abuso. Teste de segurança só roda em ambiente isolado e autorizado, por capability declarada; nunca contra produção ou terceiros.

## Riscos que viram cenário quando o requisito os prevê

- **Objeto de outro usuário (API1):** o identificador na rota ou no corpo pertence a alguém sem permissão? O teste usa dois usuários e confirma recusa sem mutação.
- **Autenticação fraca (API2):** token ausente, expirado, malformado ou de outro ambiente é recusado em todo endpoint protegido.
- **Propriedade sem permissão (API3):** a resposta não traz campos que o perfil não deve ver, e enviar campo extra (por exemplo, papel ou preço) não altera o dado.
- **Consumo sem limite (API4):** tamanho de corpo, paginação máxima, tempo e quantidade de requisições têm limite documentado.
- **Função administrativa (API5):** perfil comum não consegue chamar operação de administração por trocar o método ou o caminho.
- **Fluxo de negócio abusável (API6):** repetir automaticamente uma ação sensível (cadastro, compra, recuperação) tem freio definido.
- **Chamada a endereço informado pelo usuário (API7):** URL recebida não leva o servidor a acessar destinos internos.
- **Configuração (API8):** mensagens de erro sem detalhe interno, métodos não usados desligados, CORS e cabeçalhos conforme o requisito.
- **Inventário (API9):** versões antigas e rotas de depuração aparecem na documentação ou estão desligadas.
- **Consumo de APIs de terceiros (API10):** resposta externa é validada como entrada não confiável.

## Como registrar

Para cada risco aplicável: requisito de origem, perfil usado, resultado esperado e oráculo (status específico mais ausência de mutação). Risco sem requisito vira pergunta, não teste inventado. Não acione automação de ataque, não varra portas e não use credenciais reais.
