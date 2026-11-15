import {e1rm} from './calc.js'
export const isWorking=s=>s.set_type!=='warmup'
export const pristine=s=>!s.completed&&!(+s.weight>0)
// Salinan nilai ke sesi aktif sebagai baris BARU (id baru); sumbernya tidak disentuh
export const copySets=(prev,newId)=>[...prev].sort((a,b)=>a.set_no-b.set_no).map(s=>({id:newId(),set_no:s.set_no,weight:+s.weight,reps:s.reps,rpe:s.rpe??null,rir:s.rir??null,set_type:s.set_type||'working',completed:false}))
// Sesi terakhir SEBELUM tanggal tertentu (tanggal yang sama tidak dihitung)
export function latestBefore(recs,date){let b=null;for(const r of recs)if(r.date<date&&(!b||r.date>b.date))b=r
 return b&&{date:b.date,sets:[...b.sets].sort((x,y)=>x.set_no-y.set_no)}}
export function stats(sets){const w=sets.filter(isWorking)
 return{n:w.length,volume:w.reduce((a,s)=>a+ +s.weight*s.reps,0),top:Math.max(0,...w.map(s=>+s.weight)),e1rm:Math.max(0,...w.map(s=>e1rm(+s.weight,s.reps))),bestReps:Math.max(0,...w.map(s=>s.reps))}}
export function timeline(recs){const t=[...recs].sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0).map(r=>({...r,...stats(r.sets)}))
 return t.map((r,i)=>{const p=t[i-1];return{...r,dTop:p?r.top-p.top:null,dVol:p&&p.volume>0?Math.round((r.volume-p.volume)/p.volume*100):null}})}
