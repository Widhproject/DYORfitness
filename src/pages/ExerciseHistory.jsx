import {useEffect,useState} from 'react'
import {useNavigate,useParams} from 'react-router-dom'
import {ChevronLeft} from 'lucide-react'
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts'
import {supabase} from '../supabase'
import {cached} from '../sync'
import {iso,tip,num,catC} from '../lib'
import {timeline} from '../history'
import {Empty} from '../art'
const RG=[[7,'7 hari'],[30,'30 hari'],[90,'3 bulan'],[180,'6 bulan'],[365,'1 tahun'],[0,'All Time']]
const Stat=({l,v})=><div className="card"><div className="text-zinc-400 text-xs">{l}</div><div className="text-xl font-extrabold">{v}</div></div>
const dl=(n,u)=>n==null?null:<span className={n>0?'text-lime':n<0?'text-orange-400':'text-zinc-500'}>{n>0?'+':''}{n}{u}</span>
export default function ExerciseHistory(){
 const {id}=useParams(),nav=useNavigate(),[rows,setRows]=useState(null),[rg,setRg]=useState(0)
 useEffect(()=>{setRows(null);cached('exh:'+id,()=>supabase.from('workout_exercises').select('exercise_name,exercises(name),workout_sessions!inner(date,category),workout_sets(set_no,weight,reps,set_type,rpe)').eq('exercise_id',id).limit(1000)).then(d=>setRows(Array.isArray(d)?d:[]))},[id])
 if(!rows)return <p className="text-zinc-400">Memuat…</p>
 const name=rows[0]?.exercise_name||rows[0]?.exercises?.name||'Exercise',all=timeline(rows.map(r=>({date:r.workout_sessions.date,category:r.workout_sessions.category,sets:r.workout_sets.map(s=>({...s,weight:+s.weight}))})))
 const from=rg?iso(new Date(Date.now()-rg*864e5)):'',shown=all.filter(r=>r.date>=from)
 return <div className="max-w-3xl mx-auto space-y-4"><div className="flex items-center gap-2"><button className="btn2" aria-label="Kembali" onClick={()=>nav(-1)}><ChevronLeft size={16}/></button><h1 className="text-xl font-extrabold flex-1">{name}</h1>
  <select aria-label="Rentang waktu" className="input w-32" value={rg} onChange={e=>setRg(+e.target.value)}>{RG.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
  {!all.length?<Empty cat="PUSH" title="Belum ada riwayat" text="Riwayat muncul setelah exercise ini dicatat pada sebuah sesi."/>:<>
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3"><Stat l="Sesi" v={shown.length}/><Stat l="Working sets" v={shown.reduce((a,r)=>a+r.n,0)}/><Stat l="Best weight" v={Math.max(0,...shown.map(r=>r.top))+' kg'}/><Stat l="Best est. 1RM" v={Math.round(Math.max(0,...shown.map(r=>r.e1rm)))+' kg'}/><Stat l="Total volume" v={num(shown.reduce((a,r)=>a+r.volume,0))+' kg'}/></div>
  <div className="card h-60"><div className="text-sm mb-2">Beban tertinggi per sesi (aktual) dan estimasi 1RM (perhitungan)</div><ResponsiveContainer><LineChart data={shown.map(r=>({d:r.date,w:r.top,e:Math.round(r.e1rm)}))}><CartesianGrid stroke="#222"/><XAxis dataKey="d" stroke="#888" fontSize={10}/><YAxis stroke="#888" fontSize={11} domain={['dataMin-5','dataMax+5']}/><Tooltip {...tip}/><Line dataKey="w" name="Beban aktual (kg)" stroke="#c6f000" strokeWidth={2.5} dot={{r:3}}/><Line dataKey="e" name="Estimasi 1RM (kg)" stroke="#38bdf8" strokeDasharray="4 4" dot={false}/></LineChart></ResponsiveContainer></div>
  <div className="space-y-2">{[...shown].reverse().map((r,i)=><div key={r.date+i} className="card space-y-1"><div className="flex flex-wrap justify-between gap-2"><button className="font-bold hover:text-lime" onClick={()=>nav('/workout/'+r.date)}>{new Date(r.date+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</button><span className="text-xs" style={{color:catC(r.category)}}>{r.category}</span></div>
   <div className="text-sm text-zinc-300">{[...r.sets].sort((a,b)=>a.set_no-b.set_no).map(s=>`${s.weight} kg × ${s.reps}${s.set_type==='warmup'?' (warm-up)':s.set_type!=='working'?` (${s.set_type})`:''}`).join(' · ')}</div>
   <div className="text-xs text-zinc-400 flex flex-wrap gap-x-4">Volume {num(r.volume)} kg{r.dVol!=null&&<>{dl(r.dVol,'%')}</>} · Top {r.top} kg{r.dTop!=null&&<>{dl(r.dTop,' kg')}</>} · Est. 1RM {Math.round(r.e1rm)} kg</div></div>)}</div>
  <p className="text-xs text-zinc-500">Volume = weight × reps pada working sets (warm-up tidak dihitung). Perubahan dibandingkan dengan sesi sebelumnya. Klik tanggal untuk membuka dan mengedit sesinya.</p></>}</div>}
