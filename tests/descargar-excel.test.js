/* "Descargar Excel": filas visibles con las columnas de la tabla y CRC nuevo; CRC y FI como texto (24 dígitos, sin notación científica).
   Datos sintéticos. Uso: node tests/descargar-excel.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),zlib=require('zlib'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var T=vm.runInNewContext(cut('const str = ','\n')+'\n'+cut('const COLUMNS=','function filter(){')+cut('function xlsxName(',"$('download-xlsx').onclick")+'\n({COLUMNS,rowValues,xlsxName,xlsxBytes});',{TextEncoder:TextEncoder});

var CRC='000112010020030040010101',FI='150112000000000000000042';
var rows=[
 {tecnico:'ANA',validador:'VAL_CRC',fi:FI,codigo:CRC,crcNuevo:'000112010020030040010102',smz:'01-002-003',piso:'01',estado:'APLICA',resultado:'⚠ SIN CAMBIO EN SICUN',campos:'CON · Área Verificada',obs:'DNI •••• revisar <uso> & "área"',hoja:'no va',nota:'no va'},
 {tecnico:'LUIS',validador:'VAL_TIT',fi:'',codigo:'150110020030040010101999',smz:'02-003-004',piso:'',estado:'NO APLICA',resultado:'ℹ NO APLICA pero SICUN cambió',campos:'',obs:null}
];

// 1) Nombre pendientes_<poligono>_<AAMMDD>.xlsx
assert.strictEqual(T.xlsxName('260210019',new Date(2026,10,5)),'pendientes_260210019_261105.xlsx');

// 2) ZIP válido: cada entrada sin compresión y con CRC-32 correcto
var buf=Buffer.from(T.xlsxBytes(rows)),files={},eocd=buf.length-22;
assert.strictEqual(buf.readUInt32LE(eocd),0x06054b50);
var total=buf.readUInt16LE(eocd+10),p=buf.readUInt32LE(eocd+16);
for(var i=0;i<total;i++){
 assert.strictEqual(buf.readUInt32LE(p),0x02014b50);
 var crc=buf.readUInt32LE(p+16),size=buf.readUInt32LE(p+24),n=buf.readUInt16LE(p+28),local=buf.readUInt32LE(p+42),name=buf.toString('utf8',p+46,p+46+n);
 assert.strictEqual(buf.readUInt32LE(local),0x04034b50);assert.strictEqual(buf.readUInt16LE(local+8),0,'sin compresión');
 var start=local+30+buf.readUInt16LE(local+26)+buf.readUInt16LE(local+28),data=buf.subarray(start,start+size);
 assert.strictEqual(zlib.crc32(data),crc,'CRC-32 de '+name);files[name]=data.toString('utf8');p+=46+n;
}
assert.deepStrictEqual(Object.keys(files).sort(),['[Content_Types].xml','_rels/.rels','xl/_rels/workbook.xml.rels','xl/styles.xml','xl/workbook.xml','xl/worksheets/sheet1.xml']);

// 3) Mismas columnas de la tabla, una fila por fila visible, con CRC nuevo
var sheet=files['xl/worksheets/sheet1.xml'];
var grid=sheet.split('<row ').slice(1).map(function(r){return (r.match(/<c [^>]*>.*?<\/c>/g)||[]).map(function(c){return c.replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');});});
assert.deepStrictEqual(grid[0],['Técnico','Validador','FI','CRC','Sec-Mz-Lt','Piso','Marcó','Resultado SICUN','Campos que cambiaron','Observación','CRC nuevo']);
assert(/<th>Técnico<\/th><th>Validador<\/th><th>FI<\/th><th>CRC<\/th><th>Sec-Mz-Lt<\/th><th>Piso<\/th><th>Marcó<\/th><th>Resultado SICUN<\/th><th>Campos que cambiaron<\/th><th>Observación<\/th><\/tr>/.test(html),'encabezados de la tabla');
assert.strictEqual(grid.length,3);
assert.deepStrictEqual(grid[1],['ANA','VAL_CRC',FI,CRC,'01-002-003','01','APLICA','⚠ SIN CAMBIO EN SICUN','CON · Área Verificada','DNI •••• revisar <uso> & "área"','000112010020030040010102']);
assert.deepStrictEqual(grid[2],['LUIS','VAL_TIT','','150110020030040010101999','02-003-004','','NO APLICA','ℹ NO APLICA pero SICUN cambió','','','']);
assert(sheet.indexOf('no va')<0);

// 4) CRC y FI como texto: 24 dígitos íntegros, ninguna celda numérica, formato @ (numFmtId 49)
assert(sheet.indexOf('<c r="D2" s="1" t="inlineStr"><is><t xml:space="preserve">'+CRC+'</t>')>=0);
assert(sheet.indexOf('<c r="C2" s="1" t="inlineStr"><is><t xml:space="preserve">'+FI+'</t>')>=0);
assert((sheet.match(/<c /g)||[]).length===33&&(sheet.match(/t="inlineStr"/g)||[]).length===33&&sheet.indexOf('<v>')<0,'todas las celdas son texto');
assert(/<cellXfs count="2">.*numFmtId="49"/.test(files['xl/styles.xml']));

// 5) El botón está junto a "Copiar lista" y exporta las filas visibles
assert(/<button id="copy-list" type="button">Copiar lista<\/button><button id="download-xlsx" type="button">Descargar Excel<\/button>/.test(html));
assert(/xlsxBytes\(state\.visible\)/.test(html)&&/xlsxName\(state\.data\.poligono,new Date\(\)\)/.test(html));
console.log('ok Descargar Excel: columnas de la tabla, CRC y FI como texto');
