import{handler,reply,body,identity,sameOrigin}from'../lib/server.mjs';import{query,transaction}from'../lib/db.mjs';import{AppError,requireCapability}from'../lib/domain.mjs';
export default handler(async(req,res)=>{
 if(req.method==='GET'){const[row]=await query('SELECT settings FROM app_design WHERE id=1');return reply(res,200,{settings:row?.settings||null});}
 if(req.method!=='POST')return reply(res,405,{error:'method_not_allowed'});const user=await identity(req);requireCapability(user.role,'design_publish');sameOrigin(req);const b=body(req,3000000);
 if(b.version!==2||!b.texts?.ar||!b.texts?.en)throw new AppError('invalid_input');
 for(const lang of ['ar','en'])for(const v of Object.values(b.texts[lang]))if(typeof v!=='string'||v.length>10000)throw new AppError('invalid_input');
 for(const v of Object.values(b.media||{}))if(typeof v!=='string'||v.length>2000000||!(/^(assets\/[a-zA-Z0-9_./-]+\.(png|webp|jpe?g)|data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+)?$/.test(v)))throw new AppError('invalid_input');
 await transaction(async db=>{await db.query('INSERT INTO app_design(id,settings,updated_by) VALUES(1,$1,$2) ON CONFLICT(id) DO UPDATE SET settings=excluded.settings,updated_by=excluded.updated_by,updated_at=now()',[JSON.stringify(b),user.userId]);await db.query('INSERT INTO audit_log(actor,action,entity_id) VALUES($1,$2,$3)',[user.userId,'design_published','1']);});reply(res,200,{saved:true});
});
