export function criarRepositorio() {
  const dados=new Map();
  return {
    salvar(perfil,id,titulo){
      if(perfil!=='Editor') return {status:403};
      if(typeof titulo!=='string'||titulo.length<1||titulo.length>80)return {status:422};
      dados.set(id,titulo);return {status:200};
    },
    ler(id){return dados.get(id);}
  };
}
