import {useEffect,useState} from 'react'
import {useNavigate,useParams} from 'react-router-dom'
import {ChevronLeft,Trash2,Check,Copy} from 'lucide-react'
import {supabase} from '../supabase'
import {CATS,catC,useAuth,vol} from '../lib'
import {useDoc,useSync,resolveConflict} from '../sync'
import {copySets,latestBefore,pristine} from '../history'
import {toast} from '../toast'
import {HeroArt,MuscleFigure} from '../art'
import {ExerciseGuide} from '../guide'
import ExercisePicker from './ExercisePicker'
import {useRest} from '../rest'
const uuid=()=>crypto.randomUUID(),now=()=>new Date().toISOString(),vals=o=>Object.values(o||{})
const fmt=d=>new Date(d+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})
const nest=L=>vals(L.sessions).sort((a,b)=>(a.created_at||'')<(b.created_at||'')?-1:1).map(s=>({...s,ex:vals(L.exercises).filter(e=>e.session_id===s.id).sort((a,b)=>a.position-b.position).map(e=>({...e,sets:vals(L.sets).filter(t=>t.workout_exercise_id===e.id).sort((a,b)=>a.set_no-b.set_no)}))}))
const desc=(t,r)=>!r?'(dihapus)':t==='sets'?`${r.weight} kg × ${r.reps} (${r.set_type})`:t==='sessions'?`${r.category}${r.notes?` · "${r.notes}"`:''}`:(r.exercise_name||'exercise')
function SaveBar({doc,sync,onSave,onDiscard}){
 const st=!doc.dirty?'saved':sync.state==='failed'?'failed':!navigator.onLine?'offline':'saving'
 const label={saved:'Saved ✓',saving:'Saving…',offline:'Offline: tersimpan di perangkat, menunggu internet',failed:'Failed to save'}[st]
 return <div className="sticky top-0 z-30 -mx-4 md:-mx-8 px-4 md:px-8 py-2 bg-ink/90 backdrop-blur border-b border-white/5 flex flex-wrap items-center gap-3 text-sm" role="status">
  <span className={st==='saved'?'text-lime':st==='failed'?'text-red-400':'text-orange-300'}>{label}</span>
  {st==='failed'&&<><span className="text-xs text-zinc-500 truncate max-w-[40vw]">{sync.msg}</span><button className="text-lime underline" onClick={onSave}>Coba lagi</button></>}
  {doc.dirty&&<button className="text-zinc-400 underline" onClick={onDiscard}>Batalkan perubahan</button>}
  <button className="btn !py-1 ml-auto" onClick={onSave}>Save Workout</button></div>}
function Prev({p,onCopy,onHist}){
 return <div className="rounded-lg bg-black/30 p-2 text-xs space-y-1">
  <div className="flex flex-wrap justify-between gap-2"><span className="text-zinc-400">{p?<>Last Workout: <b className="text-zinc-200">{fmt(p.date)}</b></>:'Belum ada riwayat sebelumnya untuk exercise ini.'}</span>
   <span className="flex gap-3">{p&&<button className="text-lime" onClick={onCopy}>Copy Previous Sets</button>}<button className="text-lime" onClick={onHist}>View Exercise History</button></span></div>
  {p&&<table className="w-full"><thead className="text-zinc-500 text-left"><tr><th>Set</th><th>Previous Weight</th><th>Previous Reps</th><th></th></tr></thead>
   <tbody>{p.sets.map(s=><tr key={s.set_no}><td>{s.set_no}</td><td>{s.weight} kg</td><td>{s.reps}</td><td className="text-zinc-500">{s.set_type!=='working'?s.set_type==='warmup'?'warm-up':s.set_type:''}</td></tr>)}</tbody></table>}</div>}
function SetRow({s,n,mut,onDone,onDel}){
 const [v,setV]=useState({weight:s.weight,reps:s.reps,rpe:s.rpe??'',rir:s.rir??''}),done=!!s.completed
 const upd=p=>mut(L=>{if(L.sets[s.id])L.sets[s.id]={...L.sets[s.id],...p}})
 const save=()=>upd({weight:+v.weight||0,reps:Math.round(+v.reps)||0,rpe:v.rpe===''?null:+v.rpe,rir:v.rir===''?null:+v.rir})
 const inp=(k,ph,w)=><input type="number" inputMode="decimal" min="0" step="any" aria-label={ph} placeholder={ph} className={`input ${w} text-center !px-1`} value={v[k]} onChange={e=>setV({...v,[k]:e.target.value})} onBlur={save} onFocus={e=>e.target.select()}/>
 return <div className="flex flex-wrap items-center gap-2"><span className="w-5 text-zinc-500 text-sm">{n}</span>
  <select aria-label="Tipe set" className="bg-black/40 border border-white/10 rounded-lg text-xs py-2" value={s.set_type||'working'} onChange={e=>upd({set_type:e.target.value})}><option value="working">Work</option><option value="warmup">Warm</option><option value="drop">Drop</option><option value="failure">Fail</option></select>
  {inp('weight','kg','w-20')}<span>×</span>{inp('reps','reps','w-16')}{inp('rpe','RPE','w-14')}{inp('rir','RIR','w-14')}
  <button aria-label={done?'Tandai belum selesai':'Tandai selesai'} aria-pressed={done} onClick={()=>{save();upd({completed:!done});if(!done)onDone()}} className={`w-9 h-9 rounded-full grid place-items-center border ${done?'bg-lime border-lime text-black':'border-white/20 text-zinc-400'}`}><Check size={16}/></button>
  <button aria-label="Hapus set" onClick={()=>onDel(s)}><Trash2 size={16} className="text-zinc-500"/></button></div>}
export default function Workout(){
 const {date}=useParams(),nav=useNavigate(),{user}=useAuth(),uid=user.id,rest=useRest(),sync=useSync(),{doc,mut,refresh,save,discard}=useDoc('day',date),[picker,setPicker]=useState(null),[guide,setGuide]=useState(null),[prev,setPrev]=useState({})
 const ss=doc?nest(doc.L):[],exIds=ss.flatMap(s=>s.ex.map(e=>e.exercise_id)).join()
 useEffect(()=>{const ids=[...new Set(exIds.split(',').filter(Boolean))];if(!ids.length||!navigator.onLine){setPrev({});return}
  supabase.from('workout_exercises').select('exercise_id,workout_sessions!inner(date),workout_sets(set_no,weight,reps,set_type,rpe,rir)').in('exercise_id',ids).lt('workout_sessions.date',date).limit(1000)
   .then(({data})=>{const by={};for(const r of data||[])(by[r.exercise_id]??=[]).push({date:r.workout_sessions.date,sets:r.workout_sets});const m={};for(const k in by)m[k]=latestBefore(by[k],date);setPrev(m)})},[exIds,date])
 useEffect(()=>{if(!doc?.dirty)return;const h=e=>{e.preventDefault();e.returnValue=''};addEventListener('beforeunload',h);return()=>removeEventListener('beforeunload',h)},[doc?.dirty])
 if(!doc)return <p className="text-zinc-400">Memuat…</p>
 const mkSet=(eid,no,w,r,t='working')=>({id:uuid(),user_id:uid,workout_exercise_id:eid,set_no:no,weight:w,reps:r,rpe:null,rir:null,set_type:t,completed:false,created_at:now()})
 const addSession=c=>mut(L=>{const id=uuid();L.sessions[id]={id,user_id:uid,date,category:c,name:null,notes:null,status:'draft',program_name:null,day_label:null,created_at:now()}})
 const addEx=(s,e)=>{setPicker(null);mut(L=>{const id=uuid();L.exercises[id]={id,user_id:uid,session_id:s.id,exercise_id:e.id,position:s.ex.length,exercise_name:e.name,created_at:now(),_ex:{name:e.name,muscle_group:e.muscle_group,exercise_category:e.exercise_category,primary_muscle_group:e.primary_muscle_group,secondary_muscle_groups:e.secondary_muscle_groups}};const t=mkSet(id,1,0,10);L.sets[t.id]=t})}
 const addSet=we=>mut(L=>{const l=we.sets.at(-1),t=mkSet(we.id,(l?.set_no||0)+1,l?.weight||0,l?.reps||10);L.sets[t.id]=t})
 const delSet=s=>{mut(L=>{delete L.sets[s.id]});toast('Set dihapus',{undo:()=>mut(L=>{L.sets[s.id]=s})})}
 const delEx=we=>confirm('Hapus exercise ini beserta seluruh setnya dari sesi ini? Sesi lain tidak terpengaruh.')&&mut(L=>{vals(L.sets).filter(t=>t.workout_exercise_id===we.id).forEach(t=>delete L.sets[t.id]);delete L.exercises[we.id]})
 const delSession=s=>confirm(`Hapus sesi ${s.name||s.category} tanggal ${fmt(date)}? Hanya sesi ini yang dihapus.`)&&mut(L=>{s.ex.forEach(e=>{vals(L.sets).filter(t=>t.workout_exercise_id===e.id).forEach(t=>delete L.sets[t.id]);delete L.exercises[e.id]});delete L.sessions[s.id]})
 const patchSession=(s,p)=>mut(L=>{if(L.sessions[s.id])L.sessions[s.id]={...L.sessions[s.id],...p}})
 const copyPrev=(we,p)=>mut(L=>{vals(L.sets).filter(t=>t.workout_exercise_id===we.id&&pristine(t)).forEach(t=>delete L.sets[t.id])
  const base=vals(L.sets).filter(t=>t.workout_exercise_id===we.id).length;copySets(p.sets,uuid).forEach((t,i)=>{L.sets[t.id]={...t,user_id:uid,workout_exercise_id:we.id,set_no:base+i+1,created_at:now()}})}).then(()=>toast('Set sebelumnya disalin sebagai data baru'))
 const dup=async s=>{if(!navigator.onLine)return alert('Duplikasi sesi butuh koneksi internet');const {data}=await supabase.from('workout_sessions').select('workout_exercises(exercise_id,position,exercises(name,muscle_group,exercise_category,primary_muscle_group,secondary_muscle_groups),workout_sets(set_no,weight,reps,rpe,rir,set_type))').eq('category',s.category).lt('date',date).order('date',{ascending:false}).limit(1)
  const p=data?.[0];if(!p||!p.workout_exercises.length)return alert('Tidak ada sesi sebelumnya untuk kategori ini')
  mut(L=>{for(const e of p.workout_exercises){const id=uuid();L.exercises[id]={id,user_id:uid,session_id:s.id,exercise_id:e.exercise_id,position:e.position,exercise_name:e.exercises.name,created_at:now(),_ex:e.exercises};copySets(e.workout_sets,uuid).forEach(t=>{L.sets[t.id]={...t,user_id:uid,workout_exercise_id:id,created_at:now()}})}})}
 const onSave=async()=>{const d=await save();toast(d&&!d.dirty?'Workout tersimpan di server':'Belum tersinkron; akan dicoba lagi otomatis')}
 const lvOf=x=>({[x.primary_muscle_group]:1,...Object.fromEntries((x.secondary_muscle_groups||[]).map(m=>[m,.4]))})
 const conf=doc.conflicts||[],pick=async(c,ch)=>{await resolveConflict('day',date,c,ch);refresh()}
 return <div className="max-w-3xl mx-auto space-y-4">
  <SaveBar doc={doc} sync={sync} onSave={onSave} onDiscard={()=>confirm('Buang semua perubahan yang belum tersinkron pada tanggal ini?')&&discard()}/>
  <div className="flex flex-wrap items-center gap-2"><button className="btn2" aria-label="Kembali ke kalender" onClick={()=>nav('/calendar')}><ChevronLeft size={16}/></button>
   <div className="flex-1 min-w-40"><h1 className="font-extrabold text-lg leading-tight">{fmt(date)}</h1><div className="text-xs text-zinc-400">{ss.length?ss.map(s=>s.name||s.category).join(' · '):'Belum ada sesi'}</div></div>
   <input type="date" aria-label="Pilih tanggal" className="input w-40" value={date} onChange={e=>e.target.value&&nav('/workout/'+e.target.value)}/><button className="btn2" onClick={()=>nav('/programs')}>Programs</button><button className="btn2" onClick={()=>nav('/progress')}>View History</button></div>
  {conf.length>0&&<div className="card space-y-2 border-red-500/40"><b className="text-red-400">Konflik: data ini diubah di perangkat lain</b>{conf.map(c=><div key={c.t+c.id} className="text-sm space-y-1"><div>Lokal: {desc(c.t,c.local)} · Server: {desc(c.t,c.server)}</div>
   <div className="flex gap-2"><button className="btn2 text-xs" onClick={()=>pick(c,'mine')}>Pakai versi saya</button><button className="btn2 text-xs" onClick={()=>pick(c,'server')}>Pakai versi server</button></div></div>)}</div>}
  {ss.map((s,si)=>{const c=catC(s.category),sv=s.ex.flatMap(e=>e.sets).filter(t=>t.set_type!=='warmup').reduce((a,t)=>a+vol({w:+t.weight,r:t.reps}),0),same=ss.filter(x=>x.category===s.category),title=s.name||s.category+(same.length>1?` · Sesi ${same.indexOf(s)+1}`:'')
   return <div key={s.id} className="card space-y-3 fade" style={{borderColor:c+'55'}}>
    <div className="h-20 -mx-4 -mt-4 overflow-hidden rounded-t-2xl relative"><HeroArt cat={s.category}/><div className="absolute inset-0 bg-gradient-to-t from-card to-transparent"/></div>
    <div className="flex flex-wrap items-center justify-between gap-2"><div><b style={{color:c}} className="text-xl">{title}</b><span className="text-zinc-400 text-sm ml-2">Volume {sv.toLocaleString('id-ID')} kg</span></div>
     <div className="flex gap-2"><button className={s.status==='completed'?'btn !py-1':'btn2 !py-1'} aria-pressed={s.status==='completed'} onClick={()=>patchSession(s,{status:s.status==='completed'?'draft':'completed'})}>{s.status==='completed'?'Completed ✓':'Draft'}</button>
      <button className="btn2" title="Salin sesi sebelumnya" aria-label="Salin sesi sebelumnya" onClick={()=>dup(s)}><Copy size={16}/></button><button className="btn2" aria-label="Hapus sesi" onClick={()=>delSession(s)}><Trash2 size={16}/></button></div></div>
    <input className="input" placeholder="Nama workout (opsional)" aria-label="Nama workout" defaultValue={s.name||''} onBlur={e=>e.target.value!==(s.name||'')&&patchSession(s,{name:e.target.value.trim()||null})}/>
    {s.ex.map(we=><div key={we.id} className="bg-black/30 rounded-xl p-3 space-y-2">
     <div className="flex justify-between"><button className="font-bold text-left hover:text-lime" onClick={()=>setGuide({...we._ex,name:we.exercise_name||we._ex?.name})}>{we.exercise_name||we._ex?.name}<span className="text-xs text-zinc-500 ml-2">{we._ex?.muscle_group}</span></button><button aria-label="Hapus exercise" onClick={()=>delEx(we)}><Trash2 size={16} className="text-zinc-500"/></button></div>
     <div className="flex flex-wrap gap-2 text-xs">{we._ex?.exercise_category&&<span className="px-2 py-1 rounded-lg bg-white/5">{we._ex.exercise_category==='compound'?'Compound':'Isolation'}</span>}{we._ex?.muscle_group&&<span className="px-2 py-1 rounded-lg bg-white/5">{we._ex.muscle_group}</span>}{we.target_reps&&<span className="px-2 py-1 rounded-lg bg-white/5">{we.target_reps} reps</span>}{we._ex?.primary_muscle_group&&<MuscleFigure lv={lvOf(we._ex)} className="w-20 ml-auto"/>}</div>
     {(we.target_sets||we.target_reps||we.target_weight||we.target_rpe||we.rest_sec)&&<div className="text-xs text-lime">Target: {we.target_sets||'–'}×{we.target_reps||'–'}{we.target_weight?` @ ${we.target_weight} kg`:''}{we.target_rpe?` · RPE ${we.target_rpe}`:''}{we.rest_sec?` · rest ${we.rest_sec}s`:''}</div>}
     <Prev p={prev[we.exercise_id]} onCopy={()=>copyPrev(we,prev[we.exercise_id])} onHist={()=>nav('/exercise/'+we.exercise_id)}/>
     {we.sets.map((t,i)=><SetRow key={t.id} s={t} n={i+1} mut={mut} onDone={()=>rest.p.auto_start&&rest.start(we.rest_sec||undefined)} onDel={delSet}/>)}
     <button className="btn2 text-sm" onClick={()=>addSet(we)}>+ Add Set</button></div>)}
    <button className="btn" onClick={()=>setPicker(s)}>+ Tambah exercise</button>
    <textarea className="input" placeholder="Catatan sesi" aria-label="Catatan sesi" defaultValue={s.notes||''} onBlur={e=>e.target.value!==(s.notes||'')&&patchSession(s,{notes:e.target.value||null})}/></div>})}
  <div className="card"><div className="font-bold mb-3">{ss.length?'Tambah sesi lain':'Pilih jenis latihan'}</div>
   <div className="grid grid-cols-3 gap-3">{Object.entries(CATS).map(([k,v])=><button key={k} onClick={()=>addSession(k)} className="rounded-2xl border p-4 text-left hover:bg-white/5" style={{borderColor:v.c+'66'}}><div className="font-extrabold text-lg" style={{color:v.c}}>{k}</div><div className="text-xs text-zinc-400">{v.d}</div></button>)}</div></div>
  {guide&&<ExerciseGuide ex={guide} onClose={()=>setGuide(null)}/>}
  {picker&&<ExercisePicker cat={picker.category} onClose={()=>setPicker(null)} onPick={e=>addEx(picker,e)}/>}</div>}
