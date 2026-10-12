import{createHash}from'node:crypto';import{handler,reply,body,sameOrigin}from'../lib/server.mjs';import{AppError,status}from'../lib/domain.mjs';import{placeOrder,trackOrder,expireOrders}from'../lib/orders.mjs';
export default handler(async(req,res)=>{
 if(req.method==='GET'){if(!status().database)throw new AppError('database_not_configured',503);return reply(res,200,await trackOrder(req.query.token));}
 if(!status().ordering)throw new AppError('ordering_not_configured',503);
 if(req.method!=='POST')return reply(res,405,{error:'method_not_allowed'});
 sameOrigin(req);const ip=String(req.headers['x-real-ip']||req.socket?.remoteAddress||'unknown');const rate=createHash('sha256').update(process.env.RUFAL_RATE_SECRET+ip).digest('hex');
 await expireOrders();reply(res,201,await placeOrder(body(req),req.headers['idempotency-key'],rate));
});
