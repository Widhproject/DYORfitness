import {createContext,useContext,useEffect,useState} from 'react'
import {supabase} from './supabase'
export const AuthCtx=createContext(null)
export const useAuth=()=>useContext(AuthCtx)
export const CATS={PUSH:{c:'#c6f000',d:'Dada, bahu, triceps'},PULL:{c:'#38bdf8',d:'Punggung, rear delts, biceps'},LEGS:{c:'#fb923c',d:'Quads, hamstrings, glutes, calves'}}
export const catC=c=>CATS[c]?.c||({UPPER:'#a78bfa',LOWER:'#f472b6'}[c])||'#94a3b8'
export const pad=n=>String(n).padStart(2,'0')
export const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
export {vol,e1rm} from './calc'
export const num=n=>Math.round(n).toLocaleString('id-ID')
export const weekKey=ds=>{const d=new Date(ds+'T00:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)}
export const tip={contentStyle:{background:'#141816',border:'1px solid #333',borderRadius:12}}
export function useData(){
 const [d,setD]=useState({sessions:[],sets:[],loading:true})
 useEffect(()=>{(async()=>{
  const [a,b]=await Promise.all([
   supabase.from('workout_sessions').select('id,date,category').order('date'),
   supabase.from('workout_sets').select('weight,reps,set_type,workout_exercises(exercise_id,session_id,exercises(name),workout_sessions(date,category))').range(0,9999)])
  const sets=(b.data||[]).filter(r=>r.workout_exercises&&r.set_type!=='warmup').map(r=>{const e=r.workout_exercises;return{w:+r.weight,r:r.reps,ex:e.exercise_id,name:e.exercises.name,sid:e.session_id,date:e.workout_sessions.date,cat:e.workout_sessions.category}})
  setD({sessions:a.data||[],sets,loading:false})})()},[])
 return d}
