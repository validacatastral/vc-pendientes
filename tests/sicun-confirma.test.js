/* "SICUN confirma" cuenta solo ✔ verificado: ◐ cambió otro campo NO es confirmado (cambió otro campo, no el observado).
   Datos sintéticos (solo conteos). Uso: node tests/sicun-confirma.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var T=vm.runInNewContext(cut('function number(value){','\n')+'\n'+cut('function confirma(t){','\n')+'\n({confirma:confirma});');
function tot(o){return Object.assign({filas:100,verificado:0,otroCampo:0,sinCambio:0,noEncontrado:0,invalido:0,noAplicaConCambio:0},o);}

// 1) ◐ no suma: 40 verificados + 18 ◐ de 100 filas cruzadas → 40% (antes daba 58%)
assert.strictEqual(T.confirma(tot({verificado:40,otroCampo:18,sinCambio:30,noAplicaConCambio:12})),'40%');
// 2) Subir o bajar ◐ no mueve el porcentaje
assert.strictEqual(T.confirma(tot({verificado:40,otroCampo:0,sinCambio:60})),T.confirma(tot({verificado:40,otroCampo:60})));
// 3) Solo ◐ → 0% confirmado
assert.strictEqual(T.confirma(tot({otroCampo:100})),'0%');
// 4) No encontrado e inválido salen del denominador
assert.strictEqual(T.confirma(tot({verificado:45,otroCampo:5,sinCambio:40,noEncontrado:6,invalido:4})),'50%');
// 5) Sin denominador o sin totales → —
assert.strictEqual(T.confirma(tot({filas:10,noEncontrado:10})),'—');assert.strictEqual(T.confirma({}),'—');assert.strictEqual(T.confirma(undefined),'—');
// 6) La tarjeta usa esta función y ya no suma otroCampo al porcentaje
assert(/node\('div',confirma\(t\),'number green'\)/.test(html));assert(!/\(v\+o\)\/den/.test(html));
console.log('ok SICUN confirma: solo verificado, ◐ no cuenta');
