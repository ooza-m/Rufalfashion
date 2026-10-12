import {handler,reply} from '../lib/server.mjs';import {status} from '../lib/domain.mjs';
export default handler(async(req,res)=>{if(req.method!=='GET')return reply(res,405,{error:'method_not_allowed'});reply(res,200,{...status(),publishableKey:process.env.CLERK_PUBLISHABLE_KEY||null});});
