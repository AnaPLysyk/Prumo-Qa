/** Confere que um link aponta para uma issue do repositório oficial do Prumo. */
import { padraoLink } from '../tipos/suporte.js';

export const linkDeIssueValido = (l: string) => padraoLink.test(l);
