/** Nome do usuário do Windows, lido aqui (nunca informado pela página), usado como aprovador. */
import os from 'node:os';

export const usuarioDoWindows = () => os.userInfo().username;
