/* "Arreglos en el Word" y "↻ Actualizar": ejecuta el script real de index.html con un DOM mínimo falso (sin navegador).
   Datos sintéticos. Uso: node tests/arreglos-actualizar.test.js */
'use strict';
var fs=require('fs'),os=require('os'),path=require('path'),vm=require('vm'),assert=require('assert'),cp=require('child_process');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
var script=html.match(/<script>([\s\S]*?)<\/script>/)[1];

// 0) node --check sobre el script extraído
var dir=fs.mkdtempSync(path.join(os.tmpdir(),'vc-pend-'));fs.writeFileSync(path.join(dir,'script.js'),script);
var check=cp.spawnSync(process.execPath,['--check',path.join(dir,'script.js')],{encoding:'utf8'});
fs.rmSync(dir,{recursive:true,force:true});
assert.strictEqual(check.status,0,check.stderr);
assert(!/innerHTML/.test(script),'nunca innerHTML');

// ---- DOM mínimo ----
function El(tag){this.tagName=tag.toUpperCase();this.children=[];this._text='';this._value='';this._sel=0;this.hidden=false;this.disabled=false;this.dataset={};this.attrs={};this.className='';this.style={};this.type='';}
El.prototype={
 get textContent(){return this._text+this.children.map(function(c){return typeof c==='string'?c:c.textContent;}).join('');},
 set textContent(v){this._text=String(v);this.children=[];},
 append:function(){for(var i=0;i<arguments.length;i++)this.children.push(arguments[i]);if(this.tagName==='SELECT'&&this._sel<0)this._sel=0;},
 replaceChildren:function(){this.children=[];this._text='';this._sel=0;this.append.apply(this,arguments);},
 add:function(o){this.append(o);},
 remove:function(){},click:function(){if(this.onclick)return this.onclick();},
 setAttribute:function(k,v){this.attrs[k]=String(v);},getAttribute:function(k){return k in this.attrs?this.attrs[k]:null;},
 get options(){return this.children.filter(function(c){return c.tagName==='OPTION';});},
 get value(){if(this.tagName!=='SELECT')return this._value;var o=this.options[this._sel];return o?o._value:'';},
 set value(v){if(this.tagName!=='SELECT'){this._value=String(v);return;}this._sel=this.options.findIndex(function(o){return o._value===String(v);});}
};
function all(el,tag){var out=[];(function walk(e){for(var c of e.children)if(typeof c==='object'){if(c.tagName===tag)out.push(c);walk(c);}})(el);return out;}
function flush(){return new Promise(function(r){setImmediate(r);}).then(function(){return new Promise(function(r){setImmediate(r);});});}

function page(opts){
 opts=opts||{};var els={},listeners={},urls=[],clip=[],store=Object.assign({},opts.storage||{});
 var re=/<(\w+)([^>]*?)\sid="([^"]+)"([^>]*)>/g,m;
 while((m=re.exec(html))){
  if(m[3]==='rows'&&els.rows)continue;
  var e=new El(m[1]);e.hidden=/\shidden(\s|$)/.test(m[2]+' '+m[4]);els[m[3]]=e;
  if(m[1]==='select'){var inner=html.slice(re.lastIndex,html.indexOf('</select>',re.lastIndex)),o,ro=/<option value="([^"]*)">([^<]*)/g;while((o=ro.exec(inner))){var op=new El('option');op._value=o[1];op.textContent=o[2];e.append(op);}}
 }
 var loc={pathname:'/',search:'',_hash:opts.hash||''};
 Object.defineProperty(loc,'hash',{get:function(){return this._hash?'#'+this._hash:'';},set:function(v){this._hash=String(v).replace(/^#/,'');setImmediate(function(){(listeners.hashchange||[]).forEach(function(f){f();});});}});
 var ctx={
  document:{getElementById:function(id){return els[id]||null;},createElement:function(t){return new El(t);},documentElement:{dataset:{}},body:new El('body')},
  location:loc,history:{replaceState:function(a,b,url){loc._hash=String(url).split('#')[1]||'';}},
  window:{addEventListener:function(t,f){(listeners[t]=listeners[t]||[]).push(f);}},
  localStorage:{getItem:function(k){return k in store?store[k]:null;},setItem:function(k,v){store[k]=String(v);}},
  matchMedia:function(){return {matches:false};},navigator:{clipboard:{writeText:function(t){clip.push(t);return Promise.resolve();}}},
  Option:function(text,value){var o=new El('option');o.textContent=text;o._value=value;return o;},
  fetch:function(url){urls.push(new URL(String(url)));return opts.fetch(new URL(String(url)));},
  URL:URL,URLSearchParams:URLSearchParams,AbortController:AbortController,setTimeout:setTimeout,clearTimeout:clearTimeout,TextEncoder:TextEncoder,Date:Date,console:console
 };
 ctx.window.addEventListener=ctx.window.addEventListener;
 vm.createContext(ctx);vm.runInContext(script.replace("window.addEventListener('hashchange',load);load();","window.addEventListener('hashchange',load);load();globalThis.__t={state,refresh,load};"),ctx);
 return {els:els,urls:urls,clip:clip,store:store,ctx:ctx,t:ctx.__t,go:function(h){loc.hash=h;}};
}
function json(body){return Promise.resolve({ok:true,status:200,json:function(){return Promise.resolve(JSON.parse(JSON.stringify(body)));}});}
function deferred(){var d={};d.promise=new Promise(function(r,j){d.resolve=r;d.reject=j;});return d;}
function text(rows){return all(rows,'TR').map(function(tr){return all(tr,'TD').map(function(td){return td.textContent;});});}

var POL='999000001',CRC1='999000000000000000000001',CRC2='999000000000000000000002';
function fila(o){return Object.assign({poligono:POL,tecnico:'ANA',validador:'VAL_A',fi:'',codigo:CRC1,smz:'01-001-001',piso:'01',estado:'APLICA',resultado:'sinCambio',campos:'',obs:''},o);}
function detalle(o){return Object.assign({poligono:POL,publicado:'17/11/2026 10:00',antes:'01/11/2026',despues:'15/11/2026',totales:{},filas:[fila(),fila({tecnico:'LUIS',validador:'VAL_B',codigo:CRC2})]},o);}
var ARREGLOS={revisado:'17/11/2026 09:30',items:[
 {seccion:'Titulares',crc:CRC1,que:'Corregir DNI <b>sintético</b> & "x"'},
 {seccion:'Construcciones',crc:CRC2,que:'Quitar fila duplicada'},
 {seccion:'Obras',crc:CRC1,que:''}
]};

(async function(){
 // 1) Tarjeta con arreglos: Revisado, Sección · CRC · Qué hacer, CRC en mono, texto literal, Copiar CRC (sin repetir)
 var p=page({hash:'pol='+POL,fetch:function(){return json(detalle({arreglos:ARREGLOS}));}});await flush();
 var E=p.els;assert.strictEqual(E.detail.hidden,false);assert.strictEqual(E.arreglos.hidden,false);
 assert.strictEqual(E['arreglos-revisado'].textContent,'Revisado 17/11/2026 09:30');
 assert.deepStrictEqual(text(E['arreglos-rows']),[['Titulares',CRC1,'Corregir DNI <b>sintético</b> & "x"'],['Construcciones',CRC2,'Quitar fila duplicada'],['Obras',CRC1,'—']]);
 var tds=all(E['arreglos-rows'],'TD');assert.strictEqual(tds[1].className,'mono');assert.strictEqual(tds[1].dataset.label,'CRC');assert.strictEqual(all(tds[2],'B').length,0,'sin HTML interpretado');
 assert(/Se arregla a mano en el Word; desaparece al volver a pasar Revisar Word\./.test(html));
 assert(html.indexOf('id="arreglos"')<html.indexOf('<div class="table-wrap"><table><thead><tr><th>Técnico</th>'),'arriba de la tabla de pendientes');
 await E['copy-arreglos'].click();assert.deepStrictEqual(p.clip,[CRC1+'\n'+CRC2]);assert.strictEqual(E['arreglos-status'].textContent,'Copiado al portapapeles.');
 assert.strictEqual(text(E.rows).length,2,'la tabla de pendientes sigue igual');

 // 2) Sin arreglos (null, ausente/API vieja, vacío, sin items) → sin tarjeta y sin error
 for(var a of [null,undefined,{revisado:'x',items:[]},{revisado:'x'},{items:'no'}]){
  var d=detalle();if(a!==undefined)d.arreglos=a;
  var q=page({hash:'pol='+POL,fetch:function(){return json(d);}});await flush();
  assert.strictEqual(q.els.detail.hidden,false);assert.strictEqual(q.els.arreglos.hidden,true,JSON.stringify(a));
  assert.strictEqual(text(q.els['arreglos-rows']).length,0);assert.strictEqual(text(q.els.rows).length,2);
 }

 // 3) filas:[] + arreglos → tarjeta visible y tabla de pendientes vacía sin error
 var r=page({hash:'pol='+POL,fetch:function(){return json(detalle({filas:[],arreglos:ARREGLOS}));}});await flush();
 assert.strictEqual(r.els.detail.hidden,false);assert.strictEqual(r.els.arreglos.hidden,false);assert.strictEqual(text(r.els['arreglos-rows']).length,3);
 assert.strictEqual(text(r.els.rows).length,0);assert.strictEqual(r.els.empty.hidden,false);assert.strictEqual(r.els.count.textContent,'0 filas');assert.strictEqual(r.els.message.hidden,true);

 // 4) Portada: "🛠 N arreglos en el Word" solo si arreglos > 0; sin campo no se muestra nada
 var lista=[{poligono:'999000001',arreglos:3},{poligono:'999000002',arreglos:1},{poligono:'999000003'},{poligono:'999000004',arreglos:0}];
 var h=page({fetch:function(){return json(lista);}});await flush();
 var cards=h.els.polygons.children.map(function(c){return all(c,'P').map(function(x){return x.textContent;}).filter(function(x){return x.indexOf('🛠')>=0;});});
 assert.deepStrictEqual(cards,[['🛠 3 arreglos en el Word'],['🛠 1 arreglo en el Word'],[],[]]);

 // 5) Actualizar en detalle: fetch forzado con _=, botón ocupado, "Leído HH:MM", conserva técnico, resultado, validador y búsqueda
 var version=1,pend=null;
 var u=page({hash:'pol='+POL+'&tec=ANA',fetch:function(url){if(pend)return pend.promise;return json(detalle(version===1?{}:{arreglos:ARREGLOS,filas:[fila(),fila({codigo:CRC2,resultado:'verificado'}),fila({tecnico:'LUIS',validador:'VAL_B'})]}));}});await flush();
 E=u.els;E.result.value='all';E.validator.value='VAL_A';E.search.value='0000';E.result.onchange();
 assert.strictEqual(text(E.rows).length,1);assert.strictEqual(E.arreglos.hidden,true);
 version=2;pend=deferred();var run=u.t.refresh();
 assert.strictEqual(E.refresh.disabled,true);assert.strictEqual(E.refresh.textContent,'Actualizando…');
 u.t.refresh();E.refresh.click();assert.strictEqual(u.urls.length,2,'no se dispara doble');
 var last=u.urls[1];assert.strictEqual(last.searchParams.get('api'),'pendientes');assert.strictEqual(last.searchParams.get('pol'),POL);assert(/^\d{13}$/.test(last.searchParams.get('_')),'_=<timestamp>');
 assert.strictEqual(u.urls[0].searchParams.get('_'),null,'la carga normal no cambia');
 pend.resolve({ok:true,status:200,json:function(){return Promise.resolve(detalle({arreglos:ARREGLOS,filas:[fila(),fila({codigo:CRC2,resultado:'verificado'}),fila({tecnico:'LUIS',validador:'VAL_B'})]}));}});pend=null;await run;
 assert.strictEqual(E.refresh.disabled,false);assert.strictEqual(E.refresh.textContent,'↻ Actualizar');
 assert(/^Leído \d\d:\d\d$/.test(E['refresh-status'].textContent),E['refresh-status'].textContent);
 assert.strictEqual(u.ctx.location.hash,'#pol='+POL+'&tec=ANA');assert.strictEqual(E.result.value,'all');assert.strictEqual(E.validator.value,'VAL_A');assert.strictEqual(E.search.value,'0000');
 assert.strictEqual(text(E.rows).length,2,'datos nuevos con los filtros conservados');assert.strictEqual(E.arreglos.hidden,false);
 assert.strictEqual(u.t.state.data.filas.length,3);
 // técnico y validador que ya no existen se descartan; resultado y búsqueda se mantienen
 u.ctx.fetch=function(url){u.urls.push(url);return json(detalle({filas:[fila({tecnico:'LUIS',validador:'VAL_B'})]}));};
 await u.t.refresh();
 assert.strictEqual(u.ctx.location.hash,'#pol='+POL);assert.strictEqual(E.validator.value,'');assert.strictEqual(E.result.value,'all');assert.strictEqual(E.search.value,'0000');assert.strictEqual(E.arreglos.hidden,true);

 // 6) Si falla: se mantienen los datos visibles y el error va en el status
 var before=u.t.state.data;u.ctx.fetch=function(){return Promise.resolve({ok:false,status:500,json:function(){return Promise.resolve({});}});};
 await u.t.refresh();
 assert.strictEqual(u.t.state.data,before);assert.strictEqual(E.detail.hidden,false);assert.strictEqual(text(E.rows).length,1);
 assert.strictEqual(E['refresh-status'].textContent,'No se pudo actualizar (HTTP 500). Se mantienen los datos anteriores.');assert(/brick/.test(E['refresh-status'].className));
 assert.strictEqual(E.refresh.disabled,false);
 u.ctx.fetch=function(){return Promise.reject(new TypeError('Failed to fetch'));};await u.t.refresh();
 assert.strictEqual(E['refresh-status'].textContent,'No se pudo actualizar (sin conexión con la API). Se mantienen los datos anteriores.');assert.strictEqual(E.message.hidden,true);

 // 7) Respuestas cruzadas: si se navega mientras actualiza, la respuesta vieja se descarta
 var slow=deferred(),OTRO='999000002';
 u.ctx.fetch=function(url){return url.searchParams.get('_')?slow.promise:json(detalle({poligono:OTRO,filas:[fila({poligono:OTRO})]}));};
 var late=u.t.refresh();u.go('pol='+OTRO);await flush();
 assert.strictEqual(u.els.polygon.textContent,OTRO);
 slow.resolve({ok:true,status:200,json:function(){return Promise.resolve(detalle({arreglos:ARREGLOS}));}});await late;
 assert.strictEqual(u.els.polygon.textContent,OTRO);assert.strictEqual(u.t.state.data.poligono,OTRO);assert.strictEqual(E.arreglos.hidden,true);assert.strictEqual(E['refresh-status'].textContent,'');
 assert.strictEqual(E.refresh.disabled,false);

 // 8) Actualizar en portada conserva distrito, búsqueda y orden (vc-pend-filters) y refresca los polígonos
 var n=0,home=page({storage:{'vc-pend-filters':JSON.stringify({district:'',search:'9990',order:'pending'})},fetch:function(){n++;return json(n===1?lista:lista.concat({poligono:'999000005',arreglos:2}));}});await flush();
 E=home.els;assert.strictEqual(E.polygons.children.length,4);
 await home.t.refresh();
 assert.strictEqual(E['polygon-search'].value,'9990');assert.strictEqual(E['polygon-order'].value,'pending');assert.strictEqual(E.district.value,'');
 assert.strictEqual(E.polygons.children.length,5);assert.strictEqual(E['polygon-count'].textContent,'5 de 5 polígonos');assert(/^Leído \d\d:\d\d$/.test(E['refresh-status'].textContent));
 assert.strictEqual(JSON.parse(home.store['vc-pend-filters']).search,'9990');
 home.ctx.fetch=function(){return Promise.reject(new Error('x'));};await home.t.refresh();
 assert.strictEqual(E.home.hidden,false);assert.strictEqual(E.polygons.children.length,5);assert(/^No se pudo actualizar/.test(E['refresh-status'].textContent));

 // 9) El botón está en la cabecera junto al de tema
 assert(/<button id="refresh" type="button">↻ Actualizar<\/button><button id="theme"/.test(html));
 console.log('ok Arreglos en el Word y ↻ Actualizar');
})().catch(function(e){console.error(e);process.exit(1);});
