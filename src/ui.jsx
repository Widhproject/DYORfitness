export const Ring=({pct,size=104,children})=>{const r=40,C=2*Math.PI*r
 return <div className="relative shrink-0" style={{width:size,height:size}}><svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90"><circle cx="50" cy="50" r={r} fill="none" stroke="#242a26" strokeWidth="9"/>
  <circle cx="50" cy="50" r={r} fill="none" stroke="#c6f000" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-pct/100)} style={{transition:'stroke-dashoffset .6s ease'}}/></svg>
  <div className="absolute inset-0 grid place-items-center">{children}</div></div>}
