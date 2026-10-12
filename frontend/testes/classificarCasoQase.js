'use strict';
/** Mostra se um caso Qase é manual ou automatizado. */
function classificacaoCaso(x){if(typeof x.isManual==='boolean')return x.isManual?(x.isToBeAutomated?'MANUAL · automação planejada':'MANUAL'):'AUTOMATIZADO';return ({0:'MANUAL',1:'MANUAL · automação planejada',2:'AUTOMATIZADO'})[x.automation]||'Classificação não informada pela API';}
