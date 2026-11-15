import {useCallback,useEffect,useRef,useState} from 'react'
import {supabase} from './supabase'
import {plan,send,fork,flatDay,flatFood} from './syncCore'
let UID='';export const setUid=u=>{UID=u||''}
const open=()=>new Promise((res,rej)=>{const r=indexedDB.open('dyorfitness',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
const tx=async(mode,f)=>{const d=await open();return new Promise((res,rej)=>{const t=d.transaction('kv',mode),q=f(t.objectStore('kv'));t.oncomplete=()=>res(q.result);t.onerror=()=>rej(t.error)})}
export const kvGet=k=>tx('readonly',s=>s.get(k)).catch(()=>undefined)
export const getUid=()=>UID
export const kvSet=async(k,v)=>{const r=await tx('readwrite',s=>s.put(v,k));if(String(k).includes(':food:'))dispatchEvent(new Event('dyor-food'));return r}
const locks=new Map()
export const withLock=(k,fn)=>{const p=(locks.get(k)||Promise.resolve()).then(fn);locks.set(k,p.catch(()=>{}));return p}
const kvKeys=()=>tx('readonly',s=>s.getAllKeys()).catch(()=>[])
let st={state:navigator.onLine?'online':'offline',pending:0,msg:''};const subs=new Set()
const set=p=>{st={...st,...p};subs.forEach(f=>f(st))}
export const useSync=()=>{const [s,setS]=useState(st);useEffect(()=>{subs.add(setS);return()=>subs.delete(setS)},[]);return s}
export async function cached(key,fn){try{const r=await fn();if(!r.error){await kvSet(UID+':'+key,r.data);return r.data}}catch{}return (await kvGet(UID+':'+key))||[]}
const KINDS={
 day:{tables:{sessions:'workout_sessions',exercises:'workout_exercises',sets:'workout_sets'},empty:()=>({sessions:{},exercises:{},sets:{}}),
  async pull(d){const {data,error}=await supabase.from('workout_sessions').select('*,workout_exercises(*,exercises(name,muscle_group,exercise_category,primary_muscle_group,secondary_muscle_groups),workout_sets(*))').eq('date',d);if(error)throw error;return flatDay(data)}},
 food:{tables:{food:'food_logs'},empty:()=>({food:{}}),
  async pull(d){const {data,error}=await supabase.from('food_logs').select('*,food_database(*)').eq('date',d);if(error)throw error;return flatFood(data)}}}
async function refreshPending(){let n=0;for(const k of await kvKeys())if(String(k).startsWith(UID+':')&&/:(day|food):/.test(k)&&(await kvGet(k))?.dirty)n++;set({pending:n})}
const busy=new Set()
export async function syncDoc(kind,date){const key=`${UID}:${kind}:${date}`,cfg=KINDS[kind],doc=await kvGet(key)
 if(!doc?.dirty||!navigator.onLine||busy.has(key))return;busy.add(key);set({state:'syncing'})
 try{const startL=JSON.stringify(doc.L),V=await cfg.pull(date),T=Object.keys(cfg.tables),p=plan(doc.S,doc.L,V,T)
  if(p.conflicts.length){await withLock(key,async()=>{const c=await kvGet(key);await kvSet(key,{...c,conflicts:p.conflicts})});set({state:'failed',msg:`${p.conflicts.length} konflik: pilih versi di halaman terkait`});return}
  for(const t of T)if(p.ups[t].length){const {error}=await supabase.from(cfg.tables[t]).upsert(p.ups[t].map(send));if(error)throw error}
  for(const t of [...T].reverse())if(p.dels[t].length){const {error}=await supabase.from(cfg.tables[t]).delete().in('id',p.dels[t]);if(error)throw error}
  const F=await cfg.pull(date)
  await withLock(key,async()=>{const cur=await kvGet(key);await kvSet(key,JSON.stringify(cur.L)===startL?fork({S:F,L:F,dirty:false}):{...cur,S:F,conflicts:undefined,dirty:true})})  // edit baru saat sync tetap aman
  set({state:'synced',msg:''})}
 catch(e){set({state:'failed',msg:e.message||'Gagal sinkron'})}finally{busy.delete(key);refreshPending()}}
export async function syncAll(){for(const k of await kvKeys()){const m=String(k).match(/^(.+?):(day|food):(.+)$/);if(m&&m[1]===UID)await syncDoc(m[2],m[3])}refreshPending()}
let inited=false
export function initSync(){if(inited)return;inited=true;refreshPending()
 addEventListener('online',()=>{set({state:'online'});syncAll()});addEventListener('offline',()=>set({state:'offline'}))
 document.addEventListener('visibilitychange',()=>document.visibilityState==='visible'&&syncAll());setInterval(()=>navigator.onLine&&st.pending>0&&syncAll(),20000);navigator.onLine&&syncAll()}
export function useDoc(kind,date){
 const [doc,setDoc]=useState(null),cur=useRef({key:'',doc:null}),tm=useRef(),key=`${UID}:${kind}:${date}`
 // hasil async milik tanggal/dokumen lain dibuang, supaya riwayat tidak tertimpa saat pindah tanggal
 const put=(k,d)=>{if(cur.current.key!==k)return;cur.current={key:k,doc:d};setDoc(d)}
 const refresh=useCallback(async()=>{const cfg=KINDS[kind];let d=await kvGet(key)
  if(!d?.dirty&&navigator.onLine){try{const F=await cfg.pull(date);d=fork({S:F,L:F,dirty:false});await withLock(key,()=>kvSet(key,d))}catch{}}
  if(!d)d={S:cfg.empty(),L:cfg.empty(),dirty:false}
  put(key,d);refreshPending();if(d.dirty&&navigator.onLine){await syncDoc(kind,date);put(key,await kvGet(key))}},[key])
 useEffect(()=>{cur.current={key,doc:null};setDoc(null);refresh();return()=>{clearTimeout(tm.current);syncDoc(kind,date)}},[refresh])
 const flushLater=()=>{clearTimeout(tm.current);tm.current=setTimeout(async()=>{await syncDoc(kind,date);const n=await kvGet(key);n&&put(key,n)},1200)}
 // setiap perubahan dibaca ulang dari penyimpanan lokal di dalam lock, lalu ditulis sebagai baris ber-id (upsert), bukan menimpa state
 const mut=fn=>cur.current.key!==key||!cur.current.doc?Promise.resolve():withLock(key,async()=>{const base=await kvGet(key)||cur.current.doc,d=fork(base);fn(d.L);d.dirty=true;await kvSet(key,d);put(key,d);refreshPending();flushLater()})
 const save=async()=>{clearTimeout(tm.current);while(busy.has(key))await new Promise(r=>setTimeout(r,100));await syncDoc(kind,date);const n=await kvGet(key);n&&put(key,n);return n}
 const discard=()=>withLock(key,async()=>{const b=await kvGet(key);if(!b)return;const d=fork({...b,L:b.S,dirty:false,conflicts:undefined});await kvSet(key,d);put(key,d);refreshPending()})
 return{doc,mut,refresh,save,discard}}
export const resolveConflict=(kind,date,c,choice)=>{const key=`${UID}:${kind}:${date}`
 return withLock(key,async()=>{const d=await kvGet(key),pt=(m,r)=>r?(m[c.t][c.id]=r):delete m[c.t][c.id]
  if(choice==='server')pt(d.L,c.server)
  pt(d.S,c.server)   // "mine": S disamakan dengan server agar perubahan lokal diterapkan
  d.conflicts=d.conflicts.filter(x=>!(x.t===c.t&&x.id===c.id));await kvSet(key,d)})}
