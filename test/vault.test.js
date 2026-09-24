import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {api} from '../public/vault.js';
test('browser vault: password, 956 records, encrypted persistence and login again without a database',async()=>{
 const initial=JSON.parse(await readFile('lib/initial-vault.json','utf8'));
 const saved=new Map();globalThis.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
 globalThis.fetch=async()=>({ok:true,json:async()=>initial});
 await assert.rejects(api({action:'login',password:'wrong'}),/Неверный пароль/);
 await api({action:'login',password:'penis123'});const before=await api();assert.equal(before.transactions.length,956);
 await api({action:'budget',category:'QA category',amount:12345});
 const encrypted=saved.get('balance-vault-v1');assert(encrypted);assert(!encrypted.includes('QA category'));assert(!encrypted.includes('transactions'));
 await api({action:'logout'});await assert.rejects(api(),/Введите пароль/);
 await api({action:'login',password:'penis123'});assert.equal((await api()).budgets['QA category'],12345);
 await api({action:'transaction',transaction:{date:'2026-09-24',amount:-50000,kind:'expense',category:'Кафе',description:'QA',comment:''}});assert.equal((await api()).transactions.length,957);
});
