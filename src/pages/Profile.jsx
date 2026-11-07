import {useEffect,useState} from 'react'
import {supabase} from '../supabase'
import {useAuth,iso} from '../lib'
import ProteinSetup from './ProteinSetup'
export default function Profile(){
 const {user}=useAuth(),[name,setName]=useState(''),[logs,setLogs]=useState([]),[bw,setBw]=useState(''),[msg,setMsg]=useState('')
 const load=async()=>{const [p,l]=await Promise.all([supabase.from('profiles').select('full_name').eq('id',user.id).maybeSingle(),supabase.from('bodyweight_logs').select('*').order('date',{ascending:false}).limit(30)]);setName(p.data?.full_name||'');setLogs(l.data||[])}
 useEffect(()=>{load()},[])
 const saveName=async()=>{await supabase.from('profiles').upsert({id:user.id,full_name:name});setMsg('Tersimpan')}
 const addBw=async()=>{if(!(+bw>0))return;await supabase.from('bodyweight_logs').upsert({user_id:user.id,date:iso(new Date()),weight_kg:+bw},{onConflict:'user_id,date'});setBw('');load()}
 const exp=async()=>{const {data}=await supabase.from('workout_sets').select('set_no,weight,reps,rpe,workout_exercises(exercises(name),workout_sessions(date,category))').range(0,9999)
  const rows=(data||[]).map(r=>{const e=r.workout_exercises;return[e.workout_sessions.date,e.workout_sessions.category,e.exercises.name,r.set_no,r.weight,r.reps,r.rpe??'',r.weight*r.reps]}).sort()
  const csv=[['date','category','exercise','set','weight_kg','reps','rpe','volume'],...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='dyorfitness-export.csv';a.click()}
 return <div className="max-w-xl mx-auto space-y-4"><h1 className="text-2xl font-extrabold">Profile</h1>
  <div className="card space-y-3"><div className="text-sm text-zinc-400">{user.email}</div><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama"/>
   <div className="flex gap-2"><button className="btn" onClick={saveName}>Simpan nama</button><button className="btn2" onClick={exp}>Export CSV</button><button className="btn2" onClick={()=>supabase.auth.signOut()}>Logout</button></div>{msg&&<p className="text-lime text-sm">{msg}</p>}</div>
  <ProteinSetup/><div className="card space-y-3"><b>Berat badan</b><div className="flex gap-2"><input className="input" type="number" step="0.1" placeholder="kg hari ini" value={bw} onChange={e=>setBw(e.target.value)}/><button className="btn" onClick={addBw}>Catat</button></div>
   {logs.map(l=><div key={l.id} className="flex justify-between text-sm"><span>{l.date}</span><span>{l.weight_kg} kg</span></div>)}</div></div>}
