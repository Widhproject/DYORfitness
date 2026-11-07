import test from 'node:test'
import assert from 'node:assert/strict'
import {plan,same} from './syncCore.js'
const r=(o)=>({id:'a',weight:50,reps:8,updated_at:'t1',...o}),T=['sets']
const P=(S,L,V)=>plan({sets:S},{sets:L},{sets:V},T)
test('tanpa perubahan -> kosong',()=>{const p=P({a:r()},{a:r()},{a:r()});assert.equal(p.ups.sets.length+p.dels.sets.length+p.conflicts.length,0)})
test('perubahan lokal saja -> upsert',()=>{const p=P({a:r()},{a:r({reps:9})},{a:r()});assert.equal(p.ups.sets[0].reps,9);assert.equal(p.conflicts.length,0)})
test('baris baru offline -> upsert (idempoten via id)',()=>{const p=P({},{b:{id:'b',weight:40,reps:10}},{});assert.equal(p.ups.sets.length,1)})
test('hapus lokal -> delete',()=>{const p=P({a:r()},{},{a:r()});assert.deepEqual(p.dels.sets,['a'])})
test('server saja berubah -> tidak menimpa',()=>{const p=P({a:r()},{a:r()},{a:r({reps:12,updated_at:'t2'})});assert.equal(p.ups.sets.length+p.conflicts.length,0)})
test('dua sisi berubah berbeda -> KONFLIK, tidak diam-diam menimpa',()=>{const p=P({a:r()},{a:r({reps:9})},{a:r({reps:12,updated_at:'t2'})});assert.equal(p.conflicts.length,1);assert.equal(p.ups.sets.length,0)})
test('dua sisi berubah sama -> tanpa konflik',()=>{const p=P({a:r()},{a:r({reps:9})},{a:r({reps:9,updated_at:'t2'})});assert.equal(p.conflicts.length+p.ups.sets.length,0)})
test('lokal edit vs server hapus -> konflik',()=>{const p=P({a:r()},{a:r({reps:9})},{});assert.equal(p.conflicts.length,1)})
test('setelah sinkron (S=V=L) tidak ada operasi lagi',()=>{const x=r({reps:9,updated_at:'t3'});const p=P({a:x},{a:x},{a:x});assert.equal(p.ups.sets.length,0)})
test('updated_at & null diabaikan saat membandingkan',()=>assert.ok(same({a:1,b:null,updated_at:'x'},{a:1,updated_at:'y'})))
import {fork} from './syncCore.js'
test('fork: mengubah L tidak ikut mengubah S (bug: perubahan hilang setelah sync)',()=>{
 const F={sets:{a:{id:'a',reps:8}}},d=fork({S:F,L:F,dirty:false});d.L.sets.b={id:'b',reps:5};d.L.sets.a.reps=9
 assert.equal(d.S.sets.b,undefined);assert.equal(d.S.sets.a.reps,8)
 const p=plan(d.S,d.L,F,['sets']);assert.equal(p.ups.sets.length,2)})
