import {useEffect,useState} from 'react'
import {BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts'
import {Empty,MuscleFigure} from '../art'
import {supabase} from '../supabase'
import {iso,tip,num} from '../lib'
import {MG,muscleAgg,weekStart} from '../calc'
export const COL={chest:'#c6f000',back:'#38bdf8',shoulders:'#fb923c',biceps:'#a78bfa',triceps:'#f472b6',quadriceps:'#34d399',hamstrings:'#fbbf24',glutes:'#f87171',calves:'#94a3b8',abs:'#2dd4bf'}
const cap=s=>s[0].toUpperCase()+s.slice(1),RG=[[7,'7 hari'],[30,'30 hari'],[90,'3 bulan'],[180,'6 bulan'],[365,'1 tahun'],[0,'All time']]
export function useMuscleRows(){const [rows,setRows]=useState(null)
 useEffect(()=>{supabase.from('workout_sets').select('weight,reps,set_type,workout_exercises(exercises(primary_muscle_group,secondary_muscle_groups),workout_sessions(date))').range(0,9999)
  .then(({data})=>setRows((data||[]).filter(r=>r.workout_exercises).map(r=>{const e=r.workout_exercises;return{w:+r.weight,r:r.reps,type:r.set_type,p:e.exercises.primary_muscle_group,sec:e.exercises.secondary_muscle_groups,date:e.workout_sessions.date}})))},[])
 return rows}
export default function Muscle(){
 const rows=useMuscleRows(),[rg,setRg]=useState(30),[by,setBy]=useState('week'),[met,setMet]=useState('sets')
 if(!rows)return <p className="text-zinc-400">Memuat…</p>
 const work=rows.filter(r=>r.type!=='warmup'&&r.p);if(!work.length)return <Empty cat="LEGS" title="Belum ada data otot" text="Catat minimal satu working set (warm-up tidak dihitung). Pastikan migration_002 sudah dijalankan agar exercise punya kelompok otot."/>
 const today=iso(new Date()),from=rg?iso(new Date(Date.now()-rg*864e5)):'',first=work.reduce((a,r)=>r.date<a?r.date:a,today)
 const weeks=Math.max(1,rg?rg/7:(Date.now()-new Date(first+'T00:00:00'))/6048e5),A=muscleAgg(rows,from),act=MG.filter(m=>A[m].sets>0||A[m].ind>0)
 const grp={};work.filter(r=>r.date>=from).forEach(r=>{const k=by==='week'?weekStart(r.date):r.date.slice(0,7);(grp[k]??={k})[r.p]=(grp[k][r.p]||0)+(met==='sets'?1:r.w*r.r)})
 const trend=Object.values(grp).sort((a,b)=>a.k.localeCompare(b.k))
 const wk=Array.from({length:8},(_,i)=>weekStart(iso(new Date(Date.now()-(7-i)*7*864e5)))),cell={};work.forEach(r=>{const k=r.p+'|'+weekStart(r.date);cell[k]=(cell[k]||0)+1})
 const mx=Math.max(1,...Object.values(cell)),tw=weekStart(today),lw=weekStart(iso(new Date(Date.now()-7*864e5)))
 const W=k=>muscleAgg(rows.filter(r=>weekStart(r.date)===k)),T=W(tw),L=W(lw),ins=[]
 MG.forEach(m=>{if(T[m].sets){let s=`${cap(m)} mendapat ${T[m].sets} working sets minggu ini`;if(L[m].vol>0){const c=Math.round((T[m].vol-L[m].vol)/L[m].vol*100);s+=`; volumenya ${c>=0?'naik':'turun'} ${Math.abs(c)}% dibanding minggu lalu (${L[m].sets} sets)`}ins.push(s+'.')}
  else if(muscleAgg(rows)[m].sets){const d=[...muscleAgg(rows)[m].dates].sort().at(-1);ins.push(`${cap(m)} belum mendapat sesi latihan minggu ini (terakhir: ${d}).`)}})
 const sel=(v,f,o)=><select className="input w-32" value={v} onChange={e=>f(e.target.value)}>{o.map(([a,b])=><option key={a} value={a}>{b}</option>)}</select>
 return <div className="space-y-4"><div className="flex gap-2 flex-wrap"><select className="input w-32" value={rg} onChange={e=>setRg(+e.target.value)}>{RG.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>{sel(by,setBy,[['week','Mingguan'],['month','Bulanan']])}{sel(met,setMet,[['sets','Working sets'],['vol','Volume (kg)']])}</div>
  <p className="text-xs text-zinc-500">Hanya working set (warm-up dikecualikan). Set dihitung penuh ke otot primer; otot sekunder dicatat terpisah sebagai indirect sets.</p>
  <div className="card flex items-center gap-4"><MuscleFigure className="w-52" lv={Object.fromEntries(MG.map(m=>[m,A[m].sets/Math.max(1,...MG.map(k=>A[k].sets))]))}/><p className="text-sm text-zinc-400">Peta otot: makin terang berarti makin banyak working sets (otot primer) pada periode terpilih.</p></div>
  <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="text-zinc-400 text-left"><tr><th>Otot</th><th>Sets</th><th>Volume kg</th><th>Hari</th><th>Sets/minggu</th><th>Indirect</th></tr></thead><tbody>
   {act.map(m=><tr key={m}><td><i className="inline-block w-2 h-2 rounded-full mr-2" style={{background:COL[m]}}/>{cap(m)}</td><td>{A[m].sets}</td><td>{num(A[m].vol)}</td><td>{A[m].dates.size}</td><td>{(A[m].sets/weeks).toFixed(1)}</td><td>{A[m].ind}</td></tr>)}</tbody></table></div>
  <div className="grid md:grid-cols-2 gap-3"><div className="card h-64"><b className="text-sm">Distribusi working sets</b><ResponsiveContainer><PieChart><Pie data={act.filter(m=>A[m].sets).map(m=>({name:cap(m),value:A[m].sets,m}))} dataKey="value" nameKey="name" outerRadius={80}>{act.filter(m=>A[m].sets).map(m=><Cell key={m} fill={COL[m]}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
   <div className="card h-64"><b className="text-sm">Frekuensi (hari latihan)</b><ResponsiveContainer><BarChart data={act.map(m=>({m:cap(m).slice(0,5),n:A[m].dates.size,c:COL[m]}))}><XAxis dataKey="m" stroke="#888" fontSize={11}/><YAxis allowDecimals={false} stroke="#888"/><Tooltip {...tip}/><Bar dataKey="n" name="Hari" radius={4}>{act.map(m=><Cell key={m} fill={COL[m]}/>)}</Bar></BarChart></ResponsiveContainer></div></div>
  <div className="card h-72"><b className="text-sm">{by==='week'?'Mingguan':'Bulanan'} per otot ({met==='sets'?'working sets':'volume kg'})</b><ResponsiveContainer><BarChart data={trend}><CartesianGrid stroke="#222"/><XAxis dataKey="k" stroke="#888" fontSize={10}/><YAxis stroke="#888" fontSize={11}/><Tooltip {...tip}/>{MG.map(m=><Bar key={m} dataKey={m} stackId="a" fill={COL[m]}/>)}</BarChart></ResponsiveContainer></div>
  <div className="card overflow-x-auto"><b className="text-sm">Heatmap working sets, 8 minggu terakhir</b><table className="text-xs mt-2"><tbody>{MG.map(m=><tr key={m}><td className="pr-2">{cap(m)}</td>{wk.map(k=>{const n=cell[m+'|'+k]||0;return <td key={k} className="w-9 h-7 text-center rounded" style={{background:n?`rgba(198,240,0,${.15+.85*n/mx})`:'#1a1f1c',color:n/mx>.5?'#000':'#aaa'}}>{n||''}</td>})}</tr>)}</tbody></table></div>
  <div className="card space-y-1"><b className="text-sm">Insight</b>{ins.map((s,i)=><p key={i} className="text-sm text-zinc-300">{s}</p>)}<p className="text-xs text-zinc-500 pt-1">Ini deskripsi dari data Anda, bukan penilaian "kurang" atau "berlebih". Kebutuhan tiap orang berbeda.</p></div></div>}
