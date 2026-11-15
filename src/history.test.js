import test from 'node:test'
import assert from 'node:assert/strict'
import {copySets,latestBefore,stats,timeline,pristine} from './history.js'
const mk=(date,ws)=>({date,sets:ws.map(([w,r],i)=>({set_no:i+1,weight:w,reps:r,set_type:'working'}))})
const nov10=()=>mk('2026-11-10',[[40,12],[45,10],[50,8]]),nov14=()=>mk('2026-11-14',[[45,12],[50,10],[55,8]])
test('Test B: tiap tanggal punya data sendiri',()=>{const r=[nov10(),nov14()];assert.deepEqual(r[0].sets.map(s=>s.weight),[40,45,50]);assert.deepEqual(r[1].sets.map(s=>s.weight),[45,50,55])})
test('Test C: mengubah satu set tidak memengaruhi sesi lain',()=>{const r=[nov10(),nov14()];r[0].sets[1].weight=47.5;assert.deepEqual(r[0].sets.map(s=>s.weight),[40,47.5,50]);assert.deepEqual(r[1].sets.map(s=>s.weight),[45,50,55])})
test('Test D: referensi = sesi terakhir sebelum tanggal, ketat (<)',()=>{const r=[nov10(),nov14()];assert.equal(latestBefore(r,'2026-11-14').date,'2026-11-10');assert.equal(latestBefore(r,'2026-11-10'),null);assert.equal(latestBefore(r,'2026-11-20').date,'2026-11-14')})
test('Test D: copySets membuat baris baru dan tidak mengubah sumber',()=>{const src=nov10().sets,snap=JSON.stringify(src);let n=0;const c=copySets(src,()=>'id'+(n++));assert.equal(JSON.stringify(src),snap);assert.deepEqual(c.map(s=>s.id),['id0','id1','id2']);assert.ok(c.every(s=>s.completed===false));c[0].weight=99;assert.equal(src[0].weight,40)})
test('volume dan beban teratas mengecualikan warm-up',()=>{const s=stats([{set_no:1,weight:20,reps:15,set_type:'warmup'},{set_no:2,weight:50,reps:10,set_type:'working'},{set_no:3,weight:45,reps:8,set_type:'drop'}]);assert.equal(s.n,2);assert.equal(s.volume,860);assert.equal(s.top,50)})
test('timeline: perubahan antar sesi',()=>{const t=timeline([nov14(),nov10()]);assert.equal(t[0].date,'2026-11-10');assert.equal(t[0].dTop,null);assert.equal(t[1].dTop,5);assert.equal(t[1].volume,45*12+50*10+55*8);assert.equal(t[1].dVol,Math.round((t[1].volume-t[0].volume)/t[0].volume*100))})
test('set kosong bawaan dianggap pristine, set terisi/selesai tidak',()=>{assert.ok(pristine({weight:0,completed:false}));assert.ok(!pristine({weight:40,completed:false}));assert.ok(!pristine({weight:0,completed:true}))})
