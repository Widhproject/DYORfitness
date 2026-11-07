// Logika sinkronisasi 3 arah (murni, tanpa jaringan, bisa dites). S=terakhir sinkron, L=lokal, V=server sekarang.
const sk=o=>o&&Object.fromEntries(Object.entries(o).sort(([a],[b])=>a<b?-1:1))
const clean=r=>r&&Object.fromEntries(Object.entries(r).filter(([k])=>!k.startsWith('_')&&k!=='updated_at'&&k!=='created_at').map(([k,v])=>[k,v??null]))
export const same=(a,b)=>{if(!a||!b)return !a&&!b;const x=clean(a),y=clean(b);return [...new Set([...Object.keys(x),...Object.keys(y)])].every(k=>JSON.stringify(x[k]??null)===JSON.stringify(y[k]??null))}
export const send=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!k.startsWith('_')&&k!=='updated_at'))
export function plan(S,L,V,tables){const ups={},dels={},conflicts=[]
 for(const t of tables){ups[t]=[];dels[t]=[]
  for(const id of new Set([...Object.keys(S[t]||{}),...Object.keys(L[t]||{}),...Object.keys(V[t]||{})])){
   const s=S[t]?.[id],l=L[t]?.[id],v=V[t]?.[id]
   if(same(s,l))continue                       // tidak diubah lokal
   if(s?.updated_at!==v?.updated_at){            // server juga berubah
    if(same(l,v))continue                        // hasil sama, tidak perlu apa-apa
    conflicts.push({t,id,local:l||null,server:v||null});continue}
   if(l)ups[t].push(l);else if(v)dels[t].push(id)}}
 return{ups,dels,conflicts}}
export function flatDay(sessions){const m={sessions:{},exercises:{},sets:{}}
 for(const {workout_exercises:es=[],...s} of sessions){m.sessions[s.id]=s
  for(const {exercises,workout_sets:ts=[],...e} of es){m.exercises[e.id]={...e,_ex:exercises};for(const t of ts)m.sets[t.id]=t}}return m}
export function flatFood(rows){const m={food:{}};for(const {food_database,...r} of rows)m.food[r.id]={...r,_f:food_database};return m}
