import {X} from 'lucide-react'
import {MuscleFigure} from './art'
import {P,patFor,poseSvg} from './pose'
const cap=s=>s?s[0].toUpperCase()+s.slice(1):''
export function ExerciseGuide({ex,onClose,onAdd}){
 const p=P[patFor(ex.name)],lv={[ex.primary_muscle_group]:1,...Object.fromEntries((ex.secondary_muscle_groups||[]).map(m=>[m,.4]))}
 const cards=[...(p?p.f.map((f,i)=>({k:'f'+i,r:1,b:<><div className="rounded-lg overflow-hidden bg-black/30" dangerouslySetInnerHTML={{__html:poseSvg(f,p)}}/><div className="text-xs text-lime font-bold">Langkah {i+1}</div><p className="text-xs text-zinc-300">{p.s[i]}</p></>})):[{k:'g',r:1,b:<><div className="text-xs text-lime font-bold">Gerakan umum</div><p className="text-xs text-zinc-300">Belum ada ilustrasi khusus untuk exercise ini. Mulai dari beban ringan, gerakkan sendi dengan terkontrol naik dan turun, dan jaga postur tetap stabil.</p></>}]),
  {k:'m',r:2,b:<><MuscleFigure lv={lv} className="w-full"/><div className="text-xs text-zinc-300">Utama: <b className="text-lime">{cap(ex.primary_muscle_group)||ex.muscle_group||'-'}</b>{ex.secondary_muscle_groups?.length>0&&<><br/>Sekunder: {ex.secondary_muscle_groups.map(cap).join(', ')}</>}</div></>},
  {k:'t',r:2,b:<><div className="text-xs text-lime font-bold">Tips</div><p className="text-xs text-zinc-300">{p?.tip||'Utamakan teknik yang rapi sebelum menambah beban.'}</p></>},
  {k:'i',r:2,b:<><div className="text-xs text-lime font-bold">Info</div><p className="text-xs text-zinc-300">Kategori: {ex.exercise_category==='compound'?'Compound':ex.exercise_category==='isolation'?'Isolation':'-'}<br/>Kelompok: {ex.muscle_group||'-'}<br/><span className="text-zinc-500">Ilustrasi tampak samping sebagai gambaran umum. Sesuaikan dengan alat dan arahan pelatih.</span></p></>}]
 return <div className="fixed inset-0 z-[60] bg-black/70 grid place-items-end md:place-items-center" onClick={onClose}><div className="card w-full md:max-w-3xl space-y-3 fade" onClick={e=>e.stopPropagation()}>
  <div className="flex justify-between items-start"><div><h3 className="text-lg font-extrabold">{ex.name}</h3><div className="text-xs text-zinc-400">{ex.muscle_group}</div></div><button onClick={onClose} aria-label="Tutup"><X size={18}/></button></div>
  <div className="overflow-x-auto pb-2"><div className="grid grid-flow-col gap-3 auto-cols-[10.5rem]" style={{gridTemplateRows:'repeat(2,auto)'}}>{cards.map(c=><div key={c.k} style={{gridRow:c.r}} className="bg-black/30 rounded-xl p-2 space-y-1">{c.b}</div>)}</div></div>
  {onAdd&&<button className="btn w-full" onClick={onAdd}>+ Tambahkan ke sesi</button>}</div></div>}
