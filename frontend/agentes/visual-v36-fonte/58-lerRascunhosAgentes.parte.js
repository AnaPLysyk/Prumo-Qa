/** Carrega as previas locais de agentes personalizados. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  function readDrafts(id) { try { const a = JSON.parse(localStorage.getItem('prumo-v36-drafts-' + id) || '[]'); if (!Array.isArray(a) || a.length > 50) throw Error('Lista inválida'); return a.map(validateDraft); } catch { avisar('Prévias locais inválidas: não puderam ser carregadas.', true); return []; } }
  function validateDraft(a) {
    if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).some(k => !['version', 'id', 'nome', 'descricao', 'objetivo', 'instrucoes'].includes(k)) || a.version !== 1 || typeof a.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(a.id)) throw Error('Formato de prévia inválido.');
    for (const k of ['nome', 'descricao', 'objetivo', 'instrucoes']) if (typeof a[k] !== 'string' || a[k].length > (k === 'nome' ? 100 : 4000)) throw Error('Campo inválido: ' + k);
    if (!a.nome.trim() || !a.objetivo.trim() || !a.instrucoes.trim()) throw Error('Nome, objetivo e instruções são obrigatórios.');
    return { version: 1, id: a.id, nome: a.nome.trim(), descricao: a.descricao, objetivo: a.objetivo.trim(), instrucoes: a.instrucoes.trim() };
  }
