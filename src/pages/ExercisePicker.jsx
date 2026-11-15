import {useEffect,useState} from 'react'
import {Star,Pencil,Trash2,X,Plus,Search,ArrowUpFromLine,ArrowDownToLine,Footprints} from 'lucide-react'
import {supabase} from '../supabase'
import {useAuth} from '../lib'
import {MGMAP} from '../calc'
import {cached} from '../sync'
import {ExerciseGuide} from '../guide'
import {ExThumb} from '../thumb'
import {toast} from '../toast'
const TABS=[['push','Push',ArrowUpFromLine],['pull','Pull',ArrowDownToLine],['legs','Legs',Footprints],['custom','Custom',Star]]
const START={PUSH:'push',UPPER:'push',PULL:'pull',LEGS:'legs',LOWER:'legs'}
export default function ExercisePicker({cat,onPick,onClose}){
 const {user}=useAuth(),[list,setList]=useState(null),[favs,setFavs]=useState(new Set()),[tab,setTab]=useState(START[cat]||'push'),[q,setQ]=useState(''),[grp,setGrp]=useState('Semua'),[guide,setGuide]=useState(null),[edit,setEdit]=useState(null),[nf,setNf]=useState({name:'',cat:'PUSH',grp:'Chest'})
 const load=async()=>{const [a,b]=await Promise.all([cached('ex:all',()=>supabase.from('exercises').select('*').order('name')),cached('favs',()=>supabase.from('exercise_favorites').select('exercise_id'))]);setList(a);setFavs(new Set(b.map(x=>x.exercise_id)))}
 useEffect(()=>{load()},[])
 useEffect(()=>{const h=e=>e.key==='Escape'&&!guide&&onClose();addEventListener('keydown',h);return()=>removeEventListener('keydown',h)},[guide])
 const all=list||[],inTab=all.filter(e=>tab==='custom'?!!e.user_id:e.category===tab.toUpperCase()),groups=['Semua','Favorit',...new Set(inTab.map(e=>e.muscle_group))]
 const shown=inTab.filter(e=>(grp==='Semua'||(grp==='Favorit'?favs.has(e.id):e.muscle_group===grp))&&e.name.toLowerCase().includes(q.trim().toLowerCase())).sort((a,b)=>favs.has(b.id)-favs.has(a.id)||a.name.localeCompare(b.name))
 const gOf=c=>[...new Set(all.filter(e=>e.category===c&&!e.user_id).map(e=>e.muscle_group))]
 const on=()=>navigator.onLine||(toast('Fitur ini butuh koneksi internet'),false)
 const pickTab=t=>{setTab(t);setGrp('Semua')}
 const fav=async e=>{if(!on())return;favs.has(e.id)?await supabase.from('exercise_favorites').delete().eq('exercise_id',e.id):await supabase.from('exercise_favorites').insert({user_id:user.id,exercise_id:e.id});load()}
 const rename=async()=>{const n=edit.name.trim();if(!n||!on())return;const {error}=await supabase.from('exercises').update({name:n}).eq('id',edit.id);if(error)return toast(error.code==='23505'?'Nama sudah dipakai di kategori ini':error.message);setEdit(null);load()}
 const del=async e=>{if(!on()||!confirm(`Hapus "${e.name}"? Riwayat latihan exercise ini ikut terhapus.`))return;await supabase.from('exercises').delete().eq('id',e.id);load()}
 const create=async()=>{const name=nf.name.trim();if(!name)return toast('Isi nama exercise');if(!on())return
  const {error}=await supabase.from('exercises').insert({user_id:user.id,name,category:nf.cat,muscle_group:nf.grp,primary_muscle_group:MGMAP[nf.grp]||null});if(error)return toast(error.code==='23505'?'Nama sudah dipakai di kategori ini':error.message)
  setNf({...nf,name:''});toast(`"${name}" ditambahkan ke Custom`);load()}
 const chip=a=>`shrink-0 min-h-[40px] px-3 rounded-xl text-sm border ${a?'bg-white/10 border-white/30 text-white':'border-white/10 text-zinc-400 hover:text-white'}`
 const Card=e=>{const f=favs.has(e.id),ed=edit?.id===e.id
  return <li key={e.id} className="relative rounded-2xl border border-white/10 bg-card hover:border-lime/40 transition-colors">
   <button className="w-full flex items-center gap-3 p-2 pr-14 text-left min-h-[96px] rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime" aria-label={`Lihat gerakan ${e.name}`} onClick={()=>setGuide(e)}>
    <ExThumb ex={e}/><span className="min-w-0"><span className="block font-bold leading-snug">{e.name}</span><span className="block text-xs text-zinc-400 mt-1">{e.muscle_group}{e.user_id?' · custom':''}</span></span></button>
   <button className="absolute top-1 right-1 w-11 h-11 grid place-items-center" aria-label={f?`Hapus ${e.name} dari favorit`:`Jadikan ${e.name} favorit`} aria-pressed={f} onClick={()=>fav(e)}><Star size={18} className={f?'fill-lime text-lime':'text-zinc-500'}/></button>
   <button className="absolute bottom-1 right-1 w-11 h-11 grid place-items-center rounded-full text-lime hover:bg-lime/10" aria-label={`Tambah ${e.name} ke sesi`} onClick={()=>onPick(e)}><Plus size={20}/></button>
   {e.user_id&&(ed?<div className="flex gap-2 p-2 pt-0"><input className="input" aria-label="Nama exercise" autoFocus value={edit.name} onChange={x=>setEdit({...edit,name:x.target.value})} onKeyDown={x=>{if(x.key==='Enter')rename();if(x.key==='Escape')setEdit(null)}}/><button className="btn !px-3" onClick={rename}>Simpan</button><button className="btn2" onClick={()=>setEdit(null)}>Batal</button></div>
    :<div className="flex gap-5 px-3 pb-2 text-xs text-zinc-400"><button className="py-2 inline-flex items-center gap-1 hover:text-white" onClick={()=>setEdit({id:e.id,name:e.name})}><Pencil size={13}/>Ubah nama</button><button className="py-2 inline-flex items-center gap-1 hover:text-white" onClick={()=>del(e)}><Trash2 size={13}/>Hapus</button></div>)}</li>}
 return <div className="fixed inset-0 bg-black/70 z-50 grid place-items-end md:place-items-center" onClick={onClose}>
  <div role="dialog" aria-modal="true" aria-label="Exercise Library" className="card w-full md:max-w-3xl h-[92vh] md:h-[85vh] flex flex-col gap-3 fade" onClick={e=>e.stopPropagation()}>
   <div className="flex items-start justify-between"><div><h2 className="text-xl font-extrabold">Exercise Library</h2><p className="text-sm text-zinc-400">Pilih gerakan untuk sesi latihanmu</p></div><button className="w-11 h-11 grid place-items-center" aria-label="Tutup" onClick={onClose}><X size={20}/></button></div>
   <div role="tablist" aria-label="Kategori exercise" className="grid grid-cols-4 gap-2">{TABS.map(([k,l,I])=><button key={k} role="tab" aria-selected={tab===k} onClick={()=>pickTab(k)} className={`min-h-[48px] rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold ${tab===k?'bg-lime border-lime text-black':'border-white/10 bg-black/30 text-zinc-300 hover:text-white'}`}><I size={16} aria-hidden="true"/>{l}</button>)}</div>
   <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true"/><input type="search" aria-label="Cari exercise" className="input !pl-9 min-h-[44px]" placeholder="Search exercises…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter kelompok otot">{groups.map(g=><button key={g} className={chip(grp===g)} aria-pressed={grp===g} onClick={()=>setGrp(g)}>{g}</button>)}</div>
   <div className="flex-1 overflow-y-auto space-y-3 pr-1">
    {tab==='custom'&&<div className="rounded-2xl border border-white/10 p-3 space-y-2"><b className="text-sm">Buat exercise custom</b><div className="flex flex-wrap gap-2">
     <input className="input flex-1 min-w-40" aria-label="Nama exercise baru" placeholder="Nama exercise" value={nf.name} onChange={e=>setNf({...nf,name:e.target.value})}/>
     <select className="input w-28" aria-label="Kategori" value={nf.cat} onChange={e=>setNf({...nf,cat:e.target.value,grp:gOf(e.target.value)[0]})}>{['PUSH','PULL','LEGS'].map(c=><option key={c}>{c}</option>)}</select>
     <select className="input w-36" aria-label="Kelompok otot" value={nf.grp} onChange={e=>setNf({...nf,grp:e.target.value})}>{gOf(nf.cat).map(g=><option key={g}>{g}</option>)}</select><button className="btn" onClick={create}>Simpan</button></div></div>}
    {list===null?<p className="text-sm text-zinc-400">Memuat daftar exercise…</p>
     :!all.length?<p className="text-sm text-zinc-400">Daftar exercise belum tersedia di perangkat ini. Hubungkan internet sekali untuk memuatnya; setelah itu daftar bisa dipakai offline.</p>
     :!shown.length?<div className="text-sm text-zinc-400 space-y-2"><p>{tab==='custom'&&!inTab.length?'Belum ada exercise custom. Buat yang pertama dengan form di atas.':`Tidak ada exercise yang cocok${q?` dengan "${q}"`:''} di tab ${tab}.`}</p>{(q||grp!=='Semua')&&<button className="btn2" onClick={()=>{setQ('');setGrp('Semua')}}>Reset pencarian dan filter</button>}</div>
     :<ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">{shown.map(Card)}</ul>}</div>
   {guide&&<ExerciseGuide ex={guide} onClose={()=>setGuide(null)} onAdd={()=>onPick(guide)}/>}</div></div>}
