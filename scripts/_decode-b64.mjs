import fs from 'node:fs';

const [, , srcPath, outPath] = process.argv;
const raw = fs.readFileSync(srcPath, 'utf8');
const arr = JSON.parse(raw);
const text = arr[0].text;
let b64 = text;
try { b64 = JSON.parse(text); } catch (e) { /* already plain */ }
fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
console.log('wrote', fs.statSync(outPath).size, 'bytes ->', outPath);
