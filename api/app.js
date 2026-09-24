import {createDecipheriv} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {loginHash} from '../lib/login-config.js';
import {authenticated,checkPassword,token,cookie} from '../lib/auth.js';
const attempts=new Map();
function allowed(ip){const now=Date.now();for(const [k,v]of attempts)if(v.until<now)attempts.delete(k);let a=attempts.get(ip);if(!a){a={count:0,until:now+900000};attempts.set(ip,a)}return ++a.count<=10}
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Type','application/json');
 const reply=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body))};
 try{
  if(req.method==='POST'){
   const origin=req.headers.origin;if(!origin||new URL(origin).host!==req.headers.host)return reply(403,{error:'Недопустимый источник запроса'});
   const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
   if(body.action==='login'){
    if(!allowed(String(req.headers['x-real-ip']||req.socket?.remoteAddress||'unknown')))return reply(429,{error:'Слишком много попыток. Подождите 15 минут.'});
    if(typeof body.password!=='string'||body.password.length>256||!checkPassword(body.password,loginHash))return reply(401,{error:'Неверный пароль'});
    res.setHeader('Set-Cookie',cookie(token()));return reply(200,{ok:true});
   }
   if(body.action==='logout'){res.setHeader('Set-Cookie',cookie('',0));return reply(200,{ok:true})}
   return reply(400,{error:'Неизвестное действие'});
  }
  if(req.method!=='GET')return reply(405,{error:'Метод не поддерживается'});
  if(!authenticated(req.headers.cookie))return reply(401,{error:'Введите пароль'});
  let envelope=JSON.parse(await readFile(new URL('../lib/initial-vault.json',import.meta.url),'utf8'));
  if(envelope.serverEncrypted){const data=Buffer.from(envelope.data,'base64');const decipher=createDecipheriv('aes-256-gcm',Buffer.from(process.env.VAULT_KEY||'','hex'),Buffer.from(envelope.iv,'base64'));decipher.setAuthTag(data.subarray(-16));envelope=JSON.parse(Buffer.concat([decipher.update(data.subarray(0,-16)),decipher.final()]).toString('utf8'))}
  return reply(200,envelope);
 }catch(e){console.error('Request failed:',e.code||e.name);return reply(503,{error:'Не удалось загрузить начальные данные. Попробуйте обновить страницу.'})}
}
