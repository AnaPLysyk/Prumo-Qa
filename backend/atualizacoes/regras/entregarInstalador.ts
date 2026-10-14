/** Fora do Windows o instalador não roda sozinho: o arquivo conferido vai para a pasta Downloads e a pessoa o abre. */
import fs from 'node:fs';
import path from 'node:path';
import { PlataformaDoInstalador } from './plataformaDoInstalador.js';

/** Copia o arquivo verificado para a pasta de destino sem sobrescrever nada (acrescenta -1, -2…) e apaga a pasta temporária. */
export function entregarInstalador(arquivo: string, destino: string, plataforma: PlataformaDoInstalador): string {
  fs.mkdirSync(destino, { recursive: true });
  const { name, ext } = path.parse(arquivo);
  let final = path.join(destino, name + ext);
  for (let n = 1; fs.existsSync(final); n++) final = path.join(destino, `${name}-${n}${ext}`);
  fs.copyFileSync(arquivo, final, fs.constants.COPYFILE_EXCL);
  if (plataforma === 'linux-appimage') fs.chmodSync(final, 0o755);
  fs.rmSync(path.dirname(arquivo), { recursive: true, force: true });
  return final;
}

/** Passo seguinte, em uma frase, para cada sistema (mostrado na confirmação e na janela). */
export function instrucaoDeInstalacao(plataforma: PlataformaDoInstalador): string {
  switch (plataforma) {
    case 'mac-arm64': case 'mac-x64': return 'Abra o arquivo .dmg e arraste o Prumo QA para Aplicativos. Na primeira abertura, clique com o botão direito no Prumo QA e escolha Abrir (o app não é assinado pela Apple).';
    case 'linux-appimage': return 'O arquivo já está executável: dê dois cliques ou rode ./ nele. Em Ubuntu 22.04 ou mais novo, instale antes o libfuse2.';
    case 'linux-deb': return 'Instale com: sudo apt install ./<arquivo>.deb (ou abra o arquivo no instalador de pacotes).';
    default: return 'Execute o instalador baixado.';
  }
}
