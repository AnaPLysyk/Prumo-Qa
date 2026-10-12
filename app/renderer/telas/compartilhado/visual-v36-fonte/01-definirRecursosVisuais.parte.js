/** Localiza recursos e define botoes e estilos comuns. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  const asset = (nome) => '../../assets/interfaces-v36/' + nome;
  const button = (texto, fn, attrs = {}) => h('button', { type: 'button', class: 'acao', onclick: fn, ...attrs }, texto);
  const field = (rotulo, input) => h('label', { class: 'v36-field' }, h('span', {}, rotulo), input);
  const note = (texto) => h('p', { class: 'suave' }, texto);
  const previewNotice = 'Prévia local: não executa, não se conecta ao MCP e não altera as políticas do núcleo.';
  const palette = ['#7abaff', '#80ddda', '#bea1f8', '#ffba90', '#a7de82', '#ffa1bf', '#f2d38c', '#99b8ff'];
  const variants = [0, 2, 3, 4, 5, 1, 6, 7];
  // Retrato vivo: respiração e microviradas próprias, halo na cor do agente e varredura holográfica.
  // tamanho: 'mini' (lista), 'large' (perfil e Cérebro) ou padrão. Movimento visual, sem articulação facial.
