import {useEffect,useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {supabase} from '../supabase'
import {CATS,catC,pad,iso} from '../lib'
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December']
export default function Calendar(){
 const now=new Date(),nav=useNavigate(),[y,setY]=useState(now.getFullYear()),[m,setM]=useState(now.getMonth()),[ss,setSs]=useState([])
 useEffect(()=>{supabase.from('workout_sessions').select('date,category').gte('date',`${y}-${pad(m+1)}-01`).lt('date',iso(new Date(y,m+1,1))).then(({data})=>setSs(data||[]))},[y,m])
 const total=new Date(y,m+1,0).getDate(),off=(new Date(y,m,1).getDay()+6)%7
 const cells=[...Array(off).fill(null),...Array.from({length:total},(_,i)=>i+1)]
 return <div className="max-w-3xl mx-auto space-y-4"><h1 className="text-2xl font-extrabold">Calendar</h1>
  <div className="flex gap-2"><select className="input" value={m} onChange={e=>setM(+e.target.value)}>{MONTHS.map((n,i)=><option key={n} value={i}>{n}</option>)}</select>
   <select className="input w-32" value={y} onChange={e=>setY(+e.target.value)}>{Array.from({length:8},(_,i)=>now.getFullYear()-5+i).map(v=><option key={v}>{v}</option>)}</select></div>
  <div className="card"><div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 mb-2">{['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d=><div key={d}>{d}</div>)}</div>
   <div className="grid grid-cols-7 gap-1">{cells.map((d,i)=>{if(!d)return <div key={i}/>
    const ds=`${y}-${pad(m+1)}-${pad(d)}`,cs=[...new Set(ss.filter(s=>s.date===ds).map(s=>s.category))],today=ds===iso(now)
    return <button key={i} onClick={()=>nav('/workout/'+ds)} className={`aspect-square rounded-xl border flex flex-col items-center justify-center hover:bg-white/5 ${today?'border-lime':'border-white/5'}`}>
     <span>{d}</span><span className="flex gap-0.5 h-2">{cs.map(c=><i key={c} className="w-2 h-2 rounded-full" style={{background:catC(c)}}/>)}</span></button>})}</div>
   <div className="flex gap-4 text-xs mt-4">{Object.entries(CATS).map(([k,v])=><span key={k} className="flex items-center gap-1"><i className="w-2 h-2 rounded-full" style={{background:v.c}}/>{k}</span>)}</div></div></div>}
