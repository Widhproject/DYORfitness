import {useCallback,useEffect,useState} from 'react'
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,ReferenceLine,CartesianGrid} from 'recharts'
import {Empty} from '../art'
import {Trash2,Pencil} from 'lucide-react'
import {Link} from 'react-router-dom'
import {supabase} from '../supabase'
import {useAuth,iso,tip} from '../lib'
import {useDoc,cached} from '../sync'
import {proteinFor,avg} from '../calc'
const ST={raw:'mentah',cooked:'matang','n/a':''}
export default function Nutrition(){
 const {user}=useAuth(),[date,setDate]=useState(iso(new Date())),[foods,setFoods]=useState([]),[hist,setHist]=useState({}),[target,setTarget]=useState(0),[q,setQ]=useState(''),[sel,setSel]=useState(null),[amt,setAmt]=useState(''),[cf,setCf]=useState({name:'',unit:'g',p:''}),[loading,setLoading]=useState(true)
 const {doc,mut}=useDoc('food',date),uuid=()=>crypto.randomUUID()
 const load=useCallback(async()=>{const from=iso(new Date(Date.now()-29*864e5))
  const [f,h,t]=await Promise.all([cached('foods',()=>supabase.from('food_database').select('*').order('name')),cached('foodhist',()=>supabase.from('food_logs').select('date,protein_g').gte('date',from)),cached('ptarget',()=>supabase.from('protein_targets').select('target_g').eq('user_id',user.id).maybeSingle())])
  const g={};h.forEach(r=>g[r.date]=(g[r.date]||0)+ +r.protein_g);setFoods(f);setHist(g);setTarget(+t?.target_g||0);setLoading(false)},[user.id])
 useEffect(()=>{load()},[load])
 const logs=Object.values(doc?.L.food||{}).sort((a,b)=>(a.created_at||'')<(b.created_at||'')?-1:1).map(l=>({...l,food_database:l._f})),total=Math.round(logs.reduce((a,l)=>a+ +l.protein_g,0)*10)/10,pct=target?Math.round(total/target*100):0
 const add=async()=>{const a=+amt;if(!sel||!(a>0))return alert('Pilih makanan dan isi jumlah lebih dari 0');await mut(L=>{const id=uuid();L.food[id]={id,user_id:user.id,date,food_id:sel.id,amount:a,protein_g:proteinFor(sel,a),created_at:new Date().toISOString(),_f:sel}});setAmt('');setSel(null);setQ('')}
 const edit=async l=>{const a=+prompt('Jumlah baru',l.amount);if(!(a>0))return;mut(L=>{L.food[l.id]={...L.food[l.id],amount:a,protein_g:proteinFor(l.food_database,a)}})}
 const addFood=async()=>{if(!navigator.onLine)return alert('Makanan custom butuh koneksi internet');const p=+cf.p;if(!cf.name.trim()||!(p>=0)||cf.p==='')return alert('Isi nama dan kandungan protein');const row={user_id:user.id,name:cf.name.trim(),category:'Custom',unit:cf.unit,unit_label:cf.unit==='unit'?'porsi':null,state:'n/a',source:'Input pengguna'}
  cf.unit==='g'?row.protein_per_100g=p:row.protein_per_unit=p;const {error}=await supabase.from('food_database').insert(row);if(error)return alert(error.message);setCf({name:'',unit:'g',p:''});load()}
 const days=Array.from({length:30},(_,i)=>{const d=iso(new Date(Date.now()-(29-i)*864e5));return{d:d.slice(5),p:Math.round(hist[d]||0),has:d in hist}}),logged=days.filter(x=>x.has)
 const res=q?foods.filter(f=>f.name.toLowerCase().includes(q.toLowerCase())).slice(0,8):[]
 if(loading||!doc)return <p className="text-zinc-400">Memuat…</p>
 return <div className="max-w-3xl mx-auto space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-extrabold">Nutrition</h1><input type="date" className="input w-40" value={date} onChange={e=>e.target.value&&setDate(e.target.value)}/></div>
  <div className="card space-y-2"><div className="flex justify-between items-end"><div><div className="text-3xl font-extrabold text-lime">{total} g</div><div className="text-sm text-zinc-400">{target?`Target ${target} g · sisa ${Math.max(0,Math.round((target-total)*10)/10)} g · ${pct}%`:<>Target belum diatur. <Link className="text-lime underline" to="/profile">Atur di Profile</Link></>}</div></div>{target>0&&total>=target&&<span className="bg-lime text-black text-xs font-bold px-3 py-1 rounded-full">Target Achieved</span>}</div>
   {target>0&&<div className="h-3 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-lime transition-all" style={{width:Math.min(100,pct)+'%'}}/></div>}</div>
  <div className="card space-y-3"><b>Tambah makanan</b><input className="input" placeholder="Cari makanan…" value={q} onChange={e=>{setQ(e.target.value);setSel(null)}}/>
   {res.map(f=><button key={f.id} onClick={()=>{setSel(f);setQ(f.name);setAmt('')}} className="block w-full text-left px-3 py-1 rounded-lg hover:bg-white/5">{f.name} <span className="text-xs text-zinc-500">{ST[f.state]} · {f.unit==='unit'?`${f.protein_per_unit} g/${f.unit_label}`:`${f.protein_per_100g} g/100 g`}</span></button>)}
   {sel&&<div className="flex gap-2 items-center"><input className="input" type="number" min="0" step="any" placeholder={sel.unit==='unit'?`Jumlah (${sel.unit_label})`:'Berat (gram)'} value={amt} onChange={e=>setAmt(e.target.value)}/><span className="text-sm w-24 text-lime">{+amt>0?proteinFor(sel,+amt)+' g':''}</span><button className="btn" onClick={add}>Tambah</button></div>}
   <details><summary className="text-sm text-zinc-400 cursor-pointer">Makanan custom</summary><div className="flex flex-wrap gap-2 mt-2"><input className="input flex-1" placeholder="Nama" value={cf.name} onChange={e=>setCf({...cf,name:e.target.value})}/><select className="input w-32" value={cf.unit} onChange={e=>setCf({...cf,unit:e.target.value})}><option value="g">per 100 g</option><option value="unit">per porsi</option></select><input className="input w-24" type="number" placeholder="Protein g" value={cf.p} onChange={e=>setCf({...cf,p:e.target.value})}/><button className="btn2" onClick={addFood}>Simpan</button></div></details></div>
  <div className="card space-y-2"><b>Makanan hari ini</b>{!logs.length&&<Empty cat="NUTRI" title="Belum ada makanan hari ini" text="Cari makanan di atas untuk mulai mencatat protein."/>}
   {logs.map(l=><div key={l.id} className="flex items-center gap-2 text-sm"><span className="flex-1">{l.food_database.name} <span className="text-zinc-500">{ST[l.food_database.state]} · {l.amount} {l.food_database.unit==='unit'?l.food_database.unit_label:'g'}</span></span><b className="text-lime">{l.protein_g} g</b><button onClick={()=>edit(l)}><Pencil size={14}/></button><button onClick={()=>mut(L=>{delete L.food[l.id]})}><Trash2 size={14}/></button></div>)}</div>
  <div className="card space-y-3"><b>Riwayat 30 hari</b><div className="grid grid-cols-3 gap-2 text-center text-sm"><div><div className="text-xl font-extrabold">{Math.round(avg(logged.slice(-7).map(x=>x.p)))} g</div>rata-rata 7 hari</div><div><div className="text-xl font-extrabold">{Math.round(avg(logged.map(x=>x.p)))} g</div>rata-rata 30 hari</div><div><div className="text-xl font-extrabold">{target?logged.filter(x=>x.p>=target).length:'–'}</div>hari target tercapai</div></div>
   <p className="text-xs text-zinc-500">Rata-rata hanya menghitung hari yang ada catatannya.</p>
   <div className="h-56"><ResponsiveContainer><BarChart data={days}><CartesianGrid stroke="#222"/><XAxis dataKey="d" stroke="#888" fontSize={10} interval={4}/><YAxis stroke="#888" fontSize={11}/><Tooltip {...tip}/><Bar dataKey="p" name="Protein g" fill="#c6f000" radius={3}/>{target>0&&<ReferenceLine y={target} stroke="#fb923c" strokeDasharray="4 4"/>}</BarChart></ResponsiveContainer></div></div></div>}
