import {P,patFor,poseSvg} from './pose'
import {MuscleFigure,HeroArt} from './art'
import {IMG,IMG_BASE} from './exerciseImages'
import {catC} from './lib'
const cache=new Map()
// Gambar kartu exercise: foto contoh bila ada, jika tidak ilustrasi garis, jika tidak peta otot
export function ExThumb({ex,w=112,h=88}){
 const im=IMG[ex.name]
 if(im)return <img src={IMG_BASE+im.t} width={w} height={h} loading="lazy" decoding="async" alt="" aria-hidden="true" className="shrink-0 rounded-xl object-cover bg-black" style={{width:w,height:h}}/>
 const p=P[patFor(ex.name)],c=catC(ex.category)
 let svg=null;if(p){svg=cache.get(ex.name);if(!svg){svg=poseSvg(p.f[1],p);cache.set(ex.name,svg)}}
 return <div className="shrink-0 rounded-xl overflow-hidden grid place-items-center" style={{width:w,height:h,background:`linear-gradient(135deg,${c}2b,#0e110f 75%)`}} aria-hidden="true">
  {svg?<div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{__html:svg}}/>
   :ex.primary_muscle_group?<MuscleFigure lv={{[ex.primary_muscle_group]:1}} className="h-4/5"/>:<HeroArt cat={ex.category}/>}</div>}
