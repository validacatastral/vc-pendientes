// Datos sintéticos. Uso: node tests/revisado.test.js
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var T=vm.runInNewContext([cut('const str = value','\nfunction node('),cut('function number(value){','\n'),cut('function confirma(t){','\n'),cut('const pendingTotal=','\n'),cut('function revisadoTexto(t){','\n'),cut('function observacion(row){','\n')].join('\n')+'\n({category,pending,confirma,pendingTotal,revisadoTexto,observacion});');
for(const comentario of ['NO APLICA','SIN CAMBIO','revisar: dato correcto']){
 const row={resultado:'✔ Revisado a mano · ver columna REVISIÓN del Excel del validador: '+comentario,estado:'NO APLICA',obs:'anterior'};
 assert.strictEqual(T.category(row),'revisado');assert.strictEqual(T.pending(row),true);assert.strictEqual(T.observacion(row),comentario);
}
const anterior={filas:100,verificado:40,noEncontrado:6,invalido:4,sinCambio:30,noAplicaConCambio:15,sigueMal:2};
const actual={...anterior,revisado:3};
assert.strictEqual(T.pendingTotal({totales:actual}),T.pendingTotal({totales:anterior}));
assert.strictEqual(T.confirma(actual),'46%');assert.strictEqual(T.confirma(anterior),'44%');
assert.strictEqual(T.confirma({filas:3,revisado:3}),'—');
assert.strictEqual(T.revisadoTexto(anterior),'');assert.strictEqual(T.revisadoTexto({revisado:0}),'');assert.strictEqual(T.revisadoTexto(actual),'✔ 3 revisados a mano');
assert.strictEqual(T.observacion({resultado:'⚠ Sin cambio en SICUN: texto',obs:'observación'}),'observación');
assert.strictEqual(T.observacion({resultado:'✔ Revisado a mano',obs:'original'}),'original');
assert(/<option value="revisado">✔ REVISADO A MANO<\/option>/.test(html));assert(/revisado:'green'/.test(html));
assert(/&&pending\(r\)\)\.length/.test(html));assert(/result==='pending'\?pending\(r\)/.test(html));
assert(/card\.append\(node\('p',revisado,'green small'\)\)/.test(html));assert(/if\(revisado\)\$\('explanation'\)\.append/.test(html));
console.log('ok revisado a mano: categoría, presentación, pendientes y SICUN confirma');
