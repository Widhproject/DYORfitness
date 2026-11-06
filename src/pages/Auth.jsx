import {useState} from 'react'
import {supabase} from '../supabase'
const Shell=({children})=><div className="min-h-screen grid place-items-center p-4"><div className="card w-full max-w-sm space-y-4 fade"><div className="text-3xl font-extrabold text-lime">IRONLOG</div>{children}</div></div>
export default function Auth(){
 const [mode,setMode]=useState('login'),[f,setF]=useState({name:'',email:'',password:''}),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
 const set=k=>e=>setF({...f,[k]:e.target.value})
 const submit=async e=>{e.preventDefault();setBusy(true);setMsg('')
  let error
  if(mode==='login')({error}=await supabase.auth.signInWithPassword({email:f.email,password:f.password}))
  else if(mode==='signup'){const r=await supabase.auth.signUp({email:f.email,password:f.password,options:{data:{full_name:f.name},emailRedirectTo:location.origin}});error=r.error;if(!error)setMsg('Akun dibuat. Cek email untuk verifikasi, lalu login.')}
  else{({error}=await supabase.auth.resetPasswordForEmail(f.email,{redirectTo:location.origin}));if(!error)setMsg('Link reset password dikirim ke email.')}
  if(error)setMsg(error.message);setBusy(false)}
 return <Shell><form onSubmit={submit} className="space-y-3">
  <h1 className="font-bold">{{login:'Masuk',signup:'Buat akun',forgot:'Lupa password'}[mode]}</h1>
  {mode==='signup'&&<input className="input" placeholder="Nama" required value={f.name} onChange={set('name')}/>}
  <input className="input" type="email" placeholder="Email" required value={f.email} onChange={set('email')}/>
  {mode!=='forgot'&&<input className="input" type="password" placeholder="Password (min. 6 karakter)" minLength={6} required value={f.password} onChange={set('password')}/>}
  {msg&&<p className="text-sm text-lime">{msg}</p>}
  <button className="btn w-full" disabled={busy}>{{login:'Masuk',signup:'Daftar',forgot:'Kirim link reset'}[mode]}</button></form>
  <div className="flex justify-between text-sm text-zinc-400">
   <button onClick={()=>{setMode(mode==='login'?'signup':'login');setMsg('')}}>{mode==='login'?'Buat akun baru':'Sudah punya akun'}</button>
   {mode==='login'&&<button onClick={()=>{setMode('forgot');setMsg('')}}>Lupa password?</button>}</div></Shell>}
export function NewPassword({done}){
 const [p,setP]=useState(''),[msg,setMsg]=useState('')
 const go=async e=>{e.preventDefault();const {error}=await supabase.auth.updateUser({password:p});error?setMsg(error.message):done()}
 return <Shell><form onSubmit={go} className="space-y-3"><h1 className="font-bold">Password baru</h1>
  <input className="input" type="password" minLength={6} required value={p} onChange={e=>setP(e.target.value)}/>{msg&&<p className="text-sm text-red-400">{msg}</p>}<button className="btn w-full">Simpan</button></form></Shell>}
