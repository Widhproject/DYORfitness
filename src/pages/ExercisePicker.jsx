import {useEffect,useState} from 'react'
import {Star,Pencil,Trash2,X} from 'lucide-react'
import {supabase} from '../supabase'
import {useAuth} from '../lib'
export default function ExercisePicker({cat,onPick,onClose}){
 const {user}=useAuth(),[list,setList]=useState([]),[favs,setFavs]=useState(new Set()),[q,setQ]=useState(''),[nm,setNm]=useState(''),[grp,setGrp]=useState('')
 const load=async()=>{const [a,b]=await Promise.all([supabase.from('exercises').select('*').eq('category',cat).order('name'),supabase.from('exercise_favorites').select('exercise_id')]);setList(a.data||[]);setFavs(new Set((b.data||[]).map(x=>x.exercise_id)))}
 useEffect(()=>{load()},[cat])
 const groups=[...new Set(list.map(e=>e.muscle_group))]
 const fav=async e=>{favs.has(e.id)?await supabase.from('exercise_favorites').delete().eq('exercise_id',e.id):await supabase.from('exercise_favorites').insert({user_id:user.id,exercise_id:e.id});load()}
 const add=async()=>{if(!nm.trim())return;const {error}=await supabase.from('exercises').insert({user_id:user.id,name:nm.trim(),category:cat,muscle_group:grp||groups[0]});if(error)alert(error.message);setNm('');load()}
 const ren=async e=>{const n=prompt('Nama exercise',e.name);if(n?.trim()){await supabase.from('exercises').update({name:n.trim()}).eq('id',e.id);load()}}
 const del=async e=>{if(confirm(`Hapus "${e.name}"? Riwayat latihan exercise ini ikut terhapus.`)){await supabase.from('exercises').delete().eq('id',e.id);load()}}
 const vis=list.filter(e=>e.name.toLowerCase().includes(q.toLowerCase()))
 const Row=e=><div key={e.id} className="flex items-center gap-2 py-1"><button className="flex-1 text-left hover:text-lime" onClick={()=>onPick(e)}>{e.name}{e.user_id&&<span className="text-xs text-zinc-500"> custom</span>}</button>
  {e.user_id&&<><button onClick={()=>ren(e)}><Pencil size={14}/></button><button onClick={()=>del(e)}><Trash2 size={14}/></button></>}
  <button onClick={()=>fav(e)}><Star size={16} className={favs.has(e.id)?'fill-lime text-lime':'text-zinc-500'}/></button></div>
 return <div className="fixed inset-0 bg-black/70 z-50 grid place-items-end md:place-items-center" onClick={onClose}><div className="card w-full md:max-w-lg max-h-[85vh] overflow-auto space-y-3 fade" onClick={e=>e.stopPropagation()}>
  <div className="flex gap-2"><input autoFocus className="input" placeholder={`Cari exercise ${cat}…`} value={q} onChange={e=>setQ(e.target.value)}/><button className="btn2" onClick={onClose}><X size={16}/></button></div>
  {vis.some(e=>favs.has(e.id))&&<div><div className="text-lime text-sm font-bold">Favorit</div>{vis.filter(e=>favs.has(e.id)).map(Row)}</div>}
  {groups.map(g=>{const v=vis.filter(e=>e.muscle_group===g);return v.length?<div key={g}><div className="text-zinc-400 text-sm font-bold">{g}</div>{v.map(Row)}</div>:null})}
  <div className="flex gap-2 pt-2 border-t border-white/10"><input className="input" placeholder="Exercise custom" value={nm} onChange={e=>setNm(e.target.value)}/>
   <select className="input w-36" value={grp} onChange={e=>setGrp(e.target.value)}>{groups.map(g=><option key={g}>{g}</option>)}</select><button className="btn" onClick={add}>Tambah</button></div></div></div>}
