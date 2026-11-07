import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {P,patFor,poseSvg} from './pose.js'
const names=[...fs.readFileSync('supabase/schema.sql','utf8').split('-- Built-in exercises')[1].matchAll(/\('(?:PUSH|PULL|LEGS)','[^']+','([^']+)'\)/g)].map(m=>m[1])
test('seluruh exercise bawaan punya ilustrasi gerakan',()=>{assert.ok(names.length>=60);const miss=names.filter(n=>!patFor(n));assert.deepEqual(miss,[])})
test('tiap pola punya 3 frame, 3 langkah, dan SVG valid',()=>{for(const [k,p] of Object.entries(P)){assert.equal(p.f.length,3,k);assert.equal(p.s.length,3,k);for(const f of p.f){const s=poseSvg(f,p);assert.ok(s.startsWith('<svg')&&!s.includes('NaN'),k)}}})
test('pola yang dipakai ada datanya',()=>{for(const n of names)assert.ok(P[patFor(n)],n)})
