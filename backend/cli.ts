#!/usr/bin/env node
/** Porta de entrada do terminal (comando prumo): lê os argumentos e chama a ação pedida. */
import { mascarar } from './compartilhado/seguranca/mascarar.js';
import { executarComandoPrumo } from './terminal/executarComandoPrumo.js';

executarComandoPrumo().catch(e=>{console.error(JSON.stringify({error:mascarar(e.message)}));process.exitCode=2;});
