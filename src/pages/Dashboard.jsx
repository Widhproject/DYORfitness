import {useEffect,useState} from 'react'
import {Link,useNavigate} from 'react-router-dom'
import {Flame,CalendarDays,Dumbbell,ClipboardList,Apple,Play,Check} from 'lucide-react'
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts'
import {supabase} from '../supabase'
import {useAuth,useData,CATS,catC,vol,num,iso,tip,weekKey} from '../lib'
import {Ring} from '../ui'
const Stat=({l,v})=><div className="card"><div className="text-zinc-400 text-xs">{l}</div><div className="text-2xl font-extrabold mt-1">{v}</div></div>
export default function Dashboard(){
 const {user}=useAuth(),nav=useNavigate(),{sessions,sets,loading}=useData(),[prog,setProg]=useState(null)
 useEffect(()=>{supabase.from('workout_programs').select('name,favorite,workout_program_days(day_label,category,weekday,workout_program_exercises(id))').order('created_at').then(({data})=>setProg(data||[]))},[])
 if(loading||!prog)return <p className="text-zinc-400">Memuat…</p>
 const now=new Date(),today=iso(now),y=now.getFullYear(),dates=new Set(sessions.map(s=>s.date)),h=now.getHours()
 const name=(user.user_metadata?.full_name||user.email.split('@')[0]).split(' ')[0],hi=h<11?'Good morning':h<15?'Good afternoon':h<19?'Good evening':'Good night'
 let streak=0,gap=0;for(let i=0;i<365;i++){if(dates.has(iso(new Date(Date.now()-i*864e5)))){streak++;gap=0}else if(++gap>1)break}   // 1 hari istirahat tidak memutus streak
 const days=Array.from({length:7},(_,i)=>{const d=new Date(weekKey(today)+'T00:00:00');d.setDate(d.getDate()+i);return iso(d)}),done=days.filter(d=>dates.has(d)).length
 const program=prog.find(p=>p.favorite)||prog[0],goal=program?.workout_program_days.length||4,pct=Math.min(100,Math.round(done/goal*100))
 const pday=program?.workout_program_days.find(d=>d.weekday===(now.getDay()+6)%7),ts=sessions.find(s=>s.date===today),col=catC(ts?.category||pday?.category||'CUSTOM')
 const last=sessions.at(-1),per={};sets.forEach(s=>{const p=(per[s.ex]??={name:s.name,d:{}});p.d[s.date]=Math.max(p.d[s.date]||0,s.w)})
 const gain=Object.values(per).map(p=>{const k=Object.keys(p.d).sort();return{name:p.name,g:p.d[k.at(-1)]-p.d[k[0]]}}).sort((a,b)=>b.g-a.g)[0]
 const months=Array.from({length:12},(_,i)=>({m:'JFMAMJJASOND'[i],n:new Set(sessions.filter(s=>s.date.startsWith(`${y}-${String(i+1).padStart(2,'0')}`)).map(s=>s.date)).size}))
 const QA=[['/workout/'+today,'Workout',Dumbbell],['/calendar','Calendar',CalendarDays],['/programs','Programs',ClipboardList],['/nutrition','Nutrition',Apple]]
 return <div className="space-y-4 max-w-4xl mx-auto">
  <div className="flex items-start justify-between gap-3"><div><div className="text-sm text-zinc-400">{hi}, {name}</div><h1 className="text-3xl md:text-4xl font-extrabold leading-tight mt-1">Ready to <span className="text-lime">forge</span><br/>greatness.</h1></div>
   <div className="card !py-3 flex items-center gap-2 mt-6"><Flame className="text-orange-400"/><div><div className="text-xs text-zinc-400">Streak</div><b>{streak} {streak===1?'day':'days'}</b></div></div></div>
  <div className="card flex items-center gap-4"><div className="flex-1"><div className="text-sm text-zinc-300">Weekly Progress</div><div className="text-3xl font-extrabold">{done} / {goal}</div><div className="text-xs text-zinc-500 mb-3">Workouts completed{program?` · ${program.name}`:''}</div>
    <div className="flex gap-2">{days.map((d,i)=><div key={d} className="text-center text-[10px] text-zinc-500"><div className={`w-6 h-6 rounded-full grid place-items-center border ${dates.has(d)?'bg-lime border-lime text-black':d===today?'border-lime':'border-white/20'}`}>{dates.has(d)&&<Check size={13}/>}</div>{'MTWTFSS'[i]}</div>)}</div></div>
   <Ring pct={pct}><span className="text-2xl font-extrabold text-lime">{pct}%</span></Ring></div>
  <div><div className="font-bold mb-2">Today's Workout</div><div className="card !p-5 space-y-3" style={{background:`linear-gradient(135deg,${col}30,#141816 70%)`}}>
   {ts?<><div className="text-2xl font-extrabold">{ts.category}{pday?` · ${pday.day_label}`:''}</div><div className="text-sm text-zinc-300">Sesi hari ini sudah dimulai</div><button className="btn" onClick={()=>nav('/workout/'+today)}><Play size={14} className="inline mr-1"/>Continue Workout</button></>
   :pday?<><div className="text-2xl font-extrabold">{pday.day_label}</div><div className="text-sm text-zinc-300">{pday.category} · {pday.workout_program_exercises.length} exercises</div><button className="btn" onClick={()=>nav('/programs')}><Play size={14} className="inline mr-1"/>Start Workout</button></>
   :<><div className="text-xl font-extrabold">{program?'Hari istirahat atau belum dijadwalkan':'Belum ada rencana latihan'}</div><div className="text-sm text-zinc-300">{program?'Tetap bisa mencatat latihan bebas.':'Buat program, atau catat latihan langsung.'}</div><button className="btn" onClick={()=>nav('/workout/'+today)}>Log a workout</button></>}</div></div>
  <div><div className="font-bold mb-2">Quick Actions</div><div className="grid grid-cols-4 gap-3">{QA.map(([to,l,I])=><Link key={l} to={to} className="card !p-3 flex flex-col items-center gap-2 text-xs hover:border-lime/50 transition"><I className="text-lime"/>{l}</Link>)}</div></div>
  {sessions.length>0&&<><div className="font-bold">Ringkasan</div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Stat l="Workout bulan ini" v={new Set(sessions.filter(s=>s.date.startsWith(today.slice(0,7))).map(s=>s.date)).size}/><Stat l={`Workout ${y}`} v={new Set(sessions.filter(s=>s.date.startsWith(String(y))).map(s=>s.date)).size}/>
   <Stat l="Total volume (kg)" v={num(sets.reduce((a,s)=>a+vol(s),0))}/><Stat l="Exercise berbeda" v={new Set(sets.map(s=>s.ex)).size}/></div>
  <div className="grid md:grid-cols-2 gap-3"><div className="card"><div className="text-zinc-400 text-xs">Workout terakhir</div><Link to={'/workout/'+last.date} className="text-xl font-bold" style={{color:catC(last.category)}}>{last.category} · {last.date}</Link></div>
   <div className="card"><div className="text-zinc-400 text-xs">Peningkatan beban terbesar</div><div className="text-xl font-bold">{gain&&gain.g>0?`${gain.name} +${gain.g} kg`:'Belum cukup data'}</div></div></div>
  <div className="card h-64"><div className="text-sm mb-2">Aktivitas {y} (hari latihan per bulan)</div><ResponsiveContainer><BarChart data={months}><XAxis dataKey="m" stroke="#888"/><YAxis allowDecimals={false} stroke="#888"/><Tooltip {...tip}/><Bar dataKey="n" name="Hari" fill="#c6f000" radius={4}/></BarChart></ResponsiveContainer></div>
  <div className="grid grid-cols-3 gap-3">{Object.keys(CATS).map(c=>{const ss=sessions.filter(s=>s.category===c);return <div key={c} className="card"><div className="font-bold" style={{color:CATS[c].c}}>{c}</div><div className="text-2xl font-extrabold">{ss.length}</div><div className="text-xs text-zinc-400">{num(sets.filter(s=>s.cat===c).reduce((a,s)=>a+vol(s),0))} kg</div></div>})}</div></>}</div>}
