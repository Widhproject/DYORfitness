import {useCallback,useEffect,useRef,useState} from 'react'
import {supabase} from './supabase'
import {plan,send,fork,flatDay,flatFood} from './syncCore'
let UID='';export const setUid=u=>{UID=u||''}
const open=()=>new Promise((res,rej)=>{const r=indexedDB.open('dyorfitness',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
const tx=async(mode,f)=>{const d=await open();return new Promise((res,rej)=>{const t=d.transaction('kv',mode),q=f(t.objectStore('kv'));t.oncomplete=()=>res(q.result);t.onerror=()=>rej(t.error)})}
export const kvGet=k=>tx('readonly',s=>s.get(k)).catch(()=>undefined)
export const kvSet=(k,v)=>tx('readwrite',s=>s.put(v,k))
const kvKeys=()=>tx('readonly',s=>s.getAllKeys()).catch(()=>[])
let st={state:navigator.onLine?'online':'offline',pending:0,msg:''};const subs=new Set()
const set=p=>{st={...st,...p};subs.forEach(f=>f(st))}
export const useSync=()=>{const [s,setS]=useState(st);useEffect(()=>{subs.add(setS);return()=>subs.delete(setS)},[]);return s}
export async function cached(key,fn){try{const r=await fn();if(!r.error){await kvSet(UID+':'+key,r.data);return r.data}}catch{}return (await kvGet(UID+':'+key))||[]}
const KINDS={
 day:{tables:{sessions:'workout_sessions',exercises:'workout_exercises',sets:'workout_sets'},empty:()=>({sessions:{},exercises:{},sets:{}}),
  async pull(d){const {data,error}=await supabase.from('workout_sessions').select('*,workout_exercises(*,exercises(name,muscle_group,exercise_category),workout_sets(*))').eq('date',d);if(error)throw error;return flatDay(data)}},
 food:{tables:{food:'food_logs'},empty:()=>({food:{}}),
  async pull(d){const {data,error}=await supabase.from('food_logs').select('*,food_database(*)').eq('date',d);if(error)throw error;return flatFood(data)}}}
async function refreshPending(){let n=0;for(const k of await kvKeys())if(String(k).startsWith(UID+':')&&/:(day|food):/.test(k)&&(await kvGet(k))?.dirty)n++;set({pending:n})}
const busy=new Set()
export async function syncDoc(kind,date){const key=`${UID}:${kind}:${date}`,cfg=KINDS[kind],doc=await kvGet(key)
 if(!doc?.dirty||!navigator.onLine||busy.has(key))return;busy.add(key);set({state:'syncing'})
 try{const startL=JSON.stringify(doc.L),V=await cfg.pull(date),T=Object.keys(cfg.tables),p=plan(doc.S,doc.L,V,T)
  if(p.conflicts.length){await kvSet(key,{...doc,conflicts:p.conflicts});set({state:'failed',msg:`${p.conflicts.length} konflik: pilih versi di halaman terkait`});return}
  for(const t of T)if(p.ups[t].length){const {error}=await supabase.from(cfg.tables[t]).upsert(p.ups[t].map(send));if(error)throw error}
  for(const t of [...T].reverse())if(p.dels[t].length){const {error}=await supabase.from(cfg.tables[t]).delete().in('id',p.dels[t]);if(error)throw error}
  const F=await cfg.pull(date),cur=await kvGet(key)
  await kvSet(key,JSON.stringify(cur.L)===startL?fork({S:F,L:F,dirty:false}):{...cur,S:F,conflicts:undefined,dirty:true})  // edit baru saat sync tidak hilang
  set({state:'synced',msg:''})}
 catch(e){set({state:'failed',msg:e.message||'Gagal sinkron'})}finally{busy.delete(key);refreshPending()}}
export async function syncAll(){for(const k of await kvKeys()){const m=String(k).match(/^(.+?):(day|food):(.+)$/);if(m&&m[1]===UID)await syncDoc(m[2],m[3])}refreshPending()}
let inited=false
export function initSync(){if(inited)return;inited=true;refreshPending()
 addEventListener('online',()=>{set({state:'online'});syncAll()});addEventListener('offline',()=>set({state:'offline'}))
 document.addEventListener('visibilitychange',()=>document.visibilityState==='visible'&&syncAll());setInterval(()=>navigator.onLine&&st.pending>0&&syncAll(),20000);navigator.onLine&&syncAll()}
export function useDoc(kind,date){
 const [doc,setDoc]=useState(null),ref=useRef(null),tm=useRef(),key=`${UID}:${kind}:${date}`,put=d=>{ref.current=d;setDoc(d)}
 const refresh=useCallback(async()=>{const cfg=KINDS[kind];let d=await kvGet(key)
  if(!d?.dirty&&navigator.onLine){try{const F=await cfg.pull(date);d=fork({S:F,L:F,dirty:false});await kvSet(key,d)}catch{}}
  if(!d)d={S:cfg.empty(),L:cfg.empty(),dirty:false}
  put(d);refreshPending();if(d.dirty&&navigator.onLine){await syncDoc(kind,date);put(await kvGet(key))}},[key])
 useEffect(()=>{setDoc(null);ref.current=null;refresh();return()=>{clearTimeout(tm.current);syncDoc(kind,date)}},[refresh])
 const mut=async fn=>{if(!ref.current)return;const d=fork(ref.current);fn(d.L);d.dirty=true;await kvSet(key,d);put(d);refreshPending()
  clearTimeout(tm.current);tm.current=setTimeout(async()=>{await syncDoc(kind,date);const n=await kvGet(key);n&&put(n)},1200)}
 return{doc,mut,refresh}}
export async function resolveConflict(kind,date,c,choice){const key=`${UID}:${kind}:${date}`,d=await kvGet(key),pt=(m,r)=>r?(m[c.t][c.id]=r):delete m[c.t][c.id]
 if(choice==='server')pt(d.L,c.server);pt(d.S,c.server)  // "mine": S disamakan dgn server agar perubahan lokal diterapkan
 d.conflicts=d.conflicts.filter(x=>!(x.t===c.t&&x.id===c.id));await kvSet(key,d)}
