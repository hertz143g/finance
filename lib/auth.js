import {scryptSync,timingSafeEqual,createHmac,randomBytes} from 'node:crypto';
export function hashPassword(p,salt=randomBytes(16).toString('hex')){return salt+':'+scryptSync(p,salt,64).toString('hex')}
export function checkPassword(p,hash){try{const [s,h]=hash.split(':');const actual=Buffer.from(hashPassword(p,s).split(':')[1],'hex'),expected=Buffer.from(h,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected)}catch{return false}}
const localSessionKey=randomBytes(32);
function sign(v){return createHmac('sha256',process.env.DATABASE_URL||localSessionKey).update(v).digest('hex')}
export function token(){const v=String(Date.now()+86400000);return v+'.'+sign(v)}
export function authenticated(cookie=''){try{const t=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('session='))?.slice(8)||'';const [v,s]=t.split('.');const a=Buffer.from(s||'','hex'),b=Buffer.from(sign(v),'hex');return Number(v)>Date.now()&&a.length===b.length&&timingSafeEqual(a,b)}catch{return false}}
export const cookie=(t,age=86400)=>`session=${t}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.VERCEL?'; Secure':''}`;
