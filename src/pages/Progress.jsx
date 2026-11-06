import {useState} from 'react'
import {LineChart,Line,BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts'
import {useData,CATS,vol,e1rm,num,iso,weekKey,tip} from '../lib'
const Stat=({l,v})=><div className="card"><div className="text-zinc-400 text-xs">{l}</div><div className="text-xl font-extrabold">{v}</div></div>
function Analytics({sets,sessions}){
 const [by,setBy]=useState('week')
 const dates=[...new Set(sessions.map(s=>s.date))].sort(),wk=Math.max(1,(Date.now()-new Date(dates[0]+'T00:00:00'))/6048e5)
 const g={};sets.forEach(s=>{const k=by==='week'?weekKey(s.date):s.date.slice(0,7);g[k]=(g[k]||0)+vol(s)})
 const vd=Object.keys(g).sort().map(k=>({k,v:g[k]}))
 const cnt={};new Set(sets.map(s=>s.sid+'|'+s.name)).forEach(x=>{const n=x.split('|')[1];cnt[n]=(cnt[n]||0)+1})
 const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5)
 const per={};sets.forEach(s=>{const p=(per[s.name]??={});p[s.date]=Math.max(p[s.date]||0,s.w)})
 const gain=Object.entries(per).map(([n,d])=>{const k=Object.keys(d).sort();return[n,d[k.at(-1)]-d[k[0]]]}).sort((a,b)=>b[1]-a[1]).slice(0,5)
 const pie=Object.keys(CATS).map(c=>({name:c,value:sessions.filter(s=>s.category===c).length}))
 return <div className="space-y-4">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Stat l="Total workout (hari)" v={dates.length}/><Stat l="Total volume (kg)" v={num(sets.reduce((a,s)=>a+vol(s),0))}/><Stat l="Total sets" v={sets.length}/><Stat l="Latihan / minggu" v={(dates.length/wk).toFixed(1)}/></div>
  <div className="card h-72"><div className="flex justify-between mb-2"><b className="text-sm">Volume {by==='week'?'mingguan':'bulanan'} (kg)</b><select className="input w-32" value={by} onChange={e=>setBy(e.target.value)}><option value="week">Mingguan</option><option value="month">Bulanan</option></select></div>
   <ResponsiveContainer><BarChart data={vd}><CartesianGrid stroke="#222"/><XAxis dataKey="k" stroke="#888" fontSize={11}/><YAxis stroke="#888" fontSize={11}/><Tooltip {...tip}/><Bar dataKey="v" name="Volume kg" fill="#c6f000" radius={4}/></BarChart></ResponsiveContainer></div>
  <div className="grid md:grid-cols-3 gap-3">
   <div className="card h-56"><b className="text-sm">Push / Pull / Legs</b><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>{pie.map(p=><Cell key={p.name} fill={CATS[p.name].c}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
   <div className="card"><b className="text-sm">Paling sering dilakukan</b>{top.map(([n,c])=><div key={n} className="flex justify-between text-sm mt-1"><span>{n}</span><span className="text-lime">{c}×</span></div>)}</div>
   <div className="card"><b className="text-sm">Peningkatan beban terbaik</b>{gain.map(([n,v])=><div key={n} className="flex justify-between text-sm mt-1"><span>{n}</span><span className="text-lime">{v>0?'+':''}{v} kg</span></div>)}</div></div></div>}
function ExerciseTab({sets}){
 const exs=[...new Map(sets.map(s=>[s.ex,s.name])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[ex,setEx]=useState(''),[rg,setRg]=useState(90)
 const id=ex||exs[0]?.[0],all=sets.filter(s=>s.ex===id),by={};all.forEach(s=>(by[s.date]??=[]).push(s))
 const dates=Object.keys(by).sort();let best=0;const pr={};dates.forEach(d=>{const m=Math.max(...by[d].map(s=>s.w));if(m>best){pr[d]=1;best=m}})
 const lim=rg?iso(new Date(Date.now()-rg*864e5)):'',shown=dates.filter(d=>d>=lim)
 return <div className="space-y-4"><div className="flex gap-2"><select className="input" value={id} onChange={e=>setEx(e.target.value)}>{exs.map(([i,n])=><option key={i} value={i}>{n}</option>)}</select>
  <select className="input w-36" value={rg} onChange={e=>setRg(+e.target.value)}>{[[7,'7 hari'],[30,'30 hari'],[90,'3 bulan'],[180,'6 bulan'],[365,'1 tahun'],[0,'All time']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3"><Stat l="Last workout" v={dates.at(-1)}/><Stat l="Best weight" v={best+' kg'}/><Stat l="Best reps" v={Math.max(...all.map(s=>s.r))}/><Stat l="Est. 1RM (perkiraan)" v={Math.round(Math.max(...all.map(s=>e1rm(s.w,s.r))))+' kg'}/><Stat l="Total volume" v={num(all.reduce((a,s)=>a+vol(s),0))+' kg'}/></div>
  <div className="card h-64"><div className="text-sm mb-2">Beban tertinggi per sesi (kg, aktual)</div><ResponsiveContainer><LineChart data={shown.map(d=>({d,w:Math.max(...by[d].map(s=>s.w))}))}><CartesianGrid stroke="#222"/><XAxis dataKey="d" stroke="#888" fontSize={11}/><YAxis stroke="#888" domain={['dataMin-5','dataMax+5']}/><Tooltip {...tip}/><Line dataKey="w" name="kg" stroke="#c6f000" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
  <div className="card space-y-3">{[...dates].reverse().map(d=><div key={d}><b>{d}</b>{pr[d]&&<span className="ml-2 text-xs bg-lime text-black px-2 rounded-full font-bold">PR</span>}{by[d].map((s,i)=><div key={i} className="text-sm text-zinc-300">{s.w} kg × {s.r}</div>)}</div>)}</div></div>}
export default function Progress(){
 const {sets,sessions,loading}=useData(),[tab,setTab]=useState('a')
 if(loading)return <p className="text-zinc-400">Memuat…</p>
 return <div className="max-w-5xl space-y-4"><h1 className="text-2xl font-extrabold">Progress</h1>
  <div className="flex gap-2">{[['a','Analytics'],['e','Per exercise']].map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={tab===k?'btn':'btn2'}>{l}</button>)}</div>
  {!sets.length?<div className="card">Belum ada data set. Catat latihan dari menu Calendar.</div>:tab==='a'?<Analytics sets={sets} sessions={sessions}/>:<ExerciseTab sets={sets}/>}</div>}
