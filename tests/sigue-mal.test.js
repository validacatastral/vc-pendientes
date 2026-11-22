// Datos sintéticos. Uso: node tests/sigue-mal.test.js
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var T=vm.runInNewContext([
  cut('const str = value','\nfunction node('),
  cut('function number(value){','\n'),
  cut('function confirma(t){','\n'),
  cut('const pendingTotal=','\n'),
  cut('function sigueMalTexto(t){','\n')
].join('\n')+'\n({category,pending,pendingTotal,confirma,sigueMalTexto});');

for(const [resultado,estado] of [
  ['◐ Cambió pero sigue mal: R4A CIIU no corresponde al uso','APLICA'],
  ['◐ Cambió pero sigue mal: R2 NO APLICA X','APLICA'],
  ['◐ Cambió pero sigue mal: R2 NO APLICA X','NO APLICA'],
  ['◐ CAMBIÓ PERO SIGUE MAL: R1','APLICA']
]){
  assert.strictEqual(T.category({resultado,estado}),'sigueMal',resultado);
  assert.strictEqual(T.pending({resultado,estado}),true,resultado);
}
for(const [resultado,categoria] of [
  ['◐ Cambió otro campo · se esperaba: CIIU','otroCampo'],
  ['◐ Cambió otra unidad del lote · Posible renumeración','otraUnidad'],
  ['✔ VERIFICADO','verificado']
]){
  assert.strictEqual(T.category({resultado,estado:'APLICA'}),categoria,resultado);
}

var anterior={filas:20,verificado:8,sinCambio:4,noAplicaConCambio:2};
var actual={...anterior,sigueMal:3};
assert.strictEqual(T.pendingTotal({totales:anterior}),6);
assert.strictEqual(T.pendingTotal({totales:actual}),9);
assert.strictEqual(T.confirma(anterior),'40%');
assert.strictEqual(T.confirma(actual),T.confirma(anterior));
assert.strictEqual(T.sigueMalTexto(anterior),'');
assert.strictEqual(T.sigueMalTexto({sigueMal:0}),'');
assert.strictEqual(T.sigueMalTexto(actual),'◐ 3 cambió pero sigue mal');
console.log('ok sigue mal: categoría, pendientes, compatibilidad de totales y porcentaje SICUN confirma');
