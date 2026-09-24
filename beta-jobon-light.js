(()=>{
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],toast=message=>{const el=$('#lightToast');el.textContent=message;el.classList.add('show');clearTimeout(window.lightToastTimer);window.lightToastTimer=setTimeout(()=>el.classList.remove('show'),2300)};
 const overview=window.betaProductionOverview;
 const records=overview.records().map(row=>({date:row.date,day:Number(row.date.slice(-2)),reference:row.reference,production:row.production,line:row.line,tools:row.summary?.contexts?Object.fromEntries(['CM','MF','BQ'].map(type=>{const t=row.summary.contexts[type]?.tool;return [type,t?[t.reference,t.lot,t.machines,t.process,t.quantity]:['','','','','']]})):{CM:['ST100','12','B1 · B3','NNPB','16 peças'],MF:['5447','08','B3','NNPB','16 peças'],BQ:[row.bq?.split(' · ')[0]||'T173','04','B3','—','144 peças']}}));
 const toolCatalog=[
   {toolId:'DEMO-TOOL-CM-001',type:'CM',reference:'ST100',lot:'12',machines:'B1 · B3',process:'NNPB',quantity:'16 peças'},
   {toolId:'DEMO-TOOL-CM-002',type:'CM',reference:'ST21',lot:'07',machines:'B2',process:'PS',quantity:'16 peças'},
   {toolId:'DEMO-TOOL-MF-001',type:'MF',reference:'5447',lot:'08',machines:'B3',process:'NNPB',quantity:'16 peças'},
   {toolId:'DEMO-TOOL-BQ-001',type:'BQ',reference:'T173',lot:'04',machines:'B3',process:'—',quantity:'144 peças'}
 ];
 try{const created=JSON.parse(sessionStorage.getItem('betaDemoTools')||'[]');if(Array.isArray(created))toolCatalog.push(...created.filter(tool=>tool.toolId&&tool.type))}catch(_){}
 let year=2026,month=8,day=21,selected=null;const sheet=$('#lightSheet');
 const selectedDate=()=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 const monthLabel=()=>new Date(year,month,1).toLocaleDateString('pt-PT',{month:'long'});
 function renderDays(){
   const root=$('#lightDays');root.replaceChildren();$('#lightMonthTitle').textContent=monthLabel();$('#lightMonthTitle').setAttribute('aria-label',new Date(year,month,1).toLocaleDateString('pt-PT',{month:'long',year:'numeric'}));
   const offset=(new Date(year,month,1).getDay()+6)%7;
   for(let i=0;i<offset;i++)root.append(document.createElement('span'));
   const total=new Date(year,month+1,0).getDate();
   for(let d=1;d<=total;d++){
     const button=document.createElement('button');button.type='button';button.textContent=d;
     const date=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
     button.className=(d===day?'selected ':'')+(records.some(r=>r.date===date)?'has':'');
     button.setAttribute('aria-label',new Date(year,month,d).toLocaleDateString('pt-PT',{dateStyle:'long'}));
     button.onclick=()=>{day=d;selected=null;renderDays();renderList()};root.append(button);
   }
 }
 function renderList(){
   const root=$('#lightProductionList');root.replaceChildren();
   const q=$('#lightSearch').value.trim().toLowerCase();
   const matches=records.filter(r=>r.date===selectedDate()&&`${r.reference} ${r.production} ${r.line}`.toLowerCase().includes(q)).sort((a,b)=>overview.lines.indexOf(a.line)-overview.lines.indexOf(b.line)||a.reference.localeCompare(b.reference));
   $('#lightDayTitle').textContent=`Produções de ${day} de ${monthLabel()}`;
   $('#lightNoResults').hidden=matches.length>0;
   $('#lightRemoveDate').disabled=!selected||!matches.includes(selected);
   for(const line of overview.lines){
     const onLine=matches.filter(record=>record.line===line);
     if(!onLine.length){
       if(!q){const empty=document.createElement('div');empty.className='beta-light-production beta-light-production-empty';const label=document.createElement('strong');label.textContent=line;const message=document.createElement('span');message.textContent='Sem produção neste dia';empty.append(label,message);root.append(empty)}
       continue;
     }
     for(const record of onLine){
     const button=document.createElement('button');button.type='button';button.className='beta-light-production'+(selected===record?' selected':'');
     const machine=document.createElement('strong');machine.textContent=record.line;
     const reference=document.createElement('span');reference.textContent=record.reference;
     const production=document.createElement('span');production.textContent=`Produção ${record.production}`;
     button.append(machine,reference,production);button.onclick=()=>{selected=record;renderList()};button.ondblclick=()=>open(record);root.append(button);
     }
   }
 }
 function changeMonth(delta){const date=new Date(year,month+delta,1);year=date.getFullYear();month=date.getMonth();day=1;selected=null;renderDays();renderList()}
 $('#lightPreviousMonth').onclick=()=>changeMonth(-1);
 $('#lightNextMonth').onclick=()=>changeMonth(1);
 $('#lightRemoveDate').onclick=()=>{
   if(!selected||selected.date!==selectedDate())return;
   const row=selected;
   const saved=JSON.parse(sessionStorage.getItem('betaJobOnSummaries')||'[]');
   const match=saved.find(item=>item.reference===row.reference&&item.production===row.production&&item.machine===row.line);
   if(match){match.plannedDate='';sessionStorage.setItem('betaJobOnSummaries',JSON.stringify(saved))}
   else {const key='betaJobOnCalendarDetached';const detached=JSON.parse(sessionStorage.getItem(key)||'[]');
     const identity=`${row.line}|${row.reference}|${row.production}`;
     if(!detached.includes(identity))sessionStorage.setItem(key,JSON.stringify([...detached,identity]));}
   row.date='';selected=null;renderDays();renderList();renderDetachedHistory();toast('Associação ao dia retirada; Job On preservado.');
 };
 function renderDetachedHistory(){
   const history=$('.beta-light-history');history.querySelectorAll('[data-detached-jobon]').forEach(item=>item.remove());
   for(const record of records.filter(item=>!item.date)){
     const entry=document.createElement('div');entry.dataset.detachedJobon='';entry.tabIndex=0;
     const title=document.createElement('strong');title.textContent=`${record.reference} · ${record.production} · ${record.line}`;
     const detail=document.createElement('span');detail.textContent='Sem dia associado · Duplo clique para abrir o Job On';
     entry.append(title,detail);entry.ondblclick=()=>{$('.beta-light-tabs [data-light-view="jobon"]').click();open(record)};
     entry.onkeydown=event=>{if(event.key==='Enter'){entry.ondblclick()}};history.append(entry);
   }
 }
 function showTools(record){
   const root=$('#lightTools');root.replaceChildren();
   for(const type of ['CM','MF','BQ']){
     const facts=record?.tools?.[type]||['','','','',''];
     const catalog=toolCatalog.filter(item=>item.type===type);
     const card=document.createElement('section');card.className='beta-light-tool';card.dataset.type=type;
     const title=document.createElement('h3');title.textContent=type;
     const input=document.createElement('input');input.type='search';input.setAttribute('aria-label',`Pesquisar ${type}`);input.placeholder=`Pesquisar ${type} por referência`;input.value=facts[0];
     const results=document.createElement('div');results.className='beta-light-tool-result';
     const missing=document.createElement('a');missing.className='dmo-button ghost';missing.textContent=`Criar ${type}`;missing.hidden=true;missing.href='tool-create.html';
     const choose=tool=>{card.dataset.tool=JSON.stringify(tool);input.value=tool.reference;results.hidden=true;missing.hidden=true;toast(`${type} ${tool.reference} · Lote ${tool.lot} selecionado`)};
     const draw=()=>{const term=input.value.trim().toLowerCase();results.replaceChildren();const matches=catalog.filter(item=>!term||`${item.reference} ${item.lot}`.toLowerCase().includes(term));for(const tool of matches){const button=document.createElement('button');button.type='button';button.textContent=`${type} ${tool.reference} · Lote ${tool.lot} · ${tool.process}`;button.onclick=()=>choose(tool);results.append(button)}results.hidden=!matches.length;missing.hidden=!term||!!matches.length;missing.href=`tool-create.html?from=jobon&type=${type}&reference=${encodeURIComponent(input.value.trim())}`};
     input.oninput=()=>{delete card.dataset.tool;draw()};input.onfocus=draw;
     missing.onclick=()=>sessionStorage.setItem('lightJobDraft',JSON.stringify({reference:$('#lightReference').value,production:$('#lightProduction').value,line:$('#lightMachine').value,start:$('#lightStart').value,end:$('#lightEnd').value}));
     card.append(title,input,results,missing);root.append(card);
     if(facts[0]){const existing=catalog.find(item=>item.reference===facts[0]&&item.lot===facts[1]);if(existing)card.dataset.tool=JSON.stringify(existing);results.hidden=true}else draw();
   }
 }
 function open(record){selected=record||null;sheet.hidden=false;$('#lightReference').value=record?.reference||'';$('#lightProduction').value=record?.production||'';$('#lightMachine').value=record?.line||$('.beta-light-lines .active')?.dataset.line||'B1';$('#lightStart').value='';$('#lightEnd').value='';showTools(record);sheet.scrollIntoView({behavior:'smooth',block:'start'})}
 $$('.beta-light-tabs [data-light-view]').forEach(button=>button.onclick=()=>{$$('.beta-light-tabs button').forEach(x=>x.classList.toggle('active',x===button));$$('[data-light-panel]').forEach(x=>x.classList.toggle('active',x.dataset.lightPanel===button.dataset.lightView))});
 overview.renderRail($('#lightLines'),{onSelect:(line,row)=>{if(row&&row.date){const date=new Date(`${row.date}T12:00:00`);year=date.getFullYear();month=date.getMonth();day=date.getDate();selected=records.find(item=>item.line===line&&item.reference===row.reference&&item.production===row.production)||null;renderDays();renderList()}},onOpen:(line,row)=>{const record=records.find(item=>item.line===line&&item.reference===row.reference&&item.production===row.production);if(record)open(record)}});
 $('#lightSearch').oninput=renderList;$('#lightNew').onclick=()=>open(null);$('#lightClose').onclick=()=>sheet.hidden=true;$('#lightDuplicate').onclick=()=>{const previous=records.find(r=>r.reference===$('#lightReference').value&&r!==selected);if(!previous){toast('Sem produção anterior desta referência');return}const production=$('#lightProduction').value;open(previous);$('#lightProduction').value=production;toast('Dados da produção anterior copiados; confirme antes de guardar')};$('#lightForm').onsubmit=e=>{
   e.preventDefault();if(!e.currentTarget.reportValidity())return;
   const reference=$('#lightReference').value.trim().toUpperCase(),production=$('#lightProduction').value.trim(),line=$('#lightMachine').value;
   const selections=$$('#lightTools .beta-light-tool').map(card=>[card.dataset.type,card.dataset.tool?JSON.parse(card.dataset.tool):null]);
   if(selections.some(([,tool])=>!tool)){toast('Selecione explicitamente CM, MF e BQ antes de guardar o Job On');return}
   const chosen=Object.fromEntries(selections);
   const saved=JSON.parse(sessionStorage.getItem('betaJobOnSummaries')||'[]');
   const index=saved.findIndex(item=>item.reference===reference&&item.production===production&&item.machine===line);
   const previous=index>=0?saved[index]:null;
   const id=()=>`demo-${crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)}`;
   const contexts=Object.fromEntries(selections.map(([type,tool])=>{
     const old=previous?.contexts?.[type];const same=old?.tool?.reference===tool.reference&&old?.tool?.lot===tool.lot;
     return [type,{id:same?old.id:id(),tool:{...tool}}];
   }));
   const summary={reference,production,machine:line,plannedDate:selectedDate(),process:chosen.CM.process,date:new Date().toLocaleDateString('pt-PT'),jobon:previous?.jobonId||id(),jobonId:previous?.jobonId||null,status:previous?.status||'Em preparação',contexts,tools:Object.fromEntries(selections.map(([type,tool])=>[type,`${tool.reference} · Lote ${tool.lot}`])),cm:`${chosen.CM.reference} · Lote ${chosen.CM.lot}`,mf:`${chosen.MF.reference} · Lote ${chosen.MF.lot}`,bq:`${chosen.BQ.reference} · Lote ${chosen.BQ.lot}`,weightStatus:previous?.weightStatus||'Em falta',gluingStatus:previous?.gluingStatus||'Em falta',observation:previous?.observation||'Resumo criado pelo Job On. Complete os controlos em falta.'};
   summary.jobonId=summary.jobon;
   if(previous?.tamponGeometry)summary.tamponGeometry=previous.tamponGeometry;
   if(index>=0)saved[index]=summary;else saved.unshift(summary);
   sessionStorage.setItem('betaJobOnSummaries',JSON.stringify(saved));
   const activeOnLine=overview.records().filter(item=>item.line===line&&item.reference!==reference).sort((a,b)=>b.date.localeCompare(a.date))[0];
   if(activeOnLine){const event={jobonId:summary.jobonId,bqId:contexts.BQ.id,toolId:chosen.BQ.toolId,reference,production,line,changedAt:new Date().toISOString()};try{const events=JSON.parse(sessionStorage.getItem('betaBqProductionChanges')||'[]');sessionStorage.setItem('betaBqProductionChanges',JSON.stringify([event,...events].slice(0,30)))}catch{}}
   location.href=`resumo.html?ref=${encodeURIComponent(reference)}&production=${encodeURIComponent(production)}`;
 };
 const draft=sessionStorage.getItem('lightJobDraft');if(new URLSearchParams(location.search).has('toolCreated')&&draft){try{const data=JSON.parse(draft);open(null);$('#lightReference').value=data.reference;$('#lightProduction').value=data.production;$('#lightMachine').value=data.line;$('#lightStart').value=data.start;$('#lightEnd').value=data.end;for(const [type,raw] of Object.entries(data.tools||{})){const card=$(`#lightTools .beta-light-tool[data-type=\"${type}\"]`);if(card&&raw){const tool=JSON.parse(raw);card.dataset.tool=raw;card.querySelector('input').value=tool.reference;card.querySelector('.beta-light-tool-result').hidden=true}}const created=JSON.parse(sessionStorage.getItem('createdTool')||'null');if(created){const card=$(`#lightTools .beta-light-tool[data-type=\"${created.type}\"]`);if(card){card.dataset.tool=JSON.stringify(created);card.querySelector('input').value=created.reference;card.querySelector('.beta-light-tool-result').hidden=true;card.querySelector('a').hidden=true}sessionStorage.removeItem('createdTool')}}catch(e){}sessionStorage.removeItem('lightJobDraft')}
 const params=new URLSearchParams(location.search);const requested=params.get('view');if(requested==='history')$('.beta-light-tabs [data-light-view="history"]').click();renderDays();renderList();renderDetachedHistory();const linked=records.find(item=>item.reference===params.get('reference')&&(!params.get('production')||item.production===params.get('production')));if(linked){if(linked.date){const date=new Date(`${linked.date}T12:00:00`);year=date.getFullYear();month=date.getMonth();day=date.getDate()}renderDays();renderList();open(linked)}else if(requested==='sheet')open(records[0]);
})();
