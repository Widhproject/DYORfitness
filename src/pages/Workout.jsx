import {useEffect,useState} from 'react'
import {useNavigate,useParams} from 'react-router-dom'
import {ChevronLeft,Trash2,Check,Copy} from 'lucide-react'
import {supabase} from '../supabase'
import {CATS,catC,useAuth,vol} from '../lib'
import {useDoc,resolveConflict} from '../sync'
import {HeroArt,MuscleFigure} from '../art'
import {ExerciseGuide} from '../guide'
import ExercisePicker from './ExercisePicker'
import {useRest} from '../rest'
const uuid=()=>crypto.randomUUID(),now=()=>new Date().toISOString(),vals=o=>Object.values(o||{})
const nest=L=>vals(L.sessions).sort((a,b)=>(a.created_at||'')<(b.created_at||'')?-1:1).map(s=>({...s,ex:vals(L.exercises).filter(e=>e.session_id===s.id).sort((a,b)=>a.position-b.position).map(e=>({...e,sets:vals(L.sets).filter(t=>t.workout_exercise_id===e.id).sort((a,b)=>a.set_no-b.set_no)}))}))
const desc=(t,r)=>!r?'(dihapus)':t==='sets'?`${r.weight} kg × ${r.reps} (${r.set_type})`:t==='sessions'?`${r.category}${r.notes?` · "${r.notes}"`:''}`:(r.exercise_name||'exercise')
function SetRow({s,n,mut,onDone}){
 const [v,setV]=useState({weight:s.weight,reps:s.reps,rpe:s.rpe??''})
 const upd=p=>mut(L=>{L.sets[s.id]={...L.sets[s.id],...p}})
 const save=()=>upd({weight:+v.weight||0,reps:Math.round(+v.reps)||0,rpe:v.rpe===''?null:+v.rpe})
 const inp=(k,ph,w)=><input type="number" min="0" step="any" placeholder={ph} className={`input ${w} text-center`} value={v[k]} onChange={e=>setV({...v,[k]:e.target.value})} onBlur={save}/>
 return <div className="flex flex-wrap items-center gap-2"><span className="w-6 text-zinc-500 text-sm">{n}</span>
  <select className="bg-black/40 border border-white/10 rounded-lg text-xs py-2" value={s.set_type||'working'} onChange={e=>upd({set_type:e.target.value})}><option value="working">Work</option><option value="warmup">Warm</option><option value="drop">Drop</option><option value="failure">Fail</option></select>
  {inp('weight','kg','w-24')}<span>×</span>{inp('reps','reps','w-20')}{inp('rpe','RPE','w-16')}
  <button onClick={()=>{save();onDone()}} title="Selesai & mulai rest"><Check size={18} className="text-lime"/></button>
  <button onClick={()=>mut(L=>{delete L.sets[s.id]})} title="Delete set"><Trash2 size={16} className="text-zinc-500"/></button></div>}
export default function Workout(){
 const {date}=useParams(),nav=useNavigate(),{user}=useAuth(),uid=user.id,rest=useRest(),{doc,mut,refresh}=useDoc('day',date),[picker,setPicker]=useState(null),[guide,setGuide]=useState(null),[ref,setRef]=useState({})
 const ss=doc?nest(doc.L):[],exIds=ss.flatMap(s=>s.ex.map(e=>e.exercise_id)).join()
 useEffect(()=>{const ids=[...new Set(exIds.split(',').filter(Boolean))];if(!ids.length||!navigator.onLine){setRef({});return}
  supabase.from('workout_sets').select('weight,reps,workout_exercises!inner(exercise_id,workout_sessions!inner(date))').in('workout_exercises.exercise_id',ids).lt('workout_exercises.workout_sessions.date',date).neq('set_type','warmup').limit(500)
   .then(({data})=>{const m={};(data||[]).forEach(r=>{const e=r.workout_exercises,d=e.workout_sessions.date;if(!m[e.exercise_id]||d>m[e.exercise_id].d)m[e.exercise_id]={d,s:[]};if(m[e.exercise_id].d===d)m[e.exercise_id].s.push(`${r.weight}×${r.reps}`)});setRef(m)})},[exIds,date])
 if(!doc)return <p className="text-zinc-400">Memuat…</p>
 const addSession=c=>mut(L=>{const id=uuid();L.sessions[id]={id,user_id:uid,date,category:c,notes:null,program_name:null,day_label:null,created_at:now()}})
 const mkSet=(eid,no,w,r,t='working')=>{const id=uuid();return{id,user_id:uid,workout_exercise_id:eid,set_no:no,weight:w,reps:r,rpe:null,set_type:t,created_at:now()}}
 const addEx=(s,e)=>{setPicker(null);mut(L=>{const id=uuid();L.exercises[id]={id,user_id:uid,session_id:s.id,exercise_id:e.id,position:s.ex.length,exercise_name:e.name,created_at:now(),_ex:{name:e.name,muscle_group:e.muscle_group,exercise_category:e.exercise_category,primary_muscle_group:e.primary_muscle_group,secondary_muscle_groups:e.secondary_muscle_groups}};const t=mkSet(id,1,0,10);L.sets[t.id]=t})}
 const addSet=we=>mut(L=>{const l=we.sets.at(-1),t=mkSet(we.id,(l?.set_no||0)+1,l?.weight||0,l?.reps||10);L.sets[t.id]=t})
 const delEx=we=>confirm('Hapus exercise ini dari sesi?')&&mut(L=>{vals(L.sets).filter(t=>t.workout_exercise_id===we.id).forEach(t=>delete L.sets[t.id]);delete L.exercises[we.id]})
 const delSession=s=>confirm('Hapus seluruh sesi ini?')&&mut(L=>{s.ex.forEach(e=>{vals(L.sets).filter(t=>t.workout_exercise_id===e.id).forEach(t=>delete L.sets[t.id]);delete L.exercises[e.id]});delete L.sessions[s.id]})
 const dup=async s=>{if(!navigator.onLine)return alert('Duplikasi sesi butuh koneksi internet');const {data}=await supabase.from('workout_sessions').select('workout_exercises(exercise_id,position,exercises(name,muscle_group,exercise_category,primary_muscle_group,secondary_muscle_groups),workout_sets(set_no,weight,reps,rpe,set_type))').eq('category',s.category).lt('date',date).order('date',{ascending:false}).limit(1)
  const p=data?.[0];if(!p||!p.workout_exercises.length)return alert('Tidak ada sesi sebelumnya untuk kategori ini')
  mut(L=>{for(const e of p.workout_exercises){const id=uuid();L.exercises[id]={id,user_id:uid,session_id:s.id,exercise_id:e.exercise_id,position:e.position,exercise_name:e.exercises.name,created_at:now(),_ex:e.exercises};for(const t of e.workout_sets){const n=mkSet(id,t.set_no,t.weight,t.reps,t.set_type);n.rpe=t.rpe;L.sets[n.id]=n}}})}
 const lvOf=x=>({[x.primary_muscle_group]:1,...Object.fromEntries((x.secondary_muscle_groups||[]).map(m=>[m,.4]))}),used=ss.map(s=>s.category),conf=doc.conflicts||[]
 const pick=async(c,ch)=>{await resolveConflict('day',date,c,ch);refresh()}
 return <div className="max-w-3xl mx-auto space-y-4">
  <div className="flex flex-wrap items-center gap-2"><button className="btn2" onClick={()=>nav('/calendar')}><ChevronLeft size={16}/></button>
   <h1 className="flex-1 font-extrabold text-lg">{new Date(date+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h1>
   <input type="date" className="input w-40" value={date} onChange={e=>e.target.value&&nav('/workout/'+e.target.value)}/><button className="btn2" onClick={()=>nav('/programs')}>Programs</button></div>
  {doc.dirty&&<p className="text-xs text-orange-400">Perubahan di tanggal ini belum tersinkron ke server.</p>}
  {conf.length>0&&<div className="card space-y-2 border-red-500/40"><b className="text-red-400">Konflik: data ini diubah di perangkat lain</b>{conf.map(c=><div key={c.t+c.id} className="text-sm space-y-1"><div>Lokal: {desc(c.t,c.local)} · Server: {desc(c.t,c.server)}</div>
   <div className="flex gap-2"><button className="btn2 text-xs" onClick={()=>pick(c,'mine')}>Pakai versi saya</button><button className="btn2 text-xs" onClick={()=>pick(c,'server')}>Pakai versi server</button></div></div>)}</div>}
  {ss.map(s=>{const c=catC(s.category),sv=s.ex.flatMap(e=>e.sets).filter(t=>t.set_type!=='warmup').reduce((a,t)=>a+vol({w:+t.weight,r:t.reps}),0)
   return <div key={s.id} className="card space-y-3 fade" style={{borderColor:c+'55'}}><div className="h-20 -mx-4 -mt-4 overflow-hidden rounded-t-2xl relative"><HeroArt cat={s.category}/><div className="absolute inset-0 bg-gradient-to-t from-card to-transparent"/></div>
    <div className="flex items-center justify-between"><div><b style={{color:c}} className="text-xl">{s.category}</b><span className="text-zinc-400 text-sm ml-2">Volume {sv.toLocaleString('id-ID')} kg</span></div>
     <div className="flex gap-2"><button className="btn2" title="Salin sesi sebelumnya" onClick={()=>dup(s)}><Copy size={16}/></button><button className="btn2" onClick={()=>delSession(s)}><Trash2 size={16}/></button></div></div>
    {s.ex.map(we=><div key={we.id} className="bg-black/30 rounded-xl p-3 space-y-2">
     <div className="flex justify-between"><button className="font-bold text-left hover:text-lime" onClick={()=>setGuide({...we._ex,name:we.exercise_name||we._ex?.name})}>{we.exercise_name||we._ex?.name}<span className="text-xs text-zinc-500 ml-2">{we._ex?.muscle_group}</span></button><button onClick={()=>delEx(we)}><Trash2 size={16} className="text-zinc-500"/></button></div>
     <div className="flex flex-wrap gap-2 text-xs">{we._ex?.exercise_category&&<span className="px-2 py-1 rounded-lg bg-white/5">{we._ex.exercise_category==='compound'?'Compound':'Isolation'}</span>}{we._ex?.muscle_group&&<span className="px-2 py-1 rounded-lg bg-white/5">{we._ex.muscle_group}</span>}{we.target_reps&&<span className="px-2 py-1 rounded-lg bg-white/5">{we.target_reps} reps</span>}{we._ex?.primary_muscle_group&&<MuscleFigure lv={lvOf(we._ex)} className="w-20 ml-auto"/>}</div>
     {(we.target_sets||we.target_reps||we.target_weight||we.target_rpe||we.rest_sec)&&<div className="text-xs text-lime">Target: {we.target_sets||'–'}×{we.target_reps||'–'}{we.target_weight?` @ ${we.target_weight} kg`:''}{we.target_rpe?` · RPE ${we.target_rpe}`:''}{we.rest_sec?` · rest ${we.rest_sec}s`:''}</div>}
     {ref[we.exercise_id]&&<div className="text-xs text-zinc-500">Terakhir ({ref[we.exercise_id].d}): {ref[we.exercise_id].s.join(', ')}</div>}
     {we.sets.map((t,i)=><SetRow key={t.id} s={t} n={i+1} mut={mut} onDone={()=>rest.p.auto_start&&rest.start(we.rest_sec||undefined)}/>)}
     <button className="btn2 text-sm" onClick={()=>addSet(we)}>+ Add Set</button></div>)}
    <button className="btn" onClick={()=>setPicker(s)}>+ Tambah exercise</button>
    <textarea className="input" placeholder="Catatan sesi" defaultValue={s.notes||''} onBlur={e=>e.target.value!==(s.notes||'')&&mut(L=>{L.sessions[s.id]={...L.sessions[s.id],notes:e.target.value||null}})}/></div>})}
  {Object.keys(CATS).some(k=>!used.includes(k))&&<div className="card"><div className="font-bold mb-3">{ss.length?'Tambah sesi lain':'Pilih jenis latihan'}</div>
   <div className="grid grid-cols-3 gap-3">{Object.entries(CATS).filter(([k])=>!used.includes(k)).map(([k,v])=><button key={k} onClick={()=>addSession(k)} className="rounded-2xl border p-4 text-left hover:bg-white/5" style={{borderColor:v.c+'66'}}><div className="font-extrabold text-lg" style={{color:v.c}}>{k}</div><div className="text-xs text-zinc-400">{v.d}</div></button>)}</div></div>}
  {guide&&<ExerciseGuide ex={guide} onClose={()=>setGuide(null)}/>}
  {picker&&<ExercisePicker cat={picker.category} onClose={()=>setPicker(null)} onPick={e=>addEx(picker,e)}/>}</div>}
