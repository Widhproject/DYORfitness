import {useData,CATS,vol,num,tip} from '../lib'
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts'
import {Link} from 'react-router-dom'
const Stat=({l,v})=><div className="card"><div className="text-zinc-400 text-xs">{l}</div><div className="text-2xl font-extrabold mt-1">{v}</div></div>
export default function Dashboard(){
 const {sessions,sets,loading}=useData()
 if(loading)return <p className="text-zinc-400">Memuat…</p>
 const now=new Date(),y=now.getFullYear(),ym=`${y}-${String(now.getMonth()+1).padStart(2,'0')}`
 const days=s=>new Set(s.map(x=>x.date)).size
 const last=sessions.at(-1)
 const per={};sets.forEach(s=>{const p=(per[s.ex]??={name:s.name,d:{}});p.d[s.date]=Math.max(p.d[s.date]||0,s.w)})
 const gain=Object.values(per).map(p=>{const k=Object.keys(p.d).sort();return{name:p.name,g:p.d[k.at(-1)]-p.d[k[0]]}}).sort((a,b)=>b.g-a.g)[0]
 const months=Array.from({length:12},(_,i)=>({m:'JFMAMJJASOND'[i],n:days(sessions.filter(s=>s.date.startsWith(`${y}-${String(i+1).padStart(2,'0')}`)))}))
 if(!sessions.length)return <div className="card text-center space-y-3"><p>Belum ada latihan tercatat.</p><Link to="/calendar" className="btn inline-block">Catat latihan pertama</Link></div>
 return <div className="space-y-4 max-w-5xl">
  <h1 className="text-2xl font-extrabold">Dashboard</h1>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
   <Stat l="Workout bulan ini" v={days(sessions.filter(s=>s.date.startsWith(ym)))}/><Stat l={`Workout ${y}`} v={days(sessions.filter(s=>s.date.startsWith(String(y))))}/>
   <Stat l="Total volume (kg)" v={num(sets.reduce((a,s)=>a+vol(s),0))}/><Stat l="Exercise berbeda" v={new Set(sets.map(s=>s.ex)).size}/></div>
  <div className="grid md:grid-cols-2 gap-3">
   <div className="card"><div className="text-zinc-400 text-xs">Workout terakhir</div><Link to={'/workout/'+last.date} className="text-xl font-bold" style={{color:CATS[last.category].c}}>{last.category} · {last.date}</Link></div>
   <div className="card"><div className="text-zinc-400 text-xs">Peningkatan beban terbesar</div><div className="text-xl font-bold">{gain&&gain.g>0?`${gain.name} +${gain.g} kg`:'Belum cukup data'}</div></div></div>
  <div className="card h-64"><div className="text-sm mb-2">Aktivitas {y} (hari latihan per bulan)</div><ResponsiveContainer><BarChart data={months}><XAxis dataKey="m" stroke="#888"/><YAxis allowDecimals={false} stroke="#888"/><Tooltip {...tip}/><Bar dataKey="n" name="Hari" fill="#c6f000" radius={4}/></BarChart></ResponsiveContainer></div>
  <div className="grid grid-cols-3 gap-3">{Object.keys(CATS).map(c=>{const ss=sessions.filter(s=>s.category===c);return <div key={c} className="card"><div className="font-bold" style={{color:CATS[c].c}}>{c}</div><div className="text-2xl font-extrabold">{ss.length}</div><div className="text-xs text-zinc-400">{num(sets.filter(s=>s.cat===c).reduce((a,s)=>a+vol(s),0))} kg</div></div>})}</div></div>}
