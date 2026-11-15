import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {IMG} from './exerciseImages.js'
const names=new Set(['supabase/schema.sql','supabase/migration_004.sql','supabase/migration_006.sql'].flatMap(f=>[...fs.readFileSync(f,'utf8').matchAll(/\('(?:PUSH|PULL|LEGS)',\s*'[^']+',\s*'([^']+)'/g)].map(m=>m[1])))
test('setiap gambar terhubung ke exercise yang ada di database',()=>{const miss=Object.keys(IMG).filter(n=>!names.has(n));assert.deepEqual(miss,[])})
test('semua berkas gambar ada di public/exercises',()=>{for(const [n,v] of Object.entries(IMG))for(const f of [v.t,...v.f])assert.ok(fs.existsSync('public/exercises/'+f),n+' '+f)})
