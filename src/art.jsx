import {catC} from './lib'
const COLS={NUTRI:'#34d399'}
export function HeroArt({cat='CUSTOM',className='w-full h-full'}){
 const c=COLS[cat]||catC(cat),id='g'+cat,dumb=<><rect x="170" y="76" width="190" height="9" rx="4"/><rect x="150" y="48" width="26" height="66" rx="7"/><rect x="354" y="48" width="26" height="66" rx="7"/><rect x="130" y="60" width="22" height="42" rx="6"/><rect x="378" y="60" width="22" height="42" rx="6"/></>
 const M={PUSH:<><rect x="140" y="76" width="250" height="9" rx="4"/><rect x="170" y="44" width="16" height="74" rx="6"/><rect x="192" y="56" width="11" height="50" rx="4"/><rect x="344" y="44" width="16" height="74" rx="6"/><rect x="327" y="56" width="11" height="50" rx="4"/><rect x="200" y="132" width="130" height="12" rx="6" opacity=".5"/></>,
  PULL:<><rect x="140" y="26" width="250" height="9" rx="4"/><rect x="150" y="26" width="8" height="120" rx="3"/><rect x="372" y="26" width="8" height="120" rx="3"/><path d="M265 35V86M232 86H298" stroke={c} strokeWidth="8" fill="none" strokeLinecap="round"/></>,
  LEGS:<><circle cx="300" cy="82" r="58" fill="none" stroke={c} strokeWidth="12"/><circle cx="300" cy="82" r="32" fill="none" stroke={c} strokeWidth="7"/><circle cx="300" cy="82" r="9"/><rect x="150" y="138" width="230" height="8" rx="4" opacity=".5"/></>,
  LOWER:<><circle cx="290" cy="98" r="40"/><path d="M262 66C262 22 318 22 318 66" stroke={c} strokeWidth="12" fill="none" strokeLinecap="round"/></>,
  UPPER:<g transform="rotate(-22 265 80)">{dumb}</g>,CUSTOM:dumb,
  NUTRI:<><circle cx="300" cy="80" r="52" fill="none" stroke={c} strokeWidth="9"/><circle cx="300" cy="80" r="30" opacity=".35"/><path d="M200 36V124M188 36V72M212 36V72" stroke={c} strokeWidth="7" fill="none" strokeLinecap="round"/></>}
 return <svg viewBox="0 0 400 160" preserveAspectRatio="xMaxYMid slice" className={className} aria-hidden="true"><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c} stopOpacity=".38"/><stop offset="1" stopColor="#141816"/></linearGradient></defs>
  <rect width="400" height="160" fill={`url(#${id})`}/><g fill={c} opacity=".92">{M[cat]||M.CUSTOM}</g></svg>}
const FR={chest:[[41,48,10,8],[59,48,10,8]],shoulders:[[28,40,7,7],[72,40,7,7]],biceps:[[22,56,5,11],[78,56,5,11]],quadriceps:[[40,125,9.5,23],[60,125,9.5,23]],calves:[[39,178,6,18],[61,178,6,18]]}
const BK={back:[[50,37,12,6],[38,62,8,16],[62,62,8,16]],shoulders:[[28,40,7,7],[72,40,7,7]],triceps:[[22,56,5,11],[78,56,5,11]],glutes:[[42,108,9,8],[58,108,9,8]],hamstrings:[[40,134,9.5,19],[60,134,9.5,19]],calves:[[39,178,6,18],[61,178,6,18]]}
const SIL=[[50,16,10,10],[22,52,7,18],[19,88,5.5,16],[78,52,7,18],[81,88,5.5,16],[40,128,11,26],[39,178,7.5,22],[60,128,11,26],[61,178,7.5,22]]
// lv: {otot: 0..1} = intensitas sorotan. Dipakai untuk exercise (primer 1, sekunder .4) dan peta otot (porsi working sets)
export function MuscleFigure({lv={},className='w-24'}){
 const fill=m=>lv[m]>0?`rgba(198,240,0,${.25+.75*Math.min(1,lv[m])})`:'#2a312d'
 const fig=R=><g><g fill="#1c221f">{SIL.map(([x,y,a,b],i)=><ellipse key={i} cx={x} cy={y} rx={a} ry={b}/>)}<rect x="45" y="25" width="10" height="8" rx="3"/><path d="M28 36Q50 30 72 36L68 102Q50 108 32 102Z"/></g>
  {Object.entries(R).flatMap(([m,l])=>l.map(([x,y,a,b],i)=><ellipse key={m+i} cx={x} cy={y} rx={a} ry={b} fill={fill(m)}/>))}</g>
 return <svg viewBox="0 0 200 205" className={className} aria-label="Peta otot"><g>{fig(FR)}</g><g transform="translate(100 0)">{fig(BK)}</g></svg>}
export const HeroCard=({cat,children})=><div className="card !p-5 relative overflow-hidden min-h-[11rem]"><div className="absolute inset-0"><HeroArt cat={cat}/></div><div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent"/><div className="relative space-y-3">{children}</div></div>
export const Empty=({cat='CUSTOM',title,text,children})=><div className="card text-center space-y-2 overflow-hidden"><div className="h-28 -mx-4 -mt-4 mb-2"><HeroArt cat={cat}/></div><div className="font-bold">{title}</div><p className="text-sm text-zinc-400">{text}</p>{children}</div>
