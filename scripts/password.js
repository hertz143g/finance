import {hashPassword} from '../lib/auth.js';
if(!process.argv[2]||process.argv[2].length<12)throw Error('Пароль должен содержать минимум 12 символов');console.log(hashPassword(process.argv[2]));
