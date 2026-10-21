export function criarRepositorio() {
  const dados=new Map();
  return {
    salvar(perfil,id,titulo){
      if(perfil!=='Editor') return {status:403};
      if(typeof id!=='string'||id.trim()==='')return {status:422};
      if(typeof titulo!=='string')return {status:422};
      // R2: o título é aparado e contado em pontos de código Unicode (um emoji simples vale 1), não em unidades UTF-16.
      const texto=titulo.trim();const tamanho=[...texto].length;
      if(tamanho<1||tamanho>80)return {status:422};
      dados.set(id,texto);return {status:200};
    },
    ler(id){return dados.get(id);}
  };
}
