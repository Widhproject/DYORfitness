export const vol=s=>s.w*s.r
export const e1rm=(w,r)=>w*(1+r/30)
export const isWork=t=>t!=='warmup'
export const proteinFor=(f,a)=>Math.round((f.unit==='unit'?a*f.protein_per_unit:a/100*f.protein_per_100g)*10)/10
export const bmi=(kg,cm)=>kg>0&&cm>0?Math.round(kg/((cm/100)**2)*10)/10:null
export const targetG=(kg,gpk)=>Math.round(kg*gpk)
export const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0
export const MG=['chest','back','shoulders','biceps','triceps','quadriceps','hamstrings','glutes','calves','abs']
export const MGMAP={Chest:'chest',Back:'back',Shoulders:'shoulders','Rear Delts':'shoulders',Biceps:'biceps',Triceps:'triceps',Quadriceps:'quadriceps',Hamstrings:'hamstrings',Glutes:'glutes',Calves:'calves',Abs:'abs'}
export const weekStart=ds=>{const d=new Date(ds+'T00:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
// working sets saja; otot primer = set penuh, otot sekunder dihitung terpisah (ind)
export function muscleAgg(rows,from=''){const o={};MG.forEach(m=>o[m]={sets:0,vol:0,dates:new Set(),ind:0})
 rows.forEach(r=>{if(r.date<from||r.type==='warmup'||!o[r.p])return;const a=o[r.p];a.sets++;a.vol+=r.w*r.r;a.dates.add(r.date);(r.sec||[]).forEach(m=>o[m]&&o[m].ind++)});return o}
