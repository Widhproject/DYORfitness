import {useEffect,useState} from 'react'
import {Routes,Route,Navigate,NavLink,Outlet} from 'react-router-dom'
import {LayoutDashboard,CalendarDays,Dumbbell,TrendingUp,User} from 'lucide-react'
import {supabase} from './supabase'
import {AuthCtx,iso} from './lib'
import Auth,{NewPassword} from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Workout from './pages/Workout'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
const nav=()=>[['/dashboard','Dashboard',LayoutDashboard],['/calendar','Calendar',CalendarDays],['/workout/'+iso(new Date()),'Workout',Dumbbell],['/progress','Progress',TrendingUp],['/profile','Profile',User]]
function Layout(){
 const items=nav()
 const cls=({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${isActive?'bg-lime/10 text-lime':'text-zinc-400 hover:text-white'}`
 return <div>
  <aside className="hidden md:flex fixed inset-y-0 w-56 flex-col gap-1 p-4 border-r border-white/5 bg-card">
   <div className="text-2xl font-extrabold text-lime mb-6 px-3">IRONLOG</div>
   {items.map(([to,l,I])=><NavLink key={l} to={to} className={cls}><I size={18}/>{l}</NavLink>)}</aside>
  <main className="md:ml-56 p-4 md:p-8 pb-24 md:pb-8 fade"><Outlet/></main>
  <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-white/5 flex justify-around py-2">
   {items.map(([to,l,I])=><NavLink key={l} to={to} className={({isActive})=>`flex flex-col items-center text-[11px] gap-1 ${isActive?'text-lime':'text-zinc-500'}`}><I size={20}/>{l}</NavLink>)}</nav></div>}
export default function App(){
 const [session,setSession]=useState(undefined),[recovery,setRecovery]=useState(false)
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session))
  const {data:{subscription}}=supabase.auth.onAuthStateChange((e,s)=>{if(e==='PASSWORD_RECOVERY')setRecovery(true);setSession(s)})
  return()=>subscription.unsubscribe()},[])
 if(session===undefined)return <div className="min-h-screen grid place-items-center text-lime">Memuat…</div>
 if(recovery&&session)return <NewPassword done={()=>setRecovery(false)}/>
 return <AuthCtx.Provider value={{user:session?.user}}><Routes>
  <Route path="/login" element={session?<Navigate to="/dashboard"/>:<Auth/>}/>
  <Route element={session?<Layout/>:<Navigate to="/login"/>}>
   <Route path="/dashboard" element={<Dashboard/>}/><Route path="/calendar" element={<Calendar/>}/>
   <Route path="/workout/:date" element={<Workout/>}/><Route path="/progress" element={<Progress/>}/><Route path="/profile" element={<Profile/>}/></Route>
  <Route path="*" element={<Navigate to="/dashboard"/>}/></Routes></AuthCtx.Provider>}
