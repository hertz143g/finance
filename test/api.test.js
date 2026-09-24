import {test} from 'node:test';import assert from 'node:assert/strict';import handler from '../api/app.js';
test('server requires correct password for initial vault and does not need a database',async()=>{
 process.env.SESSION_SECRET='qa-signing-key-only-'.repeat(3);delete process.env.DATABASE_URL;delete process.env.POSTGRES_URL;delete process.env.LOCAL_DATA;
 let headers={host:'localhost:3000',origin:'http://localhost:3000'};
 const call=async(method,body)=>{const h={};let output;const res={statusCode:200,setHeader:(k,v)=>h[k]=v,end:s=>output=JSON.parse(s)};await handler({method,body,headers,socket:{remoteAddress:'127.0.0.1'}},res);return {status:res.statusCode,body:output,headers:h}};
 assert.equal((await call('GET')).status,401);
 assert.equal((await call('POST',{action:'login',password:'wrong'})).status,401);
 headers.origin='http://evil.test';assert.equal((await call('POST',{action:'login',password:'penis123'})).status,403);headers.origin='http://localhost:3000';
 const login=await call('POST',{action:'login',password:'penis123'});assert.equal(login.status,200);headers.cookie=login.headers['Set-Cookie'].split(';')[0];
 const vault=await call('GET');assert.equal(vault.status,200);assert.equal(vault.body.version,1);assert(!JSON.stringify(vault.body).includes('transactions'));
 headers.cookie='session=forged';assert.equal((await call('GET')).status,401);
});
