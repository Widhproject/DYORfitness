import {useCallback,useEffect,useState} from 'react'
import {useNavigate,useParams} from 'react-router-dom'
import {ChevronLeft,Trash2,Check,Copy} from 'lucide-react'
import {supabase} from '../supabase'
import {CATS,useAuth,vol} from '../lib'
import ExercisePicker from './ExercisePicker'
function RestTimer({k}){
 const [dur,setDur]=useState(90),[left,setLeft]=useState(0)
 useEffect(()=>{if(k)setLeft(dur)},[k])
 useEffect(()=>{if(left<=0)return;const t=setTimeout(()=>setLeft(left-1),1000);return()=>clearTimeout(t)},[left])
 return <div className="fixed bottom-20 md:bottom-4 right-4 card flex items-center gap-2 z-40 shadow-xl">
  <span className="text-lime font-extrabold w-12 text-center">{left>0?`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`:'Rest'}</span>
  <select className="input w-20" value={dur} onChange={e=>setDur(+e.target.value)}>{[60,90,120,180].map(s=><option key={s} value={s}>{s}s</option>)}</select>
  <button className="btn2" onClick={()=>setLeft(left>0?0:dur)}>{left>0?'Stop':'Start'}</button></div>}
function SetRow({s,n,reload,onDone}){
 const [v,setV]=useState({weight:s.weight,reps:s.reps,rpe:s.rpe??''})
 const save=async()=>{await supabase.from('workout_sets').update({weight:+v.weight||0,reps:Math.round(+v.reps)||0,rpe:v.rpe===''?null:+v.rpe}).eq('id',s.id)}
 const inp=(k,ph,w)=><input type="number" min="0" step="any" placeholder={ph} className={`input ${w} text-center`} value={v[k]} onChange={e=>setV({...v,[k]:e.target.value})} onBlur={save}/>
 return <div className="flex items-center gap-2"><span className="w-6 text-zinc-500 text-sm">{n}</span>{inp('weight','kg','w-24')}<span>×</span>{inp('reps','reps','w-20')}{inp('rpe','RPE','w-16')}
  <button onClick={()=>{save();onDone()}} title="Selesai & mulai rest"><Check size={18} className="text-lime"/></button>
  <button onClick={async()=>{await supabase.from('workout_sets').delete().eq('id',s.id);reload()}} title="Delete set"><Trash2 size={16} className="text-zinc-500"/></button></div>}
export default function Workout(){
 const {date}=useParams(),nav=useNavigate(),{user}=useAuth(),[ss,setSs]=useState([]),[picker,setPicker]=useState(null),[tk,setTk]=useState(0)
 const load=useCallback(async()=>{const {data}=await supabase.from('workout_sessions').select('*,workout_exercises(*,exercises(name,muscle_group),workout_sets(*))').eq('date',date).order('created_at');setSs(data||[])},[date])
 useEffect(()=>{load()},[load])
 const uid=user.id
 const addSession=async c=>{await supabase.from('workout_sessions').insert({user_id:uid,date,category:c});load()}
 const addEx=async(s,e)=>{const {data:w}=await supabase.from('workout_exercises').insert({user_id:uid,session_id:s.id,exercise_id:e.id,position:s.workout_exercises.length}).select().single()
  const {data:prev}=await supabase.from('workout_sets').select('weight,reps,workout_exercises!inner(exercise_id,workout_sessions!inner(date))').eq('workout_exercises.exercise_id',e.id).lt('workout_exercises.workout_sessions.date',date).limit(1)
  await supabase.from('workout_sets').insert({user_id:uid,workout_exercise_id:w.id,set_no:1,weight:prev?.[0]?.weight||0,reps:prev?.[0]?.reps||10});setPicker(null);load()}
 const addSet=async we=>{const l=[...we.workout_sets].sort((a,b)=>a.set_no-b.set_no).at(-1);await supabase.from('workout_sets').insert({user_id:uid,workout_exercise_id:we.id,set_no:(l?.set_no||0)+1,weight:l?.weight||0,reps:l?.reps||10});load()}
 const dup=async s=>{const {data}=await supabase.from('workout_sessions').select('workout_exercises(exercise_id,position,workout_sets(set_no,weight,reps,rpe))').eq('category',s.category).lt('date',date).order('date',{ascending:false}).limit(1)
  const p=data?.[0];if(!p||!p.workout_exercises.length)return alert('Tidak ada sesi sebelumnya untuk kategori ini')
  for(const e of p.workout_exercises){const {data:n}=await supabase.from('workout_exercises').insert({user_id:uid,session_id:s.id,exercise_id:e.exercise_id,position:e.position}).select().single()
   if(e.workout_sets.length)await supabase.from('workout_sets').insert(e.workout_sets.map(t=>({...t,user_id:uid,workout_exercise_id:n.id})))}load()}
 const delSession=async s=>{if(confirm('Hapus seluruh sesi ini?')){await supabase.from('workout_sessions').delete().eq('id',s.id);load()}}
 const used=ss.map(s=>s.category)
 return <div className="max-w-3xl mx-auto space-y-4">
  <div className="flex items-center gap-2"><button className="btn2" onClick={()=>nav('/calendar')}><ChevronLeft size={16}/></button>
   <h1 className="flex-1 font-extrabold text-lg">{new Date(date+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h1>
   <input type="date" className="input w-40" value={date} onChange={e=>e.target.value&&nav('/workout/'+e.target.value)}/></div>
  {ss.map(s=>{const c=CATS[s.category].c,sv=s.workout_exercises.flatMap(w=>w.workout_sets).reduce((a,t)=>a+vol({w:+t.weight,r:t.reps}),0)
   return <div key={s.id} className="card space-y-3 fade" style={{borderColor:c+'55'}}>
    <div className="flex items-center justify-between"><div><b style={{color:c}} className="text-xl">{s.category}</b><span className="text-zinc-400 text-sm ml-2">Volume {sv.toLocaleString('id-ID')} kg</span></div>
     <div className="flex gap-2"><button className="btn2" title="Salin sesi sebelumnya" onClick={()=>dup(s)}><Copy size={16}/></button><button className="btn2" onClick={()=>delSession(s)}><Trash2 size={16}/></button></div></div>
    {[...s.workout_exercises].sort((a,b)=>a.position-b.position).map(we=><div key={we.id} className="bg-black/30 rounded-xl p-3 space-y-2">
     <div className="flex justify-between"><b>{we.exercises.name}<span className="text-xs text-zinc-500 ml-2">{we.exercises.muscle_group}</span></b>
      <button onClick={async()=>{if(confirm('Hapus exercise ini dari sesi?')){await supabase.from('workout_exercises').delete().eq('id',we.id);load()}}}><Trash2 size={16} className="text-zinc-500"/></button></div>
     {[...we.workout_sets].sort((a,b)=>a.set_no-b.set_no).map((t,i)=><SetRow key={t.id} s={t} n={i+1} reload={load} onDone={()=>setTk(tk+1)}/>)}
     <button className="btn2 text-sm" onClick={()=>addSet(we)}>+ Add Set</button></div>)}
    <button className="btn" onClick={()=>setPicker(s)}>+ Tambah exercise</button>
    <textarea className="input" placeholder="Catatan sesi" defaultValue={s.notes||''} onBlur={e=>supabase.from('workout_sessions').update({notes:e.target.value}).eq('id',s.id)}/></div>})}
  {used.length<3&&<div className="card"><div className="font-bold mb-3">{ss.length?'Tambah sesi lain':'Pilih jenis latihan'}</div>
   <div className="grid grid-cols-3 gap-3">{Object.entries(CATS).filter(([k])=>!used.includes(k)).map(([k,v])=><button key={k} onClick={()=>addSession(k)} className="rounded-2xl border p-4 text-left hover:bg-white/5" style={{borderColor:v.c+'66'}}><div className="font-extrabold text-lg" style={{color:v.c}}>{k}</div><div className="text-xs text-zinc-400">{v.d}</div></button>)}</div></div>}
  <RestTimer k={tk}/>
  {picker&&<ExercisePicker cat={picker.category} onClose={()=>setPicker(null)} onPick={e=>addEx(picker,e)}/>}</div>}
