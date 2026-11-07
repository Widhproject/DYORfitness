import {useEffect,useState} from 'react'
import {useSync,initSync,syncAll} from './sync'
export function SyncBadge(){
 const s=useSync(),[ip,setIp]=useState(null)
 useEffect(()=>{initSync();const h=e=>{e.preventDefault();setIp(e)};addEventListener('beforeinstallprompt',h);return()=>removeEventListener('beforeinstallprompt',h)},[])
 const lab={online:'Online',offline:'Offline',syncing:'Syncing…',synced:'Synced',failed:'Sync Failed'}[s.state],col={online:'#c6f000',offline:'#fb923c',syncing:'#38bdf8',synced:'#c6f000',failed:'#f87171'}[s.state]
 return <div className="fixed top-2 right-2 z-40 flex gap-2 text-xs">
  {ip&&<button className="card !py-1 !px-3" onClick={async()=>{ip.prompt();await ip.userChoice;setIp(null)}}>Install App</button>}
  <button title={s.msg} onClick={syncAll} className="card !py-1 !px-3 flex items-center gap-2"><i className="w-2 h-2 rounded-full" style={{background:col}}/>{lab}{s.pending>0&&` · ${s.pending} belum sinkron`}</button></div>}
