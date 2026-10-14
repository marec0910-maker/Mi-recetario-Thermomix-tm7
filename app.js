'use strict';
const CATEGORIES = ['Desayunos', 'Comidas', 'Cenas', 'Panes', 'Postres'];
const KEY = 'mi-recetario-tm7-v1';
const examples = [
 {id:'demo-avena',title:'Avena cremosa con fruta',category:'Desayunos',minutes:15,servings:2,description:'Un desayuno suave para empezar el día con calma.',ingredients:['80 g de copos de avena','300 ml de leche o bebida vegetal','1 plátano','Fruta fresca al gusto'],steps:['Reúne y pesa los ingredientes.','Cocina la avena con la leche en un cazo, removiendo hasta que esté cremosa. Sigue las indicaciones del envase.','Reparte en dos cuencos y añade el plátano y la fruta lavada.'],photo:'',favorite:false,demo:true},
 {id:'demo-crema',title:'Crema de verduras de temporada',category:'Comidas',minutes:35,servings:4,description:'Una idea reconfortante, sencilla y llena de color.',ingredients:['500 g de verduras de temporada','1 patata mediana','700 ml de agua o caldo','1 cucharada de aceite de oliva'],steps:['Lava, pela y corta las verduras y la patata.','Cocina en una olla con el caldo hasta que estén tiernas.','Deja templar antes de triturar con un utensilio adecuado. Ajusta la textura con más caldo y añade el aceite.'],photo:'',favorite:false,demo:true},
 {id:'demo-pan',title:'Pan casero para compartir',category:'Panes',minutes:180,servings:6,description:'El placer de una mesa con pan recién hecho.',ingredients:['500 g de harina de fuerza','320 ml de agua','7 g de levadura seca de panadería','10 g de sal'],steps:['Mezcla los ingredientes y amasa hasta obtener una masa homogénea.','Deja reposar tapada hasta que aumente de volumen.','Forma el pan y deja levar de nuevo.','Hornea en un horno precalentado a 220 °C hasta que esté cocido, aproximadamente 30–35 minutos. Deja enfriar en una rejilla.'],photo:'',favorite:false,demo:true}
];
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let recipes=[], category='Todas', favorites=false, editing=null, photo='', deleting=null, reading=null, photoBusy=false, photoGeneration=0;
function say(text){$('#message').textContent=text;clearTimeout(say.timer);say.timer=setTimeout(()=>$('#message').textContent='',6500);}
function valid(r){return r && typeof r.id==='string' && r.id.length>0 && typeof r.title==='string' && r.title.trim().length>0 && r.title.length<=100 && CATEGORIES.includes(r.category) && Number.isInteger(r.minutes) && r.minutes>=1 && r.minutes<=1440 && Number.isInteger(r.servings) && r.servings>=1 && r.servings<=100 && typeof r.description==='string' && r.description.length<=500 && ['ingredients','steps'].every(k=>Array.isArray(r[k])&&r[k].length>0&&r[k].every(x=>typeof x==='string'&&x.trim()&&x.length<=15000)) && typeof r.favorite==='boolean' && typeof r.demo==='boolean' && typeof r.photo==='string' && (r.photo==='' || /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(r.photo)) && r.photo.length<=1500000;}
let database=null, saving=false, storageReady=false;
function openStorage(){return new Promise((resolve,reject)=>{
  const request=indexedDB.open('mi-recetario-tm7',1);
  let finished=false;
  const timer=setTimeout(()=>fail(new Error('Tiempo de espera agotado')),10000);
  function fail(error){if(finished)return;finished=true;clearTimeout(timer);reject(error);}
  request.onupgradeneeded=()=>request.result.createObjectStore('recetario');
  request.onerror=()=>fail(request.error);
  request.onblocked=()=>fail(new Error('Cierra otras pestañas del recetario'));
  request.onsuccess=()=>{
    if(finished){request.result.close();return;}
    finished=true;clearTimeout(timer);
    const db=request.result;
    db.onversionchange=()=>{db.close();storageReady=false;say('Vuelve a abrir el recetario para continuar.');};
    resolve(db);
  };
});}
function storageTransaction(mode,value){return new Promise((resolve,reject)=>{
  const tx=database.transaction('recetario',mode);
  const store=tx.objectStore('recetario');
  const request=mode==='readonly'?store.get(KEY):store.put(value,KEY);
  tx.oncomplete=()=>resolve(request.result);
  tx.onabort=()=>reject(tx.error||request.error||new Error('No se pudo guardar'));
  tx.onerror=()=>{};
});}
async function persist(next){
  if(!storageReady||saving)return false;
  saving=true;
  $('#save').disabled=true;
  try{await storageTransaction('readwrite',next);recipes=next;render();return true;}
  catch(e){say('No se pudo guardar. Conserva el formulario y exporta una copia de tus recetas.');return false;}
  finally{saving=false;$('#save').disabled=photoBusy;}
}
async function loadRecipes(){
  $('main').inert=true;$('#add').disabled=true;
  $('#message').textContent='Abriendo tu recetario…';
  try{
    database=await openStorage();
    let data=await storageTransaction('readonly');
    if(data===undefined){
      const saved=localStorage.getItem(KEY);
      data=saved===null?structuredClone(examples):JSON.parse(saved);
      if(!Array.isArray(data)||!data.every(valid)||new Set(data.map(r=>r.id)).size!==data.length)throw Error();
      // Copy the old collection atomically. Keep the original as a recovery copy.
      await storageTransaction('readwrite',data);
    }
    if(!Array.isArray(data)||!data.every(valid)||new Set(data.map(r=>r.id)).size!==data.length)throw Error();
    recipes=data;storageReady=true;render();
    $('main').inert=false;$('#add').disabled=false;$('#message').textContent='';
  }catch(e){$('#message').textContent='No se pudo abrir el almacenamiento. Tus datos no se han sobrescrito. Cierra otras pestañas del recetario y vuelve a intentarlo.';}
}
function render(){ $('#categories').innerHTML=['Todas',...CATEGORIES].map(c=>`<button aria-pressed="${c===category}" data-category="${c}">${c}</button>`).join('');$('#favorites').setAttribute('aria-pressed',favorites);const q=$('#search').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();const list=recipes.filter(r=>(category==='Todas'||r.category===category)&&(!favorites||r.favorite)&&[r.title,r.description,...r.ingredients].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));$('#count').textContent=`${list.length} ${list.length===1?'receta':'recetas'}`;$('#empty').hidden=!!list.length;$('#cards').innerHTML=list.map(r=>`<article class="card">${r.photo?`<img class="card-photo" src="${esc(r.photo)}" alt="${esc(r.title)}">`:`<div class="placeholder" aria-hidden="true">${{Desayunos:'☀',Comidas:'♧',Cenas:'☾',Panes:'♨',Postres:'✧'}[r.category]}</div>`}<button class="heart" data-favorite="${esc(r.id)}" aria-label="${r.favorite?'Quitar de':'Añadir a'} favoritas: ${esc(r.title)}" aria-pressed="${r.favorite}">${r.favorite?'♥':'♡'}</button><div class="card-content"><span class="tag">${r.category}</span><h3>${esc(r.title)}</h3>${r.demo?'<span class="demo">RECETA DEMOSTRATIVA</span>':''}<p>${esc(r.description)}</p><p>${r.minutes} min · ${r.servings} raciones</p><button class="open secondary" data-open="${esc(r.id)}">Ver receta →</button></div></article>`).join('');}
function showDetail(id){const r=recipes.find(r=>r.id===id);if(!r)return;reading=id;$('#detail-body').innerHTML=`${r.photo?`<img class="detail-photo" src="${esc(r.photo)}" alt="${esc(r.title)}">`:''}<p class="eyebrow">${r.category}</p><h2 id="detail-title">${esc(r.title)}</h2><p>${esc(r.description)}</p><p class="detail-meta">${r.minutes} minutos · ${r.servings} raciones</p>${r.demo?'<p class="notice"><strong>Ejemplo demostrativo.</strong> No es una receta oficial ni validada para la TM7. Los pasos ilustran el recetario y usan métodos convencionales; consulta el manual y recetas verificadas antes de utilizar el equipo.</p>':''}<h3 class="detail-section">Ingredientes</h3><ul class="ingredients">${r.ingredients.map(i=>`<li>${esc(i)}</li>`).join('')}</ul><h3 class="detail-section">Preparación paso a paso</h3><ol class="steps">${r.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="form-actions"><button class="secondary" id="adapt-current">Adaptar a TM7</button><button class="secondary" id="edit-current">Editar</button><button class="secondary" id="delete-current">Eliminar</button></div>`;if(!$('#detail').open)$('#detail').showModal();}
function showAdapt(id){
  const r=recipes.find(x=>x.id===id);if(!r)return;
  const prompt=[
    'Adapta esta receta casera para Thermomix TM7, respetando su sabor y sus ingredientes:',
    '', 'Nombre: '+r.title,'Raciones: '+r.servings,'Tiempo original: '+r.minutes+' minutos',
    'Descripción: '+r.description,
    '', 'Ingredientes:',...r.ingredients.map(x=>'- '+x),
    '', 'Preparación original:',...r.steps.map((x,i)=>(i+1)+'. '+x),
    '', 'Propón instrucciones claras con cantidades, tiempos, temperaturas, velocidades y modos únicamente cuando sean adecuados y estén dentro de los límites de la TM7.',
    'No inventes funciones del equipo ni asegures que la receta esté probada u oficialmente validada.',
    'Si el volumen, los huesos o el tipo de alimento no permiten cocinar todo en el vaso, explica qué parte preparar fuera de la Thermomix.',
    'Incluye precauciones relevantes (capacidad, salpicaduras, vapor y cocción completa de carnes).',
    'Entrégame una versión fácil de copiar al recetario, conservando la receta original. Señala lo que debo comprobar antes de cocinar.'
  ].join('\n');
  $('#adapt-text').value=prompt;
  $('#adapt-status').textContent='Copia el texto y pégalo en ChatGPT. La receta original no cambiará.';
  $('#adapt-dialog').showModal();
}
$('#adapt-copy').onclick=async()=>{
  const field=$('#adapt-text');
  try{await navigator.clipboard.writeText(field.value);$('#adapt-status').textContent='Texto copiado. Abre ChatGPT y pégalo para pedir la adaptación.';}
  catch(e){field.focus();field.select();$('#adapt-status').textContent='Seleccioné el texto. En el iPad toca Copiar, abre ChatGPT y pégalo.';}
};
function photoPreview(){ $('#photo-preview').hidden=!photo;$('#photo-preview').src=photo;}
function edit(id=null){editing=id;photoGeneration++;const r=recipes.find(r=>r.id===id);const f=$('#recipe-form');f.reset();$('#form-error').textContent='';$('#editor-title').textContent=r?'Editar receta':'Nueva receta';$('#save').disabled=false;photoBusy=false;photo=r?.photo||'';photoPreview();if(r){for(const k of ['title','category','minutes','servings','description'])f.elements[k].value=r[k];for(const k of ['ingredients','steps'])f.elements[k].value=r[k].join('\n');}$('#editor').showModal();}
$('#recipe-form select').innerHTML=CATEGORIES.map(c=>`<option>${c}</option>`).join('');
$('#add').onclick=()=>{if(storageReady&&!saving)edit();};$('#search').oninput=render;$('#favorites').onclick=()=>{favorites=!favorites;render();};
$('#categories').onclick=e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;render();}};
$('#cards').onclick=async e=>{const b=e.target.closest('button');if(!b||saving)return;if(b.dataset.open)showDetail(b.dataset.open);if(b.dataset.favorite){const next=recipes.map(r=>r.id===b.dataset.favorite?{...r,favorite:!r.favorite}:r);await persist(next);}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-close]');if(b)$('#'+b.dataset.close).close();if(e.target.id==='adapt-current'){showAdapt(reading);}if(e.target.id==='edit-current'&&!saving){const id=reading;$('#detail').close();edit(id);}if(e.target.id==='delete-current'){deleting=reading;$('#confirm').showModal();}});
$('#delete-confirm').onclick=async()=>{if(await persist(recipes.filter(r=>r.id!==deleting))){$('#confirm').close();$('#detail').close();say('Receta eliminada.');}};
$('#recipe-form').onsubmit=async e=>{e.preventDefault();if(photoBusy||saving)return;const f=e.target;const lines=k=>f.elements[k].value.split('\n').map(s=>s.trim()).filter(Boolean);const prev=recipes.find(r=>r.id===editing);const r={id:editing||crypto.randomUUID?.()||`receta-${Date.now()}-${Math.random().toString(36).slice(2)}`,title:f.elements.title.value.trim(),category:f.elements.category.value,minutes:Number(f.elements.minutes.value),servings:Number(f.elements.servings.value),description:f.elements.description.value.trim(),ingredients:lines('ingredients'),steps:lines('steps'),photo,favorite:prev?.favorite||false,demo:prev?.demo||false};if(!valid(r)){$('#form-error').textContent='Escribe un nombre, al menos un ingrediente y un paso, y revisa tiempo y raciones.';return;}if(await persist(editing?recipes.map(x=>x.id===editing?r:x):[r,...recipes])){$('#editor').close();say('Receta guardada en este dispositivo.');}else{$('#form-error').textContent='No se pudo guardar. El espacio puede estar lleno o bloqueado. Conserva este formulario. Exporta una copia y comprueba el espacio disponible en tu dispositivo.';}};
$('#photo').onchange=async e=>{if(saving)return;const file=e.target.files[0];if(!file)return;const generation=++photoGeneration;photoBusy=true;$('#save').disabled=true;$('#form-error').textContent='Procesando fotografía…';let url;try{if(!file.type.startsWith('image/')||file.size>20000000)throw Error();url=URL.createObjectURL(file);const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,1000/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',.78);if(data.length>1500000)throw Error();if(generation===photoGeneration){photo=data;photoPreview();$('#form-error').textContent='';}}catch(err){if(generation===photoGeneration)$('#form-error').textContent='No se pudo abrir la foto. Prueba una imagen JPEG o PNG de menos de 20 MB.';}finally{if(url)URL.revokeObjectURL(url);if(generation===photoGeneration){photoBusy=false;$('#save').disabled=false;}}};
$('#remove-photo').onclick=()=>{if(saving)return;photoGeneration++;photoBusy=false;$('#save').disabled=false;photo='';$('#photo').value='';$('#form-error').textContent='';photoPreview();};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,recipes},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mi-recetario-copia.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);say('Copia preparada. Guárdala en Archivos para conservarla.');};
$('#import').onchange=async e=>{if(saving||!storageReady)return;const file=e.target.files[0];if(!file)return;try{if(file.size>20000000)throw Error();const data=JSON.parse(await file.text());if(data.version!==1||!Array.isArray(data.recipes)||!data.recipes.every(valid)||new Set(data.recipes.map(r=>r.id)).size!==data.recipes.length)throw Error();const next=[...recipes];for(const r of data.recipes){const existing=next.find(x=>x.id===r.id);if(!existing)next.push(r);else if(JSON.stringify(existing)!==JSON.stringify(r))next.push({...r,id:`import-${Date.now()}-${Math.random().toString(36).slice(2)}`});}if(await persist(next))say('Copia importada. Se han conservado las recetas existentes.');}catch(err){say('La copia no es válida. No se ha cambiado tu recetario.');}finally{e.target.value='';}};
loadRecipes();
