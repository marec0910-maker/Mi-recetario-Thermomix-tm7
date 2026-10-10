const {test,expect}=require('@playwright/test');
const path=require('path');
const KEY='mi-recetario-tm7-v1';
async function fill(page,title='Mi receta de prueba'){
 await page.getByRole('button',{name:'＋ Nueva receta'}).click();
 await page.getByLabel('Nombre de la receta').fill(title);
 await page.getByLabel('Ingredientes', {exact:false}).fill('200 g de harina\n100 ml de agua');
 await page.getByLabel('Preparación paso a paso', {exact:false}).fill('Mezclar los ingredientes.\nServir.');
}
test.beforeEach(async({page})=>{await page.goto('/');});
test('ejemplos, filtros, búsqueda sin acentos y favoritas persistentes',async({page})=>{
 await expect(page.locator('.card')).toHaveCount(3);
 await expect(page.locator('.demo')).toHaveCount(3);
 await page.locator('#search').fill('platano');await expect(page.locator('.card')).toHaveCount(1);
 await page.locator('#search').fill('');await page.getByRole('button',{name:'Postres',exact:true}).click();await expect(page.locator('#empty')).toBeVisible();
 await page.getByRole('button',{name:'Todas',exact:true}).click();await page.getByRole('button',{name:'Añadir a favoritas: Avena cremosa con fruta',exact:true}).click();
 await page.getByRole('button',{name:'♡ Favoritas',exact:true}).click();await expect(page.locator('.card')).toHaveCount(1);
 await page.reload();await page.getByRole('button',{name:'♡ Favoritas',exact:true}).click();await expect(page.locator('.card')).toHaveCount(1);
});
test('crear con fotografía, editar, recargar y confirmar eliminación',async({page})=>{
 await fill(page);await page.locator('#photo').setInputFiles(path.join(__dirname,'../assets/cafe.png'));await expect(page.locator('#save')).toBeEnabled();await page.getByRole('button',{name:'Guardar receta',exact:true}).click();
 let card=page.locator('.card').filter({has:page.getByRole('heading',{name:'Mi receta de prueba',exact:true})});await expect(card.locator('img')).toBeVisible();
 await page.reload();await card.getByRole('button',{name:'Ver receta →'}).click();await expect(page.locator('#detail .ingredients li')).toHaveCount(2);await expect(page.locator('#detail .steps li')).toHaveCount(2);
 await page.getByRole('button',{name:'Editar',exact:true}).click();await page.getByLabel('Nombre de la receta').fill('Mi receta editada');await page.getByLabel('Categoría',{exact:true}).selectOption('Cenas');await page.getByRole('button',{name:'Guardar receta',exact:true}).click();
 await page.reload();card=page.locator('.card').filter({has:page.getByRole('heading',{name:'Mi receta editada',exact:true})});await expect(card).toBeVisible();await card.getByRole('button',{name:'Ver receta →'}).click();await page.getByRole('button',{name:'Eliminar',exact:true}).click();await page.locator('#confirm').getByRole('button',{name:'Cancelar',exact:true}).click();await expect(page.locator('#detail')).toBeVisible();await page.getByRole('button',{name:'Eliminar',exact:true}).click();await page.getByRole('button',{name:'Eliminar receta',exact:true}).click();await page.reload();await expect(page.locator('.card')).toHaveCount(3);
});
test('exportar e importar restaura datos y rechaza copias inválidas',async({page})=>{
 await fill(page,'Receta para copia');await page.getByRole('button',{name:'Guardar receta',exact:true}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar copia'}).click();const download=await downloadPromise;const file=await download.path();
 await page.evaluate(key=>localStorage.setItem(key,'[]'),KEY);await page.reload();await expect(page.locator('.card')).toHaveCount(0);await page.locator('#import').setInputFiles(file);await expect(page.locator('.card')).toHaveCount(4);await page.locator('#import').setInputFiles(file);await expect(page.locator('.card')).toHaveCount(4);
 await page.locator('#import').setInputFiles({name:'invalido.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"recipes":[{}]}')});await expect(page.getByRole('status')).toContainText('no es válida');await expect(page.locator('.card')).toHaveCount(4);
});
test('contenido de usuario se presenta como texto, sin ejecutar HTML',async({page})=>{
 await fill(page,'<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'Guardar receta',exact:true}).click();await expect(page.getByRole('heading',{name:'<img src=x onerror=alert(1)>',exact:true})).toBeVisible();await expect(page.locator('.card h3 img')).toHaveCount(0);
});
test('un fallo de almacenamiento conserva los datos y muestra aviso',async({page})=>{
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Lleno','QuotaExceededError');};});await fill(page);await page.getByRole('button',{name:'Guardar receta',exact:true}).click();await expect(page.getByRole('status')).toContainText('No se pudo guardar');await expect(page.locator('#editor')).toBeVisible();await expect(page.locator('#form-error')).toContainText('No se pudo guardar');await page.reload();await expect(page.locator('.card')).toHaveCount(3);
});
test('diseño sin desbordamiento en iPad y móvil, sin errores de ejecución',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));await page.reload();for(const size of [{width:820,height:1180},{width:1180,height:820},{width:390,height:844}]){await page.setViewportSize(size);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'＋ Nueva receta'}).click();expect(await page.evaluate(()=>document.querySelector('#editor').scrollWidth<=document.querySelector('#editor').clientWidth)).toBe(true);await page.locator('#editor').getByRole('button',{name:'Cancelar',exact:true}).click();}expect(errors).toEqual([]);
 await page.setViewportSize({width:820,height:1180});await page.screenshot({path:'/tmp/recetario-ipad.png',fullPage:true});
});
