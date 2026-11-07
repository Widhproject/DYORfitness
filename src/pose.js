// Ilustrasi gerakan: figur garis tampak samping dari sudut sendi (derajat). Frame=[torso,lenganAtas,lenganBawah,paha,betis,angkatTumit?]
const BODY='#d8dfda',LIME='#c6f000',PAD='#3b4540',R=a=>a*Math.PI/180
const add=(p,a,l)=>[p[0]+Math.sin(R(a))*l,p[1]+Math.cos(R(a))*l]
export function fk([t,ua,fa,th,sh]){const sd=[Math.sin(R(t)),-Math.cos(R(t))],hip=[0,0],sho=[sd[0]*30,sd[1]*30],el=add(sho,ua,16),ha=add(el,fa,15),kn=add(hip,th,20)
 return{hip,sho,el,ha,kn,ft:add(kn,sh,20),hd:[sho[0]+sd[0]*11,sho[1]+sd[1]*11],sd}}
const S3=(a,b,c)=>[a,b,c],lying=(f)=>f
export const P={
 BENCH:{f:[[-90,180,180,125,5],[-90,80,180,125,5],[-90,180,180,125,5]],eq:['bar','bench'],fx:70,s:['Berbaring, bahu rapat ke bench, bar tepat di atas dada.','Turunkan bar terkontrol sampai mendekati dada.','Dorong bar ke atas sampai lengan hampir lurus.'],tip:'Kaki menapak mantap dan jangan memantulkan bar di dada.'},
 INCLINE:{f:[[-50,165,175,125,5],[-50,70,170,125,5],[-50,165,175,125,5]],eq:['bar','bench'],fx:70,s:['Bangku miring, bar di atas dada bagian atas.','Turunkan bar ke dada atas dengan terkontrol.','Dorong kembali ke atas tanpa mengangkat bahu.'],tip:'Sudut bangku sedang (sekitar 30–45°) cukup untuk dada atas.'},
 FLY:{f:[[-90,180,180,125,5],[-90,140,165,125,5],[-90,100,150,125,5]],eq:['db','bench'],fx:70,s:['Lengan terentang di atas dada, siku sedikit menekuk.','Buka lengan perlahan mengikuti busur.','Rasakan peregangan dada, lalu peluk kembali ke atas.'],tip:'Siku tetap sedikit menekuk; jangan turun terlalu dalam.'},
 OHP:{z:.75,f:[[0,25,180,0,0],[0,100,180,0,0],[0,175,180,0,0]],eq:['bar'],fx:45,s:['Beban setinggi bahu, perut kencang, punggung netral.','Dorong beban ke atas melewati wajah.','Luruskan lengan di atas bahu tanpa melengkungkan punggung.'],tip:'Kencangkan bokong dan perut agar punggung tidak melengkung.'},
 RAISE:{f:[[0,0,0,0,0],[0,45,45,0,0],[0,90,90,0,0]],eq:['db'],fx:45,s:['Berdiri tegak, dumbbell di samping badan.','Angkat lengan perlahan, siku sedikit menekuk.','Berhenti setinggi bahu lalu turunkan terkontrol.'],tip:'Pakai beban ringan dan jangan mengayun dengan badan. Gambar tampak samping.'},
 PUSHDOWN:{f:[[8,15,95,0,0],[8,12,50,0,0],[8,8,5,0,0]],eq:['up'],fx:45,s:['Siku menempel di samping badan, lengan bawah sejajar lantai.','Dorong kabel ke bawah tanpa menggerakkan siku.','Luruskan lengan lalu kembali terkontrol.'],tip:'Hanya lengan bawah yang bergerak; siku tetap diam.'},
 OVERHEAD:{z:.75,f:[[0,175,-30,0,0],[0,175,-100,0,0],[0,178,180,0,0]],eq:['db'],fx:45,s:['Lengan lurus ke atas, beban di belakang kepala.','Luruskan lengan bawah ke atas, siku tetap menunjuk ke atas.','Kunci lengan di atas kepala lalu turunkan perlahan.'],tip:'Jaga siku tetap dekat kepala dan perut kencang.'},
 SKULL:{f:[[-90,170,175,125,5],[-90,170,-110,125,5],[-90,170,175,125,5]],eq:['bar','bench'],fx:70,s:['Berbaring, bar di atas dada dengan lengan lurus.','Tekuk siku, turunkan bar ke arah dahi.','Luruskan lengan kembali ke atas.'],tip:'Siku tidak melebar; gunakan beban yang bisa dikontrol.'},
 PULLDOWN:{f:[[-10,170,175,85,5],[-10,115,165,85,5],[-10,20,165,85,5]],eq:['up','seat'],al:'hip',hx:40,hy:56,s:['Duduk, pegang bar di atas kepala, dada terbuka.','Tarik siku ke bawah dan ke samping badan.','Bar mendekati dada atas, tahan sebentar lalu kembali.'],tip:'Pikirkan menarik dengan siku, bukan dengan tangan.'},
 PULLUP:{f:[[0,178,180,-5,-15],[0,100,175,-5,-15],[0,35,170,-5,-15]],eq:['barup'],al:'hand',s:['Menggantung dengan lengan lurus, bahu aktif.','Tarik badan ke atas dengan menurunkan siku.','Dagu melewati bar, turun perlahan sampai lengan lurus.'],tip:'Hindari mengayun; gunakan versi bantuan bila perlu.'},
 ROW:{f:[[65,0,0,12,-8],[65,-35,10,12,-8],[65,-65,10,12,-8]],eq:['bar'],fx:45,s:['Condongkan badan, punggung lurus, lengan menggantung.','Tarik beban ke arah perut bagian bawah.','Remas tulang belikat lalu turunkan terkontrol.'],tip:'Jaga punggung tetap netral sepanjang gerakan.'},
 SROW:{f:[[-3,88,88,80,5],[0,40,86,80,5],[-8,-30,88,80,5]],eq:['far','seat'],al:'hip',hx:36,hy:56,s:['Duduk tegak, lengan terulur ke depan memegang handle.','Tarik handle ke arah perut dengan siku ke belakang.','Remas punggung tengah lalu kembali terkontrol.'],tip:'Jangan menyentak dengan badan; dada tetap terbuka.'},
 CURL:{f:[[0,3,3,0,0],[0,6,90,0,0],[0,10,155,0,0]],eq:['db'],fx:45,s:['Berdiri tegak, lengan lurus, siku menempel badan.','Tekuk siku, angkat beban ke depan.','Kontraksikan biceps di atas lalu turunkan perlahan.'],tip:'Siku tetap diam; jangan mengayun dengan punggung.'},
 SQUAT:{f:[[0,0,0,0,0],[20,0,0,50,-10],[35,0,0,95,-25]],eq:['back'],noarms:1,fx:45,s:['Berdiri tegak, beban stabil, kaki selebar bahu.','Tekuk lutut dan pinggul bersamaan, dada tetap terbuka.','Turun sampai paha sekitar sejajar lantai, lalu dorong naik lewat tumit.'],tip:'Lutut searah jari kaki dan punggung tetap netral.'},
 LEGPRESS:{f:[[-60,20,60,155,80],[-60,20,60,135,95],[-60,20,60,120,105]],eq:['bench','plat'],al:'hip',hx:46,hy:64,s:['Punggung menempel sandaran, kaki di platform selebar bahu.','Dorong platform dengan tumit.','Luruskan kaki tanpa mengunci lutut, lalu kembali terkontrol.'],tip:'Pinggul tetap menempel jok saat turun.'},
 LEGEXT:{f:[[-5,20,20,85,5],[-5,20,20,85,45],[-5,20,20,85,85]],eq:['seat'],al:'hip',hx:38,hy:52,s:['Duduk, bantalan di atas pergelangan kaki.','Luruskan lutut mengangkat bantalan.','Tahan sebentar saat lurus, turunkan perlahan.'],tip:'Gerakan terkontrol, jangan menyentak.'},
 LEGCURL:{f:[[-5,20,20,85,85],[-5,20,20,85,40],[-5,20,20,85,-20]],eq:['seat'],al:'hip',hx:38,hy:52,s:['Kaki terulur, bantalan di belakang pergelangan.','Tekuk lutut menarik bantalan ke bawah.','Tahan sebentar lalu kembali perlahan.'],tip:'Jaga pinggul tetap menempel jok.'},
 CALF:{z:.9,f:[[0,0,0,0,0,0],[0,0,0,0,0,4],[0,0,0,0,0,9]],eq:[],fx:45,s:['Berdiri, tumit sejajar lantai.','Naikkan tumit perlahan.','Berjinjit setinggi mungkin, tahan, lalu turun terkontrol.'],tip:'Gunakan rentang gerak penuh dan jangan memantul.'},
 HINGE:{f:[[0,0,0,0,0],[40,0,0,8,-5],[70,0,0,15,-8]],eq:['bar'],fx:45,s:['Berdiri tegak memegang beban di depan paha.','Dorong pinggul ke belakang, punggung tetap lurus.','Turun sampai hamstring terasa teregang, lalu dorong pinggul ke depan.'],tip:'Beban dekat tubuh; gerakan berasal dari pinggul, bukan punggung.'},
 HIPTHRUST:{f:[[-70,0,0,130,20],[-85,0,0,115,10],[-100,0,0,105,0]],eq:['hipbar','benchU'],fx:72,s:['Punggung atas bersandar di bangku, beban di pinggul.','Dorong pinggul ke atas lewat tumit.','Tubuh membentuk garis lurus, remas glutes lalu turun.'],tip:'Dagu sedikit ditarik, jangan melengkungkan punggung bawah.'},
 FACE:{f:[[0,90,90,0,0],[0,70,130,0,0],[0,35,175,0,0]],eq:['far'],fx:45,s:['Lengan terulur ke depan memegang kabel.','Tarik ke arah wajah, siku melebar.','Remas bahu belakang lalu kembali terkontrol.'],tip:'Gerakan ringan dan terkontrol untuk bahu belakang.'},
 KICK:{f:[[15,60,60,0,0],[15,60,60,-20,-20],[15,60,60,-45,-30]],asym:1,eq:[],fx:45,s:['Berdiri, pegang penyangga, badan sedikit condong.','Ayunkan satu kaki ke belakang dengan lutut terkontrol.','Remas glutes di puncak, kembali perlahan.'],tip:'Jangan melengkungkan punggung bawah.'}}
const PAT=[[/Close Grip Bench|Bench Press|Flat Dumbbell|Chest Press/,'BENCH'],[/Incline/,'INCLINE'],[/Skull/,'SKULL'],[/Reverse Pec|Rear Delt|Face Pull/,'FACE'],[/Fly|Pec Deck/,'FLY'],[/Shoulder Press/,'OHP'],[/Lateral Raise|Front Raise/,'RAISE'],[/Overhead Cable/,'OVERHEAD'],[/Pushdown|Single Arm Cable/,'PUSHDOWN'],
 [/Pull Up/,'PULLUP'],[/Pulldown/,'PULLDOWN'],[/Seated Cable Row|Machine Row|Chest Supported/,'SROW'],[/Row/,'ROW'],[/Leg Curl/,'LEGCURL'],[/Curl/,'CURL'],[/Leg Extension/,'LEGEXT'],[/Calf Raise/,'CALF'],[/Leg Press/,'LEGPRESS'],[/Squat|Hack/,'SQUAT'],[/Deadlift|Romanian/,'HINGE'],[/Hip Thrust|Glute Bridge/,'HIPTHRUST'],[/Kickback/,'KICK']]
export const patFor=n=>PAT.find(([re])=>re.test(n))?.[1]
const f1=n=>n.toFixed(1),pl=(a,w,c,o=1)=>`<polyline points="${a.map(p=>f1(p[0])+','+f1(p[1])).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`
const ci=(p,r,c)=>`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r}" fill="${c}"/>`
export function poseSvg(f,p){const o=fk(f),lift=f[5]||0;let dx,dy
 if(p.al==='hip'){dx=p.hx;dy=p.hy}else if(p.al==='hand'){dx=50-o.ha[0];dy=18-o.ha[1]}else{const rf=p.asym?[0,40]:o.ft;dx=p.fx-rf[0];dy=92-lift-rf[1]}
 const q=k=>[o[k][0]+dx,o[k][1]+dy],H=q('hip'),S=q('sho'),E=q('el'),A=q('ha'),K=q('kn'),F=q('ft'),D=q('hd'),sd=o.sd,nn=[sd[1],-sd[0]],eq=p.eq||[],at=(a,v,k)=>[a[0]+v[0]*k,a[1]+v[1]*k],toe=x=>[x[0]+7,x[1]+lift],K2=p.asym?[H[0],H[1]+20]:K,F2=p.asym?[H[0],H[1]+40]:F,sh=(a,d)=>[a[0]+d,a[1]]
 let s='<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
 if(p.al!=='hand')s+='<line x1="6" y1="94" x2="94" y2="94" stroke="#2a312d" stroke-width="2"/>'
 if(p.z)s+=`<g transform="translate(50 94) scale(${p.z}) translate(-50 -94)">`
 s+=pl([sh(H,3),sh(K2,3),sh(F2,3),sh(toe(F2),3)],5,BODY,.4)+(p.noarms?'':pl([sh(S,3),sh(E,3),sh(A,3)],4,BODY,.4))
 if(eq.includes('bench')||eq.includes('seat'))s+=pl([at(at(S,nn,5),sd,6),at(at(H,nn,5),sd,-8)],6,PAD)
 if(eq.includes('seat'))s+=pl([[H[0]-8,H[1]+7],[H[0]+16,H[1]+7]],5,PAD)
 if(eq.includes('benchU'))s+=pl([[S[0]-10,S[1]+6],[S[0]+8,S[1]+6]],6,PAD)+pl([[S[0],S[1]+6],[S[0],94]],4,PAD)
 s+=pl([H,S],7,BODY)+ci(D,6.5,BODY)+pl([H,K,F,toe(F)],6,BODY)+(p.noarms?'':pl([S,E,A],4.5,BODY))
 if(eq.includes('bar'))s+=ci(A,6.5,LIME)+ci(A,2,'#141816')
 if(eq.includes('db'))s+=`<rect x="${f1(A[0]-5)}" y="${f1(A[1]-3)}" width="10" height="6" rx="2" fill="${LIME}"/>`
 if(eq.includes('back'))s+=ci(S,6,LIME)
 if(eq.includes('hipbar'))s+=ci(H,7,LIME)
 if(eq.includes('up'))s+=`<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(A[0])}" y2="4" stroke="#7b857f" stroke-width="1.2" stroke-dasharray="2 2"/>`+ci([A[0],4],2.5,'#7b857f')
 if(eq.includes('far'))s+=`<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="97" y2="${f1(A[1])}" stroke="#7b857f" stroke-width="1.2" stroke-dasharray="2 2"/>`+ci(A,2.5,LIME)
 if(eq.includes('barup'))s+=`<line x1="20" y1="18" x2="80" y2="18" stroke="${LIME}" stroke-width="3" stroke-linecap="round"/>`
 if(eq.includes('plat'))s+=pl([[F[0]+3,F[1]-11],[F[0]+3,F[1]+11]],5,LIME)
 return s+(p.z?'</g>':'')+'</svg>'}
