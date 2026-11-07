import test from 'node:test'
import assert from 'node:assert/strict'
import {proteinFor,bmi,targetG,vol,e1rm,isWork,avg} from './calc.js'
test('protein per 100 g',()=>assert.equal(proteinFor({unit:'g',protein_per_100g:31},150),46.5))
test('protein per unit',()=>assert.equal(proteinFor({unit:'unit',protein_per_unit:6.3},3),18.9))
test('BMI',()=>assert.equal(bmi(55,170),19))
test('BMI tanpa data',()=>assert.equal(bmi(0,170),null))
test('target 55 kg x 2.0',()=>assert.equal(targetG(55,2),110))
test('volume = weight x reps',()=>assert.equal(vol({w:50,r:8}),400))
test('e1rm Epley',()=>assert.ok(Math.abs(e1rm(100,5)-116.67)<0.01))
test('warm-up bukan working set',()=>{assert.equal(isWork('warmup'),false);assert.equal(isWork('working'),true);assert.equal(isWork('drop'),true)})
test('avg',()=>assert.equal(avg([100,110]),105))
import {muscleAgg,weekStart} from './calc.js'
test('muscleAgg: warm-up tidak dihitung, sekunder terpisah',()=>{
 const a=muscleAgg([{date:'2026-01-05',w:50,r:10,type:'working',p:'chest',sec:['triceps']},{date:'2026-01-05',w:20,r:15,type:'warmup',p:'chest',sec:['triceps']},{date:'2026-01-06',w:40,r:10,type:'drop',p:'chest',sec:[]}])
 assert.equal(a.chest.sets,2);assert.equal(a.chest.vol,900);assert.equal(a.chest.dates.size,2);assert.equal(a.triceps.sets,0);assert.equal(a.triceps.ind,1)})
test('weekStart = Senin',()=>{assert.equal(weekStart('2026-01-01'),'2025-12-29');assert.equal(weekStart('2026-01-05'),'2026-01-05')})
import {MG,MGMAP} from './calc.js'
test('Abs terdaftar sebagai kelompok otot',()=>{assert.ok(MG.includes('abs'));assert.equal(MGMAP.Abs,'abs')})
