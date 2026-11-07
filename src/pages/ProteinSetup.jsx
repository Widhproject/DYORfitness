import {useEffect,useState} from 'react'
import {supabase} from '../supabase'
import {useAuth} from '../lib'
import {bmi,targetG} from '../calc'
export default function ProteinSetup(){
 const {user}=useAuth(),[f,setF]=useState({weight_kg:'',height_cm:'',age:'',goal:'general'}),[gpk,setGpk]=useState(2),[custom,setCustom]=useState(''),[auto,setAuto]=useState(true),[cur,setCur]=useState(null),[msg,setMsg]=useState('')
 useEffect(()=>{(async()=>{const [p,t]=await Promise.all([supabase.from('profiles').select('weight_kg,height_cm,age,goal').eq('id',user.id).maybeSingle(),supabase.from('protein_targets').select('*').eq('user_id',user.id).maybeSingle()])
  if(p.data)setF({weight_kg:p.data.weight_kg??'',height_cm:p.data.height_cm??'',age:p.data.age??'',goal:p.data.goal||'general'})
  if(t.data){setCur(+t.data.target_g);[1.6,1.8,2,2.2].includes(+t.data.g_per_kg)?setGpk(+t.data.g_per_kg):(setGpk('custom'),setCustom(t.data.target_g))}})()},[])
 const w=+f.weight_kg,b=bmi(w,+f.height_cm),calc=gpk==='custom'?+custom:w>0?targetG(w,gpk):0
 const save=async()=>{if(!(w>0&&w<500))return setMsg('Isi berat badan yang valid (kg).')
  if(f.height_cm&&!(+f.height_cm>=50&&+f.height_cm<=260))return setMsg('Tinggi badan 50–260 cm.')
  if(f.age&&!(+f.age>=10&&+f.age<=100))return setMsg('Usia 10–100 tahun.')
  const target=gpk!=='custom'&&!auto&&cur?cur:calc;if(!(target>0))return setMsg('Target protein tidak valid.')
  const a=await supabase.from('profiles').upsert({id:user.id,weight_kg:w,height_cm:+f.height_cm||null,age:+f.age||null,goal:f.goal})
  const c=await supabase.from('protein_targets').upsert({user_id:user.id,g_per_kg:gpk==='custom'?null:gpk,target_g:target,updated_at:new Date().toISOString()})
  dispatchEvent(new Event('dyor-food'));setMsg(a.error||c.error?(a.error||c.error).message:`Tersimpan. Target protein: ${target} g/hari`);if(!c.error)setCur(target)}
 const inp=(k,ph)=><input className="input" type="number" step="any" placeholder={ph} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>
 return <div className="card space-y-3"><b>Target protein</b><div className="grid grid-cols-3 gap-2">{inp('weight_kg','Berat (kg)')}{inp('height_cm','Tinggi (cm)')}{inp('age','Usia')}</div>
  <select className="input" value={f.goal} onChange={e=>setF({...f,goal:e.target.value})}>{[['bulking','Bulking'],['cutting','Cutting'],['maintenance','Maintenance'],['general','General Fitness']].map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
  <select className="input" value={gpk} onChange={e=>setGpk(e.target.value==='custom'?'custom':+e.target.value)}>{[1.6,1.8,2,2.2].map(g=><option key={g} value={g}>{g} g/kg</option>)}<option value="custom">Custom (gram/hari)</option></select>
  {gpk==='custom'&&<input className="input" type="number" placeholder="Target gram/hari" value={custom} onChange={e=>setCustom(e.target.value)}/>}
  <label className="flex gap-2 text-sm"><input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)}/>Hitung ulang target otomatis saat berat badan diperbarui</label>
  <div className="text-sm text-zinc-300">{b&&<>BMI {b} (informasi tambahan, bukan dasar tunggal target). </>}{calc>0&&<>Target: <b className="text-lime">{calc} g/hari</b></>}</div>
  <button className="btn" onClick={save}>Simpan</button>{msg&&<p className="text-sm text-lime">{msg}</p>}</div>}
