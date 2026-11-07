import {useCallback,useEffect,useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Star,Copy,Trash2,ChevronUp,ChevronDown,Play} from 'lucide-react'
import {supabase} from '../supabase'
import {useAuth,iso,catC} from '../lib'
import {cached} from '../sync'
import ExercisePicker from './ExercisePicker'
const CS=['PUSH','PULL','LEGS','UPPER','LOWER','CUSTOM'],WD=['Sen','Sel','Rab','Kam','Jum','Sab','Min']
const PRE={'PPL 6 Days':[['Push A','PUSH',0],['Pull A','PULL',1],['Legs A','LEGS',2],['Push B','PUSH',3],['Pull B','PULL',4],['Legs B','LEGS',5]],'PPL 3 Days':[['Push','PUSH',0],['Pull','PULL',2],['Legs','LEGS',4]],
 'Upper Lower':[['Upper A','UPPER',0],['Lower A','LOWER',1],['Upper B','UPPER',3],['Lower B','LOWER',4]],'Bro Split':[['Chest','CUSTOM',0],['Back','CUSTOM',1],['Shoulders','CUSTOM',2],['Arms','CUSTOM',3],['Legs','LOWER',4]],
 'Full Body':[['Full Body A','CUSTOM',0],['Full Body B','CUSTOM',2],['Full Body C','CUSTOM',4]],'Custom Program':[]}
export default function Programs(){
 const {user}=useAuth(),uid=user.id,nav=useNavigate(),[ps,setPs]=useState(null),[name,setName]=useState(''),[pre,setPre]=useState('PPL 6 Days'),[open,setOpen]=useState(null),[picker,setPicker]=useState(null),today=(new Date().getDay()+6)%7
 const load=useCallback(async()=>{setPs(await cached('programs',()=>supabase.from('workout_programs').select('*,workout_program_days(*,workout_program_exercises(*,exercises(name,muscle_group)))').order('created_at')))},[])
 useEffect(()=>{load()},[load])
 const sorted=a=>[...a].sort((x,y)=>x.position-y.position)
 const create=async()=>{if(!name.trim())return alert('Isi nama program');const {data:p,error}=await supabase.from('workout_programs').insert({user_id:uid,name:name.trim()}).select().single();if(error)return alert(error.message)
  if(PRE[pre].length)await supabase.from('workout_program_days').insert(PRE[pre].map(([l,c,w],i)=>({user_id:uid,program_id:p.id,day_label:l,category:c,weekday:w,position:i})));setName('');setOpen(p.id);load()}
 const dup=async p=>{const {data:n}=await supabase.from('workout_programs').insert({user_id:uid,name:p.name+' (copy)'}).select().single()
  for(const d of sorted(p.workout_program_days)){const {data:nd}=await supabase.from('workout_program_days').insert({user_id:uid,program_id:n.id,day_label:d.day_label,weekday:d.weekday,category:d.category,position:d.position}).select().single()
   if(d.workout_program_exercises.length)await supabase.from('workout_program_exercises').insert(d.workout_program_exercises.map(({id,exercises,...e})=>({...e,user_id:uid,day_id:nd.id})))}load()}
 const upd=(t,id,v)=>supabase.from(t).update(v).eq('id',id).then(load)
 const del=async(t,id,m)=>{if(confirm(m)){await supabase.from(t).delete().eq('id',id);load()}}
 const addDay=async p=>{await supabase.from('workout_program_days').insert({user_id:uid,program_id:p.id,day_label:'Hari '+(p.workout_program_days.length+1),category:'CUSTOM',position:p.workout_program_days.length});load()}
 const addEx=async e=>{const d=picker;await supabase.from('workout_program_exercises').insert({user_id:uid,day_id:d.id,exercise_id:e.id,position:d.workout_program_exercises.length});setPicker(null);load()}
 const move=async(list,i,dir)=>{const a=list[i],b=list[i+dir];if(!b)return;await Promise.all([supabase.from('workout_program_exercises').update({position:b.position}).eq('id',a.id),supabase.from('workout_program_exercises').update({position:a.position}).eq('id',b.id)]);load()}
 const start=async(p,d)=>{if(!navigator.onLine)return alert('Start dari template butuh koneksi internet');const date=iso(new Date());const {data:s,error}=await supabase.from('workout_sessions').insert({user_id:uid,date,category:d.category,program_name:p.name,day_label:d.day_label}).select().single()
  if(error){if(error.code==='23505'){alert(`Sesi ${d.category} hari ini sudah ada. Membuka sesi tersebut.`);return nav('/workout/'+date)}return alert(error.message)}
  for(const [i,e] of sorted(d.workout_program_exercises).entries()){const {data:w}=await supabase.from('workout_exercises').insert({user_id:uid,session_id:s.id,exercise_id:e.exercise_id,position:i,exercise_name:e.exercises.name,target_sets:e.target_sets,target_reps:e.target_reps,target_weight:e.target_weight,target_rpe:e.target_rpe,rest_sec:e.rest_sec}).select().single()
   await supabase.from('workout_sets').insert(Array.from({length:e.target_sets||3},(_,k)=>({user_id:uid,workout_exercise_id:w.id,set_no:k+1,weight:e.target_weight||0,reps:e.target_reps||10})))}
  nav('/workout/'+date)}
 const num=(e,k,ph)=><input type="number" min="0" step="any" placeholder={ph} defaultValue={e[k]??''} className="input !px-1 w-14 text-center text-sm" onBlur={v=>upd('workout_program_exercises',e.id,{[k]:v.target.value===''?null:+v.target.value})}/>
 if(!ps)return <p className="text-zinc-400">Memuat…</p>
 return <div className="max-w-3xl mx-auto space-y-4"><h1 className="text-2xl font-extrabold">Programs</h1>
  <div className="card flex flex-wrap gap-2"><input className="input flex-1 min-w-40" placeholder="Nama program baru" value={name} onChange={e=>setName(e.target.value)}/><select className="input w-40" value={pre} onChange={e=>setPre(e.target.value)}>{Object.keys(PRE).map(k=><option key={k}>{k}</option>)}</select><button className="btn" onClick={create}>Buat</button></div>
  {!ps.length&&<div className="card text-zinc-400 text-sm">Belum ada program. Pilih template (mis. PPL 6 Days) lalu klik Buat.</div>}
  {[...ps].sort((a,b)=>b.favorite-a.favorite).map(p=><div key={p.id} className="card space-y-3">
   <div className="flex items-center gap-2"><button onClick={()=>upd('workout_programs',p.id,{favorite:!p.favorite})}><Star size={18} className={p.favorite?'fill-lime text-lime':'text-zinc-500'}/></button>
    <button className="flex-1 text-left font-bold" onClick={()=>setOpen(open===p.id?null:p.id)}>{p.name}<span className="text-xs text-zinc-500 ml-2">{p.workout_program_days.length} hari</span></button>
    <button onClick={()=>dup(p)} title="Duplikat"><Copy size={16}/></button><button onClick={()=>del('workout_programs',p.id,`Hapus program "${p.name}"? Riwayat latihan tetap aman.`)}><Trash2 size={16}/></button></div>
   {open===p.id&&<>{sorted(p.workout_program_days).map(d=><div key={d.id} className="bg-black/30 rounded-xl p-3 space-y-2" style={{borderLeft:`3px solid ${catC(d.category)}`}}>
    <div className="flex flex-wrap gap-2 items-center"><input className="input flex-1 min-w-28" defaultValue={d.day_label} onBlur={e=>e.target.value.trim()&&upd('workout_program_days',d.id,{day_label:e.target.value.trim()})}/>
     <select className="input w-28" value={d.category} onChange={e=>upd('workout_program_days',d.id,{category:e.target.value})}>{CS.map(c=><option key={c}>{c}</option>)}</select>
     <select className="input w-24" value={d.weekday??''} onChange={e=>upd('workout_program_days',d.id,{weekday:e.target.value===''?null:+e.target.value})}><option value="">Hari?</option>{WD.map((w,i)=><option key={w} value={i}>{w}</option>)}</select>
     {d.weekday===today&&<span className="text-xs bg-lime text-black px-2 rounded-full font-bold">Hari ini</span>}
     <button className="btn !py-1" onClick={()=>start(p,d)}><Play size={14} className="inline"/> Start</button><button onClick={()=>del('workout_program_days',d.id,'Hapus hari ini dari program?')}><Trash2 size={14}/></button></div>
    {sorted(d.workout_program_exercises).map((e,i,l)=><div key={e.id} className="flex flex-wrap items-center gap-1 text-sm"><span className="flex-1 min-w-32">{e.exercises.name}</span>{num(e,'target_sets','set')}{num(e,'target_reps','rep')}{num(e,'target_weight','kg')}{num(e,'target_rpe','RPE')}{num(e,'rest_sec','rest s')}
     <button onClick={()=>move(l,i,-1)}><ChevronUp size={16}/></button><button onClick={()=>move(l,i,1)}><ChevronDown size={16}/></button><button onClick={()=>del('workout_program_exercises',e.id,'Hapus exercise ini?')}><Trash2 size={14}/></button></div>)}
    <button className="btn2 text-sm" onClick={()=>setPicker(d)}>+ Exercise</button></div>)}
   <button className="btn2 text-sm" onClick={()=>addDay(p)}>+ Tambah hari</button></>}</div>)}
  {picker&&<ExercisePicker cat={picker.category} onClose={()=>setPicker(null)} onPick={addEx}/>}</div>}
