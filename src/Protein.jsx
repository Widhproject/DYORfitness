import {useCallback,useEffect,useState} from 'react'
import {useLocation,useNavigate} from 'react-router-dom'
import {Apple} from 'lucide-react'
import {supabase} from './supabase'
import {iso} from './lib'
import {kvGet,cached,getUid} from './sync'
import {Ring} from './ui'
// Total protein hari ini: pakai data lokal (termasuk yang belum tersinkron) bila ada, jika tidak ambil dari server
export function useProteinToday(){
 const [s,setS]=useState({total:0,target:0,ready:false})
 const load=useCallback(async()=>{const today=iso(new Date()),d=await kvGet(`${getUid()}:food:${today}`);let rows
  if(d)rows=Object.values(d.L.food||{});else{const {data,error}=await supabase.from('food_logs').select('protein_g').eq('date',today);rows=error?[]:data}
  const t=await cached('ptarget',()=>supabase.from('protein_targets').select('target_g').eq('user_id',getUid()).maybeSingle())
  setS({total:Math.round(rows.reduce((a,r)=>a+ +r.protein_g,0)*10)/10,target:+t?.target_g||0,ready:true})},[])
 useEffect(()=>{load();const v=()=>document.visibilityState==='visible'&&load()
  addEventListener('dyor-food',load);addEventListener('online',load);document.addEventListener('visibilitychange',v)
  return()=>{removeEventListener('dyor-food',load);removeEventListener('online',load);document.removeEventListener('visibilitychange',v)}},[load])
 return s}
export function ProteinCard(){
 const {total,target,ready}=useProteinToday(),nav=useNavigate(),pct=target?Math.min(100,Math.round(total/target*100)):0
 return <button onClick={()=>nav('/nutrition')} className="card w-full text-left space-y-2 hover:border-lime/50 transition">
  <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-sm text-zinc-300"><Apple size={16} className="text-lime"/>Protein hari ini</div>{target>0&&total>=target&&<span className="text-[11px] bg-lime text-black font-bold px-2 py-0.5 rounded-full">Target Achieved</span>}</div>
  <div className="flex items-end justify-between"><div className="text-2xl font-extrabold">{ready?total:'–'}<span className="text-sm text-zinc-400 font-normal"> {target?`/ ${target} g`:'g'}</span></div><div className="text-xs text-zinc-400">{target?`sisa ${Math.max(0,Math.round((target-total)*10)/10)} g`:'Atur target di Profile'}</div></div>
  <div className="h-2.5 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-lime transition-all duration-500" style={{width:pct+'%'}}/></div></button>}
export function ProteinPill(){
 const {total,target,ready}=useProteinToday(),nav=useNavigate(),loc=useLocation(),pct=target?Math.min(100,Math.round(total/target*100)):0
 if(loc.pathname==='/nutrition'||!ready)return null
 return <button onClick={()=>nav('/nutrition')} aria-label="Buka Nutrition" className="fixed bottom-20 md:bottom-4 left-4 md:left-60 z-40 card !py-2 !px-3 flex items-center gap-2 shadow-xl"><Ring pct={pct} size={28}/><b className="text-sm">{total}{target?`/${target}`:''} g</b></button>}
