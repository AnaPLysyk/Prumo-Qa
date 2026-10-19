/** Testes unitários das interfaces remotas, sem rede, navegador ou banco. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function carregar(arquivo) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(arquivo, 'utf8'), ctx, { filename: arquivo });
  return ctx.window;
}
function montar(api) {
  const vistas = [], erros = [], sessoes = [];
  const login = carregar('frontend/login/entradaRemota.js').PrumoLoginRemoto({
    api, DS: { alerta: texto => ({ texto }) },
    campo: id => ({ input: { id, value: '' }, no: { id } }),
    cartao: titulo => [{ titulo }],
    formulario: (campos, titulo, enviar, links) => ({ tipo: 'formulario', campos, titulo, enviar, links }),
    trocarVista: (...nos) => vistas.push(nos),
    mostrarErro: (_form, erro) => erros.push(erro),
    iguais: (_form, a, b) => a.input.value === b.input.value,
    link: (titulo, onClick, id) => ({ titulo, onClick, id }),
    aoEntrar: sessao => sessoes.push(sessao)
  });
  return { login, erros, sessoes, form: () => vistas.at(-1).find(x => x?.tipo === 'formulario') };
}
test('mensagens de login não expõem erro interno', () => {
  const m = carregar('frontend/login/mensagensDeEntrada.js').PrumoMensagensEntrada;
  assert.equal(m.codigoDo('SESSION_EXPIRED: expired'), 'SESSION_EXPIRED');
  assert.match(m.mensagemDaEntrada('LOGIN_INVALID: segredo'), /senha incorretos/);
  assert.doesNotMatch(m.mensagemDaEntrada('UNHANDLED: senha=teste e stack'), /stack|senha=teste/);
});
test('login remoto autentica, limpa o campo de senha e repassa sessão', async () => {
  const chamadas = [], usuario = { usuario: { id: 'conta123' } };
  const t = montar({ contaEntrar: async (...args) => { chamadas.push(args); return { ok: true, data: usuario }; } });
  t.login.vistaEntrarRemota();
  const f = t.form();f.campos[0].input.value = 'teste@exemplo.com';f.campos[1].input.value = 'senha-temporaria';
  await f.enviar(f);
  assert.equal(chamadas[0][0], 'teste@exemplo.com');
  assert.equal(chamadas[0][1], 'senha-temporaria');
  assert.equal(f.campos[1].input.value, '');
  assert.equal(t.sessoes[0], usuario);
});
test('erro, cadastro e recuperação usam a API remota sem guardar senhas', async () => {
  const chamadas = [];
  const t = montar({
    contaEntrar: async () => ({ ok: false, error: 'LOGIN_INVALID' }),
    contaCadastrar: async (...a) => { chamadas.push(['cadastro', ...a]); return { ok: true }; },
    contaCodigo: async (...a) => { chamadas.push(['senha', ...a]); return { ok: true }; }
  });
  t.login.vistaEntrarRemota();
  let f=t.form();f.campos[0].input.value='teste@exemplo.com';f.campos[1].input.value='errada';
  await f.enviar(f);assert.equal(f.campos[1].input.value, '');assert.deepEqual(t.erros,['LOGIN_INVALID']);
  f.links.find(x=>x.id==='entrada-ir-cadastro').onClick();
  f=t.form();for(const [i,v] of ['Pessoa','teste@exemplo.com','senha-forte123','senha-forte123'].entries())f.campos[i].input.value=v;
  await f.enviar(f);
  assert.equal(chamadas[0][0],'cadastro');assert.equal(chamadas[0][1],'teste@exemplo.com');
  assert.equal(f.campos[2].input.value,'');assert.equal(f.campos[3].input.value,'');
  t.login.vistaRecuperarRemoto();f=t.form();f.campos[0].input.value='teste@exemplo.com';
  await f.enviar(f);assert.equal(chamadas[1][0],'senha');assert.equal(chamadas[1][2],'SENHA');
});
test('módulos do login são carregados na ordem correta', () => {
  const html=fs.readFileSync('frontend/compartilhado/runtime/index.html','utf8');
  let anterior=-1;
  for(const f of ['mensagensDeEntrada.js','entradaRemota.js','entrarNaConta.js']){
    const atual=html.indexOf('src="telas/login/'+f+'"');
    assert.ok(atual>anterior, f);anterior=atual;
  }
  const principal=fs.readFileSync('frontend/login/entrarNaConta.js','utf8');
  assert.match(principal,/PrumoMensagensEntrada/);assert.match(principal,/PrumoLoginRemoto/);
  assert.doesNotMatch(principal,/function vistaCadastrarRemoto/);
});
