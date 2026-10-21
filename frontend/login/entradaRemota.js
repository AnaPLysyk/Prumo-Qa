'use strict';
/** Tela Login: formulários da autenticação online (Better Auth), sem alterar a sessão diretamente. */
// Recebe componentes da tela principal por parâmetros, envia pedidos somente pelo preload.
// A conta legada permanece em entrarNaConta.js; senhas não são armazenadas aqui.
window.PrumoLoginRemoto = ({
  api, DS, campo, cartao, formulario, trocarVista, mostrarErro, iguais, link, aoEntrar
}) => {
  /** Homologação sem servidor: não libera a criação silenciosa de uma conta local. */
  function vistaServicoIndisponivel() {
    trocarVista(
      ...cartao('Acesso em configuração', 'O login central de desenvolvimento ainda não está conectado à API do Prumo.'),
      DS.alerta('Configure PRUMO_AUTH_API_URL no ambiente de homologação. Nenhum login local será criado neste perfil.', 'info')
    );
  }

  /** A senha é limpa do formulário depois que o backend responde, inclusive em falhas. */
  function vistaEntrarRemota(aviso) {
    const email = campo('entrada-email-remoto', 'E-mail', 'email', {
      autocomplete: 'username', maxlength: 254, autocapitalize: 'off'
    });
    const senha = campo('entrada-senha-remota', 'Senha', 'password', {
      autocomplete: 'current-password', maxlength: 128
    });

    trocarVista(
      ...cartao('Entrar no Prumo', 'Acesse sua conta de qualquer computador, usando e-mail e senha.'),
      aviso ? DS.alerta(aviso, 'aviso') : null,
      formulario([email, senha], 'Entrar', async form => {
        const resposta = await api.contaEntrar(email.input.value, senha.input.value);
        senha.input.value = '';
        if (!resposta.ok) return mostrarErro(form, resposta.error);
        aoEntrar(resposta.data);
      }, [
        link('Criar conta', () => vistaCadastrarRemoto(), 'entrada-ir-cadastro'),
        link('Esqueci a senha', () => vistaRecuperarRemoto(), 'entrada-ir-recuperar')
      ])
    );
  }

  /** Aguarda a verificação remota, oferecendo reenvio e retorno ao login. */
  function vistaAguardandoConfirmacao(email, reenviado=false) {
    trocarVista(
      ...cartao('Confirme seu e-mail', 'Enviamos um link de confirmação. Abra a mensagem, confirme o endereço e depois volte ao Prumo para entrar.'),
      reenviado ? DS.alerta('Novo link solicitado. Confira a caixa de entrada e o spam.', 'info') : null,
      DS.alerta('Endereço informado: ' + email, 'info'),
      formulario([], 'Reenviar e-mail de confirmação', async form => {
        const resposta = await api.contaCodigo(email, 'CADASTRO');
        if (!resposta.ok) return mostrarErro(form, resposta.error);
        vistaAguardandoConfirmacao(email, true);
      }, [
        link('Já confirmei meu e-mail — Entrar', () => vistaEntrarRemota(), 'entrada-confirmada'),
        link('Corrigir e-mail', () => vistaCadastrarRemoto(), 'entrada-corrigir-email')
      ])
    );
  }

  /** Novo cadastro fica pendente até a pessoa confirmar o endereço de e-mail. */
  function vistaCadastrarRemoto() {
    const nome = campo('registro-nome', 'Nome', 'text', {
      autocomplete: 'name', maxlength: 80
    });
    const email = campo('registro-email', 'E-mail', 'email', {
      autocomplete: 'email', maxlength: 254, autocapitalize: 'off'
    });
    const senha = campo('registro-senha', 'Senha', 'password', {
      autocomplete: 'new-password', minlength: 10, maxlength: 128
    });
    const confirmar = campo('registro-confirma', 'Confirmar senha', 'password', {
      autocomplete: 'new-password', minlength: 10, maxlength: 128
    });

    trocarVista(
      ...cartao('Criar conta', 'Sua identidade ficará vinculada ao seu e-mail, não a este computador.'),
      formulario([nome, email, senha, confirmar], 'Criar conta', async form => {
        if (!iguais(form, senha, confirmar)) return;
        const resposta = await api.contaCadastrar(
          email.input.value, nome.input.value, senha.input.value
        );
        senha.input.value = '';
        confirmar.input.value = '';
        if (!resposta.ok) return mostrarErro(form, resposta.error);
        vistaAguardandoConfirmacao(email.input.value.trim().toLowerCase());
      }, [link('Já tenho conta', () => vistaEntrarRemota(), 'entrada-voltar')])
    );
  }

  /** Só pede o link: a troca da senha acontece na página web, nunca neste formulário. */
  function vistaRecuperarRemoto() {
    const email = campo('recuperar-email-remoto', 'E-mail', 'email', {
      autocomplete: 'email', maxlength: 254, autocapitalize: 'off'
    });
    trocarVista(
      ...cartao('Esqueci a senha', 'Vamos enviar um link para você redefinir sua senha com segurança.'),
      formulario([email], 'Enviar link', async form => {
        const resposta = await api.contaCodigo(email.input.value, 'SENHA');
        if (!resposta.ok) return mostrarErro(form, resposta.error);
        vistaEntrarRemota('Se existir uma conta com este e-mail, você receberá um link de recuperação.');
      }, [link('Voltar para entrar', () => vistaEntrarRemota(), 'entrada-voltar')])
    );
  }

  return { vistaServicoIndisponivel, vistaEntrarRemota, vistaCadastrarRemoto, vistaRecuperarRemoto };
};
