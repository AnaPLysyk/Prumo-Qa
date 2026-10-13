/** Canal administracao:mapa: Mostrar a documentação viva desta versão: tela, interface, canais, backend e testes. */
import { lerMapaDoAplicativo } from '../banco/lerMapaDoAplicativo.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const administracaoMapa: TratadorDoCanal<'administracao:mapa'> = () => lerMapaDoAplicativo();
