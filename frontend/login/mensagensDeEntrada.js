'use strict';
/** Mensagens seguras para o formulário de login: converte códigos de falha em texto sem expor erros internos. */
window.PrumoMensagensEntrada = (() => {
  const codigoDo = (erro) => /^([A-Z][A-Z0-9_]{2,63}):/.exec(String(erro || ''))?.[1] || null;
  function mensagemDaEntrada(erro) {
    const codigo = codigoDo(erro);
    const mensagens = {
      LOGIN_INVALID: 'E-mail ou senha incorretos, ou e-mail ainda não confirmado. Confira os dados e sua caixa de entrada.',
      IDENTITY_SERVICE_UNAVAILABLE: 'Serviço de autenticação indisponível. Confira a conexão e tente novamente.',
      IDENTITY_NOT_CONFIGURED: 'O serviço de identidade do Prumo ainda não foi configurado pela equipe.',
      IDENTITY_INVALID: 'A identidade não pôde ser confirmada. Tente entrar novamente ou entre em contato com o suporte.',
      IDENTITY_PROVIDER_UNAVAILABLE: 'Não foi possível abrir a autorização. Verifique se o acesso pelo provedor está habilitado.',
      IDENTITY_LINK_REQUIRED: 'Essa conta já possui um cadastro local anterior. A associação exige confirmação específica da conta existente.',
      IDENTITY_ADMIN_MISMATCH: 'Essa conta exige autorização de administrador pelo serviço de identidade.',
      LOGIN_NOT_ACTIVE: 'Ainda não existe conta neste computador. Selecione Criar conta para começar.',
      LOGIN_SETUP_REQUIRED: 'Crie a primeira conta de Administrador para começar.',
      LOGIN_RATE_LIMIT: 'Muitas tentativas de acesso. Aguarde um minuto e tente novamente.',
      LOGIN_INVALID_FORMAT: 'Confira o formato do login informado.',
      LOGIN_TAKEN: 'Esse login já está em uso. Escolha outro.',
      LOGIN_ALREADY_ACTIVE: 'Já existe uma conta neste computador. Entre com ela.',
      ACCOUNT_PENDING: 'Este cadastro aguarda aprovação da Administração.',
      ACCOUNT_DISABLED: 'Esta conta está desativada. Procure a Administração.',
      ACCOUNT_LOCKED: 'Conta temporariamente bloqueada por tentativas incorretas. Aguarde ou solicite desbloqueio à Administração.',
      EMAIL_INVALID: 'Confira o e-mail informado.',
      EMAIL_TAKEN: 'Esse e-mail já tem conta neste computador. Entre com ele ou use Esqueci a senha.',
      EMAIL_WAIT: 'Espere um minuto para pedir outro código.',
      EMAIL_RATE_LIMIT: 'Muitos códigos pedidos para este e-mail. Espere alguns minutos e tente de novo.',
      EMAIL_SEND_FAILED: 'O e-mail não pôde ser enviado agora. Tente de novo em instantes.',
      EMAIL_SERVICE_UNAVAILABLE: 'Não foi possível falar com o serviço de envio. Confira a internet e tente de novo.',
      CODE_INVALID: 'Código incorreto. Confira o e-mail e tente de novo.',
      CODE_EXPIRED: 'O código venceu ou foi digitado errado vezes demais. Peça um novo.',
      PASSWORD_INVALID: 'A senha atual não confere.',
      TWO_STEP_EMAIL_REQUIRED: 'A verificação em duas etapas precisa de um e-mail na conta.',
      PASSWORD_WEAK: 'A senha nova não atende às regras de segurança. Use pelo menos 10 caracteres, com letras e números.',
      PASSWORD_CHANGE_REQUIRED: 'Troque a senha temporária para continuar.',
      SESSION_EXPIRED: 'Sua sessão terminou por inatividade. Entre novamente.',
      SESSION_REQUIRED: 'Entre com sua conta do Prumo para continuar.',
      SIGNUP_CLOSED: 'O cadastro de novas contas está fechado. Solicite acesso à Administração.',
      NAME_INVALID: 'Confira o nome informado.',
      GITHUB_LOGIN_NOT_CONFIGURED: 'O acesso com GitHub ainda não foi ativado nesta versão do Prumo. Entre pelo e-mail enquanto isso.',
      GOOGLE_LOGIN_NOT_CONFIGURED: 'O acesso com Google ainda não foi ativado nesta versão do Prumo. Entre pelo e-mail enquanto isso.',
      GITHUB_CLIENT_INVALID: 'A identidade pública do aplicativo GitHub está inválida. Essa configuração é do produto, não da sua conta.',
      GITHUB_SECRET_REQUIRED: 'Configuração antiga do GitHub incompatível com este aplicativo. O usuário não precisa fornecer segredo.',
      GOOGLE_CLIENT_INVALID: 'A identidade pública do aplicativo Google está inválida. Essa configuração é do produto, não da sua conta.',
      GOOGLE_SECRET_REQUIRED: 'Configuração antiga do Google incompatível com este aplicativo. O usuário não precisa fornecer segredo.',
      CREDENTIAL_PROTECTION_UNAVAILABLE: 'O cofre de senhas do sistema não está disponível; o segredo não foi guardado. Crie a conta com login e senha.'
    };
    const validacaoLocal = ['Preencha todos os campos.', 'A confirmação não é igual à senha.'];
    if (validacaoLocal.includes(erro)) return erro;
    return mensagens[codigo] || 'Não foi possível concluir esta ação. Confira os campos e tente novamente. Se persistir, procure a Administração.';
  }
  return { codigoDo, mensagemDaEntrada };
})();
