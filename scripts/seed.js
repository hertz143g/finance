import {readFile,writeFile} from 'node:fs/promises';import {neon} from '@neondatabase/serverless';import {init} from '../lib/store.js';
const plan=JSON.parse(await readFile('settings.private.json','utf8'));
const rows=JSON.parse(await readFile('transactions.private.json','utf8'));
if(process.env.LOCAL_DATA==='1'&&!process.env.VERCEL){let old={transactions:[],budgets:{}};try{old=JSON.parse(await readFile('.local-data.json','utf8'))}catch{}const ids=new Set(old.transactions.map(x=>x.id));old.transactions.push(...rows.filter(x=>!ids.has(x.id)));old.plan??=plan;await writeFile('.local-data.json',JSON.stringify(old));}
else{const sql=neon(process.env.DATABASE_URL);await init(sql);await sql`INSERT INTO settings VALUES ('plan',${JSON.stringify(plan)}::jsonb) ON CONFLICT(id) DO NOTHING`;await sql`INSERT INTO records(id,data) SELECT value->>'id', value FROM jsonb_array_elements(${JSON.stringify(rows)}::jsonb) ON CONFLICT(id) DO NOTHING`;}
console.log(`Импорт завершён: ${rows.length} исходных операций. Повторный запуск не дублирует записи.`);
