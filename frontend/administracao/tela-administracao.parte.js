/** Administracao: declara dependencias e inicializa a tela. */
'use strict';
/** Mostra a tela Administração: a documentação viva (arquivos, fluxo da tela e código com explicação) e o estado do sistema. */
(() => {
  const PAPEIS = { interface: 'Interface', api: 'Canal (api)', regras: 'Regra', banco: 'Dados (banco)', integracoes: 'Integração', tipos: 'Tipos', servidor: 'API HTTP (Render)', outros: 'Outro', teste: 'Teste' };
  const COLUNAS = [['tela', 'Tela'], ['interface', 'Interface'], ['canal', 'Canais'], ['api', 'API'], ['nucleo', 'Regras e dados'], ['teste', 'Testes']];
  const nomeDe = (c) => c.split('/').pop();
  const comNivel = (no, nivel) => { no.style.setProperty('--nivel', String(nivel)); return no; };

