// Run only on the dedicated isolated Neon test branch. Fixtures are never production data.
import assert from'node:assert/strict';import{randomUUID}from'node:crypto';import{database,query}from'../lib/db.mjs';import{placeOrder,expireOrders,trackOrder}from'../lib/orders.mjs';
if(process.env.RUFAL_INTEGRATION_BRANCH!=='br-broad-math-arrqf25g')throw Error('Dedicated test branch required');
const db=await database();
try{
 const {rows:[p]}=await db.query("INSERT INTO products(name_ar,name_en,published,max_per_order,sku) VALUES('اختبار معزول','Isolated test',true,2,$1) RETURNING id",['TEST-'+randomUUID()]);
 const {rows:[v]}=await db.query('INSERT INTO variants(product_id,size,price_cents,on_hand,sale_price_cents,sale_start,sale_end) VALUES($1,$2,10000,2,9000,now()-interval \'1 hour\',now()+interval \'1 hour\') RETURNING id',[p.id,'38 · Blue']);
 const{rows:[z]}=await db.query('INSERT INTO shipping_zones(emirate,area,customer_fee_cents,carrier_cost_cents) VALUES($1,$2,1000,NULL) RETURNING id',['TEST',randomUUID()]);
 const input={first_name:'Test',second_name:'Only',phone:'+971500000000',email:'test@example.invalid',address:'Isolated fixture',zone_id:z.id,lines:[{variant_id:v.id,quantity:1}]};
 const key=randomUUID(),first=await placeOrder(input,key,'test'),again=await placeOrder(input,key,'test');assert.equal(first.id,again.id);assert.equal(again.repeated,true);assert.equal(first.tracking_token,again.tracking_token);
 let[stock]=await query('SELECT on_hand,reserved FROM variants WHERE id=$1',[v.id]);assert.deepEqual(stock,{on_hand:2,reserved:1});const[line]=await query('SELECT unit_price_cents,unit_cost_cents FROM order_lines WHERE order_id=$1',[first.id]);assert.equal(Number(line.unit_price_cents),9000);assert.equal(line.unit_cost_cents,null);
 const concurrent=await Promise.allSettled([placeOrder(input,randomUUID(),'test'),placeOrder(input,randomUUID(),'test')]);assert.equal(concurrent.filter(x=>x.status==='fulfilled').length,1);assert.equal(concurrent.filter(x=>x.status==='rejected'&&x.reason.code==='out_of_stock').length,1);
 await expireOrders();[stock]=await query('SELECT reserved FROM variants WHERE id=$1',[v.id]);assert.equal(stock.reserved,2); // No pre-link deadline is invented.
 await query("UPDATE orders SET status='awaiting_payment',payment_sent_at=now()-interval '49 hours',payment_expires_at=now()-interval '1 hour' WHERE id=$1",[first.id]);const expiry=await expireOrders();assert.ok(expiry.expired>=1);[stock]=await query('SELECT on_hand,reserved FROM variants WHERE id=$1',[v.id]);assert.deepEqual(stock,{on_hand:2,reserved:1});assert.equal((await trackOrder(first.tracking_token)).status,'expired');
 const tracked=await trackOrder(first.tracking_token);assert.ok(!('customer'in tracked));assert.ok(!('payment_link'in tracked));
 const audit=await query("SELECT * FROM stock_movements WHERE variant_id=$1 AND reason='reservation_expired'",[v.id]);assert.equal(audit.length,1);
 console.log('PASS: real database reservations, concurrent stock conflict, idempotent replay, active sale price, unknown cost, expiry release and private tracking. Test branch only.');
}finally{await db.end();}
