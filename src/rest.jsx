import {createContext,useContext,useEffect,useRef,useState} from 'react'
import {Timer,Pause,RotateCcw,SkipForward,X} from 'lucide-react'
import {supabase} from './supabase'
import {useAuth} from './lib'
const Ctx=createContext(null)
export const useRest=()=>useContext(Ctx)
const DEF={default_sec:90,auto_start:true,sound:true,sound_type:'beep',volume:0.7,vibrate:true,notify:false}
const KEY='dyorfitness_timer',PRE=[30,60,90,120,180]
let ac
const unlock=()=>{try{ac??=new (window.AudioContext||window.webkitAudioContext)();ac.resume()}catch{}}
export function playSound(type,v){unlock();try{
 const seq={beep:[[880,0,.25]],chime:[[660,0,.2],[990,.22,.35]],triple:[[800,0,.15],[800,.25,.15],[800,.5,.3]]}[type]||[]
 seq.forEach(([f,t,d])=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(ac.destination);o.start(ac.currentTime+t);o.stop(ac.currentTime+t+d)})}catch{}}
const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
export function RestProvider({children}){
 const {user}=useAuth(),[p,setP]=useState(DEF),[,tick]=useState(0),fired=useRef(0)
 const [t,setT]=useState(()=>{try{const x=JSON.parse(localStorage.getItem(KEY));return x&&(x.left!=null||x.endAt>Date.now()-5000)?x:null}catch{return null}})
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(t))}catch{}},[t])
 useEffect(()=>{supabase.from('rest_timer_preferences').select('*').eq('user_id',user.id).maybeSingle().then(({data})=>data&&setP({...DEF,...data,volume:+data.volume}))},[user.id])
 const running=!!t&&t.left==null
 useEffect(()=>{if(!running)return;const i=setInterval(()=>tick(x=>x+1),250),v=()=>tick(x=>x+1);document.addEventListener('visibilitychange',v);return()=>{clearInterval(i);document.removeEventListener('visibilitychange',v)}},[running])
 const left=!t?0:t.left!=null?t.left:Math.max(0,Math.ceil((t.endAt-Date.now())/1000))  // dasar: timestamp akhir
 useEffect(()=>{if(running&&left===0&&fired.current!==t.endAt){fired.current=t.endAt
  if(p.sound)playSound(p.sound_type,p.volume)
  if(p.vibrate&&navigator.vibrate)navigator.vibrate([300,100,300])
  if(p.notify&&'Notification' in window&&Notification.permission==='granted')new Notification('DYORFitness',{body:'Waktu istirahat selesai. Lanjut set berikutnya!'})
  setT({total:t.total,left:0,done:true})}})
 const start=(sec=p.default_sec)=>{unlock();setT({endAt:Date.now()+sec*1000,total:sec})}
 const v={p,t,left,running,start,
  pause:()=>setT({total:t.total,left}),resume:()=>{unlock();setT({total:t.total,endAt:Date.now()+t.left*1000})},
  reset:()=>t&&setT({total:t.total,left:t.total}),skip:()=>setT(null),
  add15:()=>t?setT(running?{endAt:t.endAt+15000,total:t.total+15}:{total:t.total+15,left:t.left+15}):start(15),
  save:async n=>{setP(n);await supabase.from('rest_timer_preferences').upsert({user_id:user.id,...Object.fromEntries(Object.keys(DEF).map(k=>[k,n[k]]))})}}
 return <Ctx.Provider value={v}>{children}</Ctx.Provider>}
export function RestWidget(){
 const r=useRest(),{p,t,left}=r,[open,setOpen]=useState(false),[cm,setCm]=useState(''),[cs,setCs]=useState(''),[vol,setVol]=useState(p.volume)
 useEffect(()=>setVol(p.volume),[p.volume])
 const set=(k,x)=>r.save({...p,[k]:x}),shown=t?left:p.default_sec,C=2*Math.PI*44,pct=t?left/t.total:1
 const pos="fixed bottom-20 md:bottom-4 right-4 z-40 card shadow-xl"
 if(!open)return <button onClick={()=>setOpen(true)} className={pos+' flex items-center gap-2 !py-2'}><Timer size={18} className="text-lime"/><b className={t&&!t.done?'text-lime':''}>{t?.done?'Selesai':fmt(shown)}</b></button>
 const custom=()=>{const s=(+cm||0)*60+(+cs||0);s>0&&s<=3600?r.start(s):alert('Isi durasi 1 detik sampai 60 menit')}
 return <div className={pos+' w-80 max-w-[calc(100vw-2rem)] space-y-3 max-h-[75vh] overflow-auto'}>
  <div className="flex justify-between"><b>Rest Timer</b><button onClick={()=>setOpen(false)}><X size={16}/></button></div>
  <div className="relative w-28 h-28 mx-auto"><svg viewBox="0 0 100 100" className="-rotate-90"><circle cx="50" cy="50" r="44" fill="none" stroke="#222" strokeWidth="8"/><circle cx="50" cy="50" r="44" fill="none" stroke="#c6f000" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-pct)}/></svg><div className="absolute inset-0 grid place-items-center text-2xl font-extrabold">{fmt(shown)}</div></div>
  <div className="flex justify-center gap-2">{!t||t.done?<button className="btn" onClick={()=>r.start()}>Start</button>:r.running?<button className="btn2" onClick={r.pause} title="Pause"><Pause size={16}/></button>:<button className="btn" onClick={r.resume}>Resume</button>}
   <button className="btn2" onClick={r.reset} title="Reset"><RotateCcw size={16}/></button><button className="btn2" onClick={r.add15}>+15s</button><button className="btn2" onClick={r.skip} title="Skip"><SkipForward size={16}/></button></div>
  <div className="flex flex-wrap gap-1 justify-center">{PRE.map(s=><button key={s} className="btn2 text-xs !px-2" onClick={()=>r.start(s)}>{s}s</button>)}</div>
  <div className="flex gap-1 items-center"><input className="input text-center" type="number" min="0" placeholder="mnt" value={cm} onChange={e=>setCm(e.target.value)}/><input className="input text-center" type="number" min="0" max="59" placeholder="dtk" value={cs} onChange={e=>setCs(e.target.value)}/><button className="btn2" onClick={custom}>Mulai</button></div>
  <div className="border-t border-white/10 pt-2 space-y-2 text-sm">
   <label className="flex justify-between">Auto-start setelah set<input type="checkbox" checked={p.auto_start} onChange={e=>set('auto_start',e.target.checked)}/></label>
   <label className="flex justify-between items-center">Durasi default<select className="input w-24" value={p.default_sec} onChange={e=>set('default_sec',+e.target.value)}>{[...new Set([30,45,60,90,120,150,180,300,p.default_sec])].sort((a,b)=>a-b).map(s=><option key={s} value={s}>{s}s</option>)}</select></label>
   <label className="flex justify-between">Suara<input type="checkbox" checked={p.sound} onChange={e=>set('sound',e.target.checked)}/></label>
   <select className="input" value={p.sound_type} onChange={e=>set('sound_type',e.target.value)}><option value="beep">Beep</option><option value="chime">Chime</option><option value="triple">Triple</option></select>
   <input type="range" className="w-full accent-lime" min="0" max="1" step=".05" value={vol} onChange={e=>setVol(+e.target.value)} onPointerUp={()=>set('volume',vol)}/>
   <button className="btn2 w-full" onClick={()=>playSound(p.sound_type,vol)}>Test sound</button>
   <label className="flex justify-between">Getar<input type="checkbox" checked={p.vibrate} onChange={e=>set('vibrate',e.target.checked)}/></label>
   <label className="flex justify-between">Notifikasi browser<input type="checkbox" checked={p.notify} onChange={async e=>{if(e.target.checked&&'Notification' in window){set('notify',(await Notification.requestPermission())==='granted')}else set('notify',false)}}/></label>
   <p className="text-xs text-zinc-500">Di HP, browser dapat menahan suara saat layar mati. Notifikasi lebih andal daripada suara.</p></div></div>}
