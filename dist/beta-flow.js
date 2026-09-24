/* Temporary cross-page production flow for the browser session. */
(() => {
  const page=document.body.dataset.betaPage;
  const params=new URLSearchParams(location.search);
  const ref=params.get('ref'),production=params.get('production');
  const key='betaJobOnSummaries';
  const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'[]')}catch(_){return []}};
  const update=(reference,period,values)=>{const items=read();const item=items.find(row=>row.reference===reference&&row.production===period);if(item){Object.assign(item,values);sessionStorage.setItem(key,JSON.stringify(items))}};
  const summaryUrl=(reference,period)=>`resumo.html?ref=${encodeURIComponent(reference)}&production=${encodeURIComponent(period)}`;
  const context=read().find(item=>item.reference===ref&&item.production===production);
  if(page==='controlo-create'){
    // A referência e o primeiro lote são identidades escolhidas no Job On.
    ['#createRefFromNew','#editActiveRef','#newRef','#refEditor'].forEach(selector=>document.querySelector(selector)?.remove());
    const heading=document.querySelector('#refs .section-head h3');
    if(heading?.textContent.includes('referência'))heading.textContent='Controlos da produção';
    if(!context){
      const banner=document.createElement('div');banner.className='beta-flow-context dmo-card';
      banner.innerHTML='<strong>Selecione uma produção no Resumo</strong><span>O Job On fornece a referência, a produção, a linha e o CM. Depois introduza apenas as medições do Peso.</span><a class="dmo-button ghost" href="resumo.html">Ver resumos</a>';
      document.querySelector('#new')?.prepend(banner);
      document.querySelector('#new .stack')?.setAttribute('hidden','');
    }
  }
  if(page==='controlo-create'&&context){
    const cm=context.contexts?.CM?.tool;
    const main=document.querySelector('#new');
    const banner=document.createElement('div');banner.className='beta-flow-context dmo-card';
    banner.innerHTML='<strong></strong><span></span><a class="dmo-button ghost">Voltar ao Resumo</a>';
    banner.querySelector('strong').textContent=`Peso · ${ref} / ${production}`;
    banner.querySelector('span').textContent=`Job On ${context.jobonId||context.jobon} · CM ${cm?.reference||'por selecionar'} · Lote ${cm?.lot||'—'} · ${cm?.process||'—'}`;
    banner.querySelector('a').href=summaryUrl(ref,production);
    main.prepend(banner);
    const referenceCard=main.querySelector('.stack > .dmo-card:first-child');
    if(referenceCard)referenceCard.hidden=true;
    const referenceFields=main.querySelectorAll('.reference-summary .summary-item strong');
    [context.reference,cm?.reference||'—',cm?.lot||'—',context.contexts?.BQ?.tool?.reference||'—',cm?.process||'—',context.machine].forEach((value,i)=>{if(referenceFields[i])referenceFields[i].textContent=value});
    const contextFields=main.querySelectorAll('.comparison-context > div strong');
    [context.jobonId||context.jobon,context.production,cm?.reference||'—',cm?.lot||'—',cm?.process||'—',context.machine].forEach((value,i)=>{if(contextFields[i])contextFields[i].textContent=value});
    const contextHint=main.querySelector('.comparison-context + .hint');if(contextHint)contextHint.textContent='Referência, produção, máquina, CM, lote e processo foram recebidos do contexto do Job On. Nesta folha introduzem-se apenas as medições.';
    const send=document.querySelector('#sendApproval');
    send?.addEventListener('click',()=>{if(send.disabled)return;update(ref,production,{weightStatus:'A aguardar aprovação'});location.href=summaryUrl(ref,production)});
    const actions=main.querySelector('.page-head');
    const save=document.createElement('button');save.type='button';save.className='dmo-button';save.textContent='Guardar Peso na sessão';
    save.onclick=()=>{const readings=[...document.querySelectorAll('#readings .reading')];if(!readings.some(row=>row.dataset.glassWeight&&Number.isFinite(Number(row.dataset.glassWeight)))){alert('Preencha pelo menos uma leitura de Peso antes de guardar.');return}update(ref,production,{weightStatus:'Em preparação'});location.href=summaryUrl(ref,production)};
    actions?.append(save);
  }
  if(page==='pegamentos'){
    const select=document.querySelector('#ctx-jobon');
    select.replaceChildren(new Option('Selecionar produção',''));
    read().forEach(item=>{
      const id=item.jobonId||item.jobon;
      if(!id)return;
      const tool=type=>{const selected=item.contexts?.[type]?.tool;return {ref:selected?.reference||'',lote:selected?.lot||''}};
      JOB_ON_CONTEXTS[id]={reference:item.reference,production:item.production,machine:item.machine,subfolder:item.reference,comp:{cm:tool('CM'),boq:tool('BQ'),mf:tool('MF')}};
      select.add(new Option(`${item.reference} · ${item.production} · ${item.machine}`,id));
    });
    document.querySelector('#contextCard h2').textContent='Selecionar produção';
    document.querySelector('label[for="ctx-jobon"]').textContent='Produção do Job On';
    document.querySelector('#noRecordCard').textContent='Selecione uma produção para abrir a folha de Pegamentos. Os dados são preenchidos automaticamente.';
    if(!context)return;
    const id=context.jobonId||context.jobon;
    select.value=id;
    applyJobOnContext();
    startPegamentosSheet();
    const main=document.querySelector('#registo');const banner=document.createElement('div');banner.className='beta-flow-context card';banner.innerHTML='<strong></strong><span></span><a class="btn">Voltar ao Resumo</a>';banner.querySelector('strong').textContent=`Pegamentos · ${ref} / ${production}`;banner.querySelector('span').textContent=`Ferramentas do Job On ${context.jobon}`;banner.querySelector('a').href=summaryUrl(ref,production);main.prepend(banner);
    const action=document.createElement('button');action.type='button';action.className='btn';action.textContent='Guardar Pegamentos na sessão';action.onclick=()=>{if(!getActive()?.jobOnId){startPegamentosSheet()}if(!getActive()?.jobOnId)return;update(ref,production,{gluingStatus:'Em preparação'});location.href=summaryUrl(ref,production)};main.querySelector('#saveStatus')?.parentElement?.append(action);
  }
  if(page==='controlo-approve'){
    const pending=read().filter(item=>item.weightStatus==='A aguardar aprovação');
    const list=document.querySelector('#approvalList');
    pending.forEach(item=>{const row=document.createElement('article');row.className='queue-item';row.tabIndex=0;row.innerHTML='<strong></strong><small></small><span class="dmo-pill pending">Pendente</span>';row.querySelector('strong').textContent=`${item.reference} · ${item.production}`;row.querySelector('small').textContent=`${item.machine} · Peso enviado pelo Operador`;row.onclick=()=>{list.querySelectorAll('.queue-item').forEach(el=>el.classList.toggle('selected',el===row));document.querySelector('#controlDetail .detail-head h3').textContent=item.reference;document.querySelector('#controlDetail .detail-head p').textContent=`Produção ${item.production} · Linha ${item.machine}`;document.querySelector('#controlDetail').classList.remove('hidden');document.querySelector('#comparisonDetail')?.classList.add('hidden');window.betaSelectedApproval=item};row.ondblclick=()=>location.href=summaryUrl(item.reference,item.production)+'&mode=approve';list.prepend(row)});
    const approve=document.querySelector('#approve'),reject=document.querySelector('#reject');
    approve?.addEventListener('click',()=>{const item=window.betaSelectedApproval;if(item){update(item.reference,item.production,{status:'Aprovado',weightStatus:'Aprovado'});location.href=summaryUrl(item.reference,item.production)+'&mode=approve'}});
    reject?.addEventListener('click',()=>{const item=window.betaSelectedApproval;if(item){update(item.reference,item.production,{status:'Não aprovado',weightStatus:'Não aprovado'});location.href=summaryUrl(item.reference,item.production)+'&mode=approve'}});
  }
})();
