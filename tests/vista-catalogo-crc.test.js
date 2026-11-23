'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){
 const i=html.indexOf(from),j=html.indexOf(to,i);
 assert(i>=0&&j>i,'no se halló: '+from);
 return html.slice(i,j);
}

function element(tag){
 return {
  tag,dataset:{},style:{},children:[],textContent:'',
  append(...children){this.children.push(...children);},
  replaceChildren(...children){this.textContent='';this.children=children;},
  setAttribute(){},
  focus(){},
  showModal(){this.open=true;}
 };
}
const elements=new Map();
function $(id){
 if(!elements.has(id))elements.set(id,element(id));
 return elements.get(id);
}
const state={data:null};
const copied=[];
const T=vm.runInNewContext([
 cut('const str = value','\nfunction theme('),
 cut('// Copia del catálogo','async function copy('),
 '({catalogFor,filter})'
].join('\n'),{
 document:{createElement:element},$,state,
 route:()=>({tec:''}),updateExcelButton(){},copy:crc=>copied.push(crc)
});

const use=T.catalogFor('020202');
assert(use.title.startsWith('020202 '));
assert.strictEqual(use.entries.find(entry=>entry.code==='4520').description,'Mantenimiento y reparación de vehículos automotores');
assert.strictEqual(T.catalogFor('999999').message,'Uso no encontrado en el catálogo');

const original='000112010020030040010101',changed='000112010020030040010102';
const legacyResult='⚠ SIN CAMBIO EN SICUN (ver catálogo)';
const updated={codigo:original,crcNuevo:changed,catUso:'020202',resultado:legacyResult};
const legacy={codigo:'150110020030040010101999',resultado:legacyResult};
state.data={filas:[updated,legacy]};
$('result').value='pending';
$('validator').value='';

for(const crc of [original,changed]){
 $('search').value=crc;
 T.filter();
 assert.strictEqual(state.visible.length,1);
 assert.strictEqual(state.visible[0],updated);
}
const cells=$('rows').children[0].children;
assert.strictEqual(cells[3].textContent,original);
const notice=cells[3].children[1];
assert.strictEqual(notice.textContent,'🔁 Renombrado → '+changed);
assert.strictEqual(notice.children[0].textContent,'Copiar CRC nuevo');
notice.children[0].onclick();
assert.deepStrictEqual(copied,[changed]);

const catalogButton=cells[7].children[1];
assert.strictEqual(catalogButton.textContent,'(ver catálogo)');
catalogButton.onclick();
assert.strictEqual($('catalog').open,true);
assert.strictEqual($('catalog-results').children.length,use.entries.length);
$('catalog-search').value='REPARACION DE VEHICULOS AUTOMOTORES';
$('catalog-search').oninput();
assert($('catalog-results').children.some(li=>li.textContent.startsWith('4520 · ')));

updated.resultado='⚠ SIN CAMBIO EN SICUN';
updated.catUso='999999';
T.filter();
const fallbackButton=$('rows').children[0].children[7].children[0];
assert.strictEqual(fallbackButton.textContent,'Ver catálogo');
fallbackButton.onclick();
assert.strictEqual($('catalog-status').textContent,'Uso no encontrado en el catálogo');

$('search').value=legacy.codigo;
T.filter();
assert.strictEqual(state.visible[0],legacy);
const oldCells=$('rows').children[0].children;
assert.strictEqual(oldCells[3].textContent,legacy.codigo);
assert.deepStrictEqual(oldCells[3].children.map(child=>child.textContent),['Copiar CRC']);
assert.strictEqual(oldCells[7].textContent,legacyResult);
assert.strictEqual(oldCells[7].children.length,0);

console.log('ok catálogo CIIU, búsqueda y copia del CRC renombrado, y filas antiguas');
