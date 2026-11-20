/* "◐ Cambió otra unidad del lote" (totales.otraUnidad): dato aparte en la tarjeta y en el detalle; sus filas SÍ salen en la vista por defecto y en los chips,
   pero NO suman a pendingTotal ni a "SICUN confirma".
   Publicaciones viejas (sin totales.otraUnidad) no muestran nada. Datos sintéticos (solo conteos). Uso: node tests/otra-unidad.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var T=vm.runInNewContext([cut('const str = value','\nfunction node('),cut('function number(value){','\n'),cut('function confirma(t){','\n'),cut('const pendingTotal=','\n'),cut('function otraUnidadTexto(t){','\n')].join('\n')+
  '\n({category,pending,number,confirma,pendingTotal,otraUnidadTexto});');
var U2='150112350070090101020017';
function tot(o){return Object.assign({filas:100,verificado:40,otroCampo:5,sinCambio:30,noEncontrado:6,invalido:4,noAplicaConCambio:15},o);}

// 1) Categoría propia (con el detalle que publica el comparador y con la clave); entra en la vista "Pendientes de atención" y en los chips
['◐ Cambió otra unidad del lote · '+U2+' (UA · Condición del Titular)','◐ Cambió otra unidad del lote · Posible renumeración: '+U2,'◐ CAMBIÓ OTRA UNIDAD DEL LOTE','otraUnidad'].forEach(function(r){
  assert.strictEqual(T.category({resultado:r,estado:'APLICA'}),'otraUnidad',r);assert.strictEqual(T.pending({resultado:r,estado:'APLICA'}),true,r);});
// las demás categorías no cambian (✔ sigue fuera de pendientes)
assert.strictEqual(T.pending({resultado:'✔ VERIFICADO',estado:'APLICA'}),false);
[['⚠ SIN CAMBIO EN SICUN','sinCambio'],['ℹ NO APLICA pero SICUN cambió','noAplica'],['◐ Cambió otro campo, no el observado','otroCampo'],['✔ VERIFICADO','verificado']].forEach(function(c){assert.strictEqual(T.category({resultado:c[0],estado:'APLICA'}),c[1],c[0]);});

// 2) Aunque se liste, no suma a pendingTotal (número de la tarjeta) ni a SICUN confirma
assert.strictEqual(T.pendingTotal({totales:tot({otraUnidad:7})}),T.pendingTotal({totales:tot()}));assert.strictEqual(T.pendingTotal({totales:tot()}),45);
assert.strictEqual(T.confirma(tot({otraUnidad:7})),T.confirma(tot()));assert.strictEqual(T.confirma(tot()),'44%');

// 3) Publicación vieja (sin otraUnidad) o en 0 → nada; con N → texto aparte en el detalle
assert.strictEqual(T.otraUnidadTexto(tot()),'');assert.strictEqual(T.otraUnidadTexto({otraUnidad:0}),'');assert.strictEqual(T.otraUnidadTexto(undefined),'');
assert(/^ ◐ 3 otra unidad del lote = /.test(T.otraUnidadTexto(tot({otraUnidad:3}))));

// 4) Tarjeta: "◐ N otra unidad del lote" solo si N > 0, fuera del número de Pendientes; filtro y color propios en el detalle
assert(/const u=number\(t\.otraUnidad\);if\(u\)card\.append\(node\('p',`◐ \$\{u\} otra unidad del lote`,'ochre small'\)\)/.test(html));
assert(/<option value="otraUnidad">◐ Cambió otra unidad del lote<\/option>/.test(html));assert(/otraUnidad:'ochre'/.test(html));
assert(/\+otraUnidadTexto\(data\.totales\);/.test(html));
// chips y vista por defecto usan pending()
assert(/&&pending\(r\)\)\.length/.test(html),'chips cuentan con pending()');assert(/result==='pending'\?pending\(r\)/.test(html),'vista por defecto usa pending()');
console.log('ok otra unidad del lote: en la vista por defecto y chips, fuera de pendingTotal y SICUN confirma, filtro propio, nada en publicaciones viejas');
