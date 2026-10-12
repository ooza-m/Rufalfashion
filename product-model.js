// Shared, deterministic rules. No customer records or supplier identities.
export const codeTerms={style:[['G','Ball gown','منفوش'],['A','A-line','كلوش'],['D','Mermaid','سمكة'],['H','Sheath','مستقيم']],color:[['I','Pink','وردي'],['R','Red','أحمر'],['N','Green','أخضر'],['O','Orange','برتقالي'],['Y','Yellow','أصفر'],['U','Blue','أزرق'],['B','Brown','بني'],['W','White','أبيض'],['K','Black','أسود'],['V','Silver','فضي'],['Z','Gold','ذهبي'],['E','Beige','بيج'],['P','Purple','بنفسجي']],length:[['L','Long','طويل'],['M','Medium','متوسط'],['S','Short','قصير']],sleeve:[['L','Long','طويل'],['M','Medium','متوسط'],['S','Short','قصير'],['N','Sleeveless','بدون كم']]};
export function productCode({style,color,year,length,sleeve,supplier},sequence){
 if(![style,color,length,sleeve].every(v=>/^[A-Z]$/.test(v||''))||!/^\d{4}$/.test(String(year))||!Number.isInteger(Number(year))||Number(year)<2000||Number(year)>2099||!/^([A-Z0-9]{2,6})$/.test(supplier||'')||!Number.isSafeInteger(sequence)||sequence<1)throw Error('invalid_code');
 return `${style}${color}${String(year).slice(-2)}-${length}${sleeve}-${supplier}-${String(sequence).padStart(3,'0')}`;
}
export function variantCode(base,index){if(!base||!Number.isSafeInteger(index)||index<1)throw Error('invalid_code');return `${base}-V${String(index).padStart(3,'0')}`;}
export function optionMatrix(groups){
 if(!Array.isArray(groups)||groups.length>4)throw Error('invalid_options');
 let rows=[{}];const names=new Set();
 for(const group of groups){const name=String(group.name||'').trim();const values=(group.values||[]).map(v=>String(v).trim());if(!name||name.length>60||names.has(name)||!values.length||values.length>20||values.some(v=>!v||v.length>60)||new Set(values).size!==values.length)throw Error('invalid_options');names.add(name);rows=rows.flatMap(row=>values.map(value=>({...row,[name]:value})));if(rows.length>200)throw Error('too_many_variants');}
 return rows;
}
export function effectivePrice(variant,now=Date.now()){
 const start=variant.sale_start?Date.parse(variant.sale_start):-Infinity,end=variant.sale_end?Date.parse(variant.sale_end):Infinity;
 return variant.sale_price_cents!=null&&start<=now&&now<=end?Number(variant.sale_price_cents):Number(variant.price_cents);
}
export function rankRelated(product,candidates,limit=3){
 return candidates.filter(p=>p.id!==product.id&&p.published!==false).map(p=>({p,score:(p.style_code&&p.style_code===product.style_code?8:0)+(p.category_id&&p.category_id===product.category_id?5:0)+(p.length_code&&p.length_code===product.length_code?3:0)+(p.sleeve_code&&p.sleeve_code===product.sleeve_code?2:0)+(p.color_code&&p.color_code===product.color_code?1:0)+(p.tags||[]).filter(t=>(product.tags||[]).includes(t)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||String(a.p.sku||a.p.id).localeCompare(String(b.p.sku||b.p.id))).slice(0,limit).map(x=>x.p);
}
export function priceFromMargin(costCents,marginPercent){if(!Number.isSafeInteger(costCents)||costCents<0||!Number.isFinite(marginPercent)||marginPercent<0||marginPercent>=100)throw Error('invalid_margin');return Math.ceil(costCents/(1-marginPercent/100));}
export function landedCost(parts){const required=['purchase','shipping','customs','packaging','photography','storage','other'];if(required.some(k=>parts[k]==null))return null;const values=Object.values(parts);if(values.some(v=>v!=null&&(!Number.isSafeInteger(v)||v<0)))throw Error('invalid_cost');return values.reduce((sum,v)=>sum+(v??0),0);}
