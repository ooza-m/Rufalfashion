import {handler,reply,identity,sameOrigin,body}from'../lib/server.mjs';import{query,transaction}from'../lib/db.mjs';import{expireOrders}from'../lib/orders.mjs';import{AppError,requireCapability,cents,text,uuid,quantity,transition}from'../lib/domain.mjs';
export default handler(async(req,res)=>{
 const user=await identity(req);const resource=req.query.resource||'overview';
 if(req.method!=='GET')sameOrigin(req);
 const privateResources=['finance','funding','funding-approve','design','audit'];requireCapability(user.role,privateResources.includes(resource)?'finance_read':'operations');
 if(req.method==='GET'){if(['overview','products','orders'].includes(resource))await expireOrders();
  if(resource==='me')return reply(res,200,user);
  if(resource==='overview'){const[totals]=await query(`SELECT count(*) FILTER(WHERE status='awaiting_link') AS awaiting_link,count(*) FILTER(WHERE status='awaiting_payment') AS awaiting_payment,count(*) FILTER(WHERE status IN('paid','preparing')) AS preparing FROM orders`);const[stock]=await query('SELECT COALESCE(sum(reserved),0) AS reserved,count(*) FILTER(WHERE on_hand-reserved<=low_stock_threshold) AS low_stock FROM variants');return reply(res,200,{...totals,...stock});}
  if(resource==='products')return reply(res,200,{items:await query(`SELECT p.*,COALESCE(json_agg(json_build_object('id',v.id,'size',v.size,'price_cents',v.price_cents,'on_hand',v.on_hand,'reserved',v.reserved)) FILTER(WHERE v.id IS NOT NULL),'[]') AS variants FROM products p LEFT JOIN variants v ON v.product_id=p.id GROUP BY p.id ORDER BY p.created_at DESC LIMIT 200`)});
  if(resource==='orders')return reply(res,200,{items:await query(`SELECT o.id,o.customer,o.status,o.items_total_cents,o.shipping_fee_cents,o.created_at,o.payment_sent_at,o.payment_expires_at,o.payment_link,o.payment_reference,(SELECT json_agg(json_build_object('sku',v.sku,'name_ar',p.name_ar,'name_en',p.name_en,'options',v.options,'quantity',l.quantity,'unit_price_cents',l.unit_price_cents)) FROM order_lines l JOIN variants v ON v.id=l.variant_id JOIN products p ON p.id=v.product_id WHERE l.order_id=o.id) AS lines FROM orders o ORDER BY o.created_at DESC LIMIT 200`)});
  if(resource==='shipping')return reply(res,200,{items:await query('SELECT * FROM shipping_zones ORDER BY emirate,area')});
  if(resource==='messages')return reply(res,200,{items:await query('SELECT id,name,email,message,created_at FROM contact_messages ORDER BY created_at DESC LIMIT 100')});
  if(resource==='finance'){const rows=await query("SELECT kind,sum(amount_cents)::text AS amount FROM finance_entries GROUP BY kind");const totals=Object.fromEntries(rows.map(r=>[r.kind,Number(r.amount)]));const[cost]=await query("SELECT COALESCE(sum(l.quantity*l.unit_cost_cents),0)::text AS amount,count(*) FILTER(WHERE l.unit_cost_cents IS NULL) AS missing_costs FROM order_lines l JOIN orders o ON o.id=l.order_id WHERE o.status IN('paid','preparing','out_for_delivery','completed')");return reply(res,200,{totals,cost_of_goods_cents:Number(cost.missing_costs)>0?null:Number(cost.amount),entries:await query('SELECT id,kind,amount_cents,note,created_at FROM finance_entries ORDER BY created_at DESC LIMIT 200')});}
  if(resource==='funding')return reply(res,200,{items:await query('SELECT * FROM funding_drafts ORDER BY created_at DESC LIMIT 100')});
  if(resource==='audit')return reply(res,200,{items:await query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100')});
  if(resource==='design'){const[record]=await query('SELECT settings FROM app_design WHERE id=1');return reply(res,200,{settings:record?.settings||null});}
 }
 if(req.method==='POST'){
  const b=body(req);let result;const audited=(sql,values,action)=>transaction(async db=>{const{rows:[record]}=await db.query(sql,values);await db.query('INSERT INTO audit_log(actor,action,entity_id) VALUES($1,$2,$3)',[user.userId,action,String(record.id)]);return record;});
  if(resource==='products'){throw new AppError('use_catalog_editor',410);}else if(resource==='shipping'){
   const zone=await audited('INSERT INTO shipping_zones(emirate,area,customer_fee_cents,carrier_cost_cents) VALUES($1,$2,$3,$4) ON CONFLICT(emirate,area) DO UPDATE SET customer_fee_cents=excluded.customer_fee_cents,carrier_cost_cents=excluded.carrier_cost_cents RETURNING id',[text(b.emirate,100),text(b.area,200),cents(b.customer_fee,{nullable:true}),cents(b.carrier_cost,{nullable:true})],'shipping_zone_changed');result=zone;
  }else if(resource==='funding-draft'){
   requireCapability(user.role,'funding_draft');const amount=cents(b.amount);if(!amount)throw new AppError('invalid_amount');const draft=await audited('INSERT INTO funding_drafts(amount_cents,note,created_by) VALUES($1,$2,$3) RETURNING id',[amount,String(b.note||'').slice(0,1000),user.userId],'funding_draft_created');result=draft;
  }else if(resource==='funding-approve'){
   requireCapability(user.role,'finance_read');result=await transaction(async db=>{const{rows:[draft]}=await db.query('SELECT * FROM funding_drafts WHERE id=$1 FOR UPDATE',[uuid(b.id)]);if(!draft||draft.status!=='draft')throw new AppError('invalid_input');await db.query("INSERT INTO finance_entries(kind,amount_cents,note,created_by) VALUES('funding_principal',$1,$2,$3)",[draft.amount_cents,draft.note,user.userId]);await db.query("UPDATE funding_drafts SET status='approved' WHERE id=$1",[draft.id]);await db.query('INSERT INTO audit_log(actor,action,entity_id) VALUES($1,$2,$3)',[user.userId,'funding_draft_approved',draft.id]);return{id:draft.id};});
  }else if(resource==='finance'){
   requireCapability(user.role,'finance_read');if(!['operating_expense','funding_principal','principal_repayment','funding_return','inventory_purchase'].includes(b.kind))throw new AppError('invalid_input');const amount=cents(b.amount);if(!amount)throw new AppError('invalid_amount');result=await transaction(async db=>{await db.query("SELECT pg_advisory_xact_lock(hashtextextended('rufal-finance',0))");if(b.kind==='principal_repayment'){const{rows:[balance]}=await db.query("SELECT COALESCE(sum(CASE WHEN kind='funding_principal' THEN amount_cents WHEN kind='principal_repayment' THEN -amount_cents ELSE 0 END),0)::text AS amount FROM finance_entries");if(amount>Number(balance.amount))throw new AppError('repayment_exceeds_principal');}const{rows:[entry]}=await db.query('INSERT INTO finance_entries(kind,amount_cents,note,created_by) VALUES($1,$2,$3,$4) RETURNING id',[b.kind,amount,String(b.note||'').slice(0,1000),user.userId]);await db.query('INSERT INTO audit_log(actor,action,entity_id) VALUES($1,$2,$3)',[user.userId,'finance_entry_created',entry.id]);return entry;});
  }else if(resource==='order-action'){
   const id=uuid(b.id);result=await transaction(async db=>{
    const{rows:[order]}=await db.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id]);if(!order)throw new AppError('not_found',404);
    if(b.action==='link_sent'){
     if(order.status!=='awaiting_link')throw new AppError('invalid_transition',409);const link=new URL(text(b.link,2000));if(link.protocol!=='https:')throw new AppError('invalid_payment_link');const sent=new Date(b.sent_at);if(!Number.isFinite(sent.getTime())||sent>new Date()||sent<new Date(order.created_at))throw new AppError('invalid_sent_at');
     await db.query("UPDATE orders SET status='awaiting_payment',payment_link=$2,payment_sent_at=$3,payment_expires_at=$3::timestamptz+interval '48 hours' WHERE id=$1",[id,link.href,sent.toISOString()]);
    }else if(b.action==='cancel'){
     if(!['awaiting_link','awaiting_payment'].includes(order.status))throw new AppError('invalid_transition',409);const{rows:lines}=await db.query('SELECT variant_id,quantity FROM order_lines WHERE order_id=$1 ORDER BY variant_id',[id]);for(const l of lines){await db.query('UPDATE variants SET reserved=reserved-$2 WHERE id=$1',[l.variant_id,l.quantity]);await db.query('INSERT INTO stock_movements(variant_id,reserved_delta,reason,reference,created_by) VALUES($1,$2,$3,$4,$5)',[l.variant_id,-l.quantity,'order_cancelled',id,user.userId]);}await db.query("UPDATE orders SET status='cancelled' WHERE id=$1",[id]);
    }else if(b.action==='confirm_payment'){
     if(order.status!=='awaiting_payment'||new Date(order.payment_expires_at)<=new Date())throw new AppError('late_payment_review_required',409);const reference=text(b.reference,200);
     const{rows:lines}=await db.query('SELECT * FROM order_lines WHERE order_id=$1 ORDER BY variant_id',[id]);
     for(const line of lines){const {rowCount}=await db.query('UPDATE variants SET on_hand=on_hand-$2,reserved=reserved-$2 WHERE id=$1 AND reserved>=$2 AND on_hand>=$2',[line.variant_id,line.quantity]);if(rowCount!==1)throw new AppError('stock_conflict',409);await db.query('INSERT INTO stock_movements(variant_id,on_hand_delta,reserved_delta,reason,reference,created_by) VALUES($1,$2,$2,$3,$4,$5)',[line.variant_id,-line.quantity,'verified_sale',id,user.userId]);}
     await db.query("UPDATE orders SET status='paid',payment_reference=$2 WHERE id=$1",[id,reference]);await db.query("INSERT INTO finance_entries(kind,amount_cents,order_id,created_by) VALUES('sale',$1,$2,$3)",[Number(order.items_total_cents)+Number(order.shipping_fee_cents),id,user.userId]);
    }else{transition(order.status,b.action);await db.query('UPDATE orders SET status=$2 WHERE id=$1',[id,b.action]);}
    await db.query('INSERT INTO audit_log(actor,action,entity_id) VALUES($1,$2,$3)',[user.userId,b.action,id]);return{id};
   });
  }
  if(result)return reply(res,201,result);
 }
 return reply(res,404,{error:'not_found'});
});
