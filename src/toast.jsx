import {useEffect,useState} from 'react'
let push=()=>{}
export const toast=(msg,o={})=>push({id:Math.random(),msg,...o})
export function ToastHost(){
 const [l,setL]=useState([]),drop=id=>setL(x=>x.filter(y=>y.id!==id))
 useEffect(()=>{push=t=>{setL(x=>[...x,t]);setTimeout(()=>drop(t.id),t.undo?6000:2500)};return()=>{push=()=>{}}},[])
 return <div className="fixed bottom-36 md:bottom-20 left-1/2 -translate-x-1/2 z-50 space-y-2" role="status" aria-live="polite">{l.map(t=>
  <div key={t.id} className="card !py-2 !px-4 flex items-center gap-3 text-sm shadow-xl">{t.msg}{t.undo&&<button className="text-lime font-bold" onClick={()=>{t.undo();drop(t.id)}}>Undo</button>}</div>)}</div>}
