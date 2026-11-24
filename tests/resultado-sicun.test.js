'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
function cut(a,b){const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i);return html.slice(i,j);}
const t=vm.runInNewContext([cut('const str = value','\nfunction node('),cut('function number(value){','\n'),cut('const pendingTotal=','\n'),cut('function revisarTexto(t){','\n'),cut('function manualConPendiente(row){','\n')].join('\n')+'\n({category,pendingTotal,revisarTexto,manualConPendiente})');
const row={resultado:'✔ Revisado a mano · ver columna REVISIÓN',resultadoSicun:'◐ Cambió pero sigue mal: R4A'};
assert(t.manualConPendiente(row));
assert(!t.manualConPendiente({...row,resultadoSicun:'✔ VERIFICADO'}));
assert(!t.manualConPendiente({...row,resultadoSicun:undefined}));
assert.equal(t.category({resultado:'◐ Cambió, revisar: R8B'}),'revisar');
assert.equal(t.category({resultado:'◐ Cambió otro campo: R4A'}),'otroCampo');
assert.equal(t.revisarTexto({}), '');
assert.equal(t.revisarTexto({revisar:2,sigueMal:9}),'◐ 2 cambió, revisar');
assert.equal(t.pendingTotal({totales:{sinCambio:2,noAplicaConCambio:1,sigueMal:3,revisar:4}}),6);
assert.equal(t.pendingTotal({totales:{pendientes:0,sigueMal:3}}),0);
assert(html.includes('id="pRawChk"')&&html.includes("localStorage.getItem('vc-pend-raw')==='1'"));
assert(html.includes('— (publicación anterior)'));
