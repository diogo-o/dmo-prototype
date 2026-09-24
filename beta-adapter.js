(function(){
  const page=document.body.dataset.betaPage||'';
  const file=n=>n;
  const normalNav=[
    ['20_JOB_ON_01_VISUAL_AUTHORITY_job-on.html','Job On','jobon'],
    ['22_PESO_OPERADOR_01_VISUAL_AUTHORITY_peso-operador.html','Controlo Criar','controlo-create'],
    ['31_BOQUILHAS_01_VISUAL_AUTHORITY_boquilhas.html','Boquilhas','boquilhas']
  ];
  const supervisorNav=[
    ['20_JOB_ON_01_VISUAL_AUTHORITY_job-on.html','Job On','jobon'],
    ['23_PESO_RESPONSAVEL_01_VISUAL_AUTHORITY_peso-responsavel.html','Controlo Aprovar','controlo-approve'],
    ['31_BOQUILHAS_01_VISUAL_AUTHORITY_boquilhas.html','Boquilhas','boquilhas']
  ];
  function applyNav(){
    const nav=document.querySelector('.dmo-primary-nav,.global-nav');
    if(!nav)return;
    // Retain the legacy shell styling while showing only Beta destinations.
    nav.querySelectorAll('a').forEach(a=>{
      const href=a.getAttribute('href')||'';
      if(/(?:32_ARMAZEM|34_REPARACAO)/.test(href))a.remove();
    });
  }
  applyNav();
  const header=document.querySelector('.dmo-app-header');
  const primary=document.querySelector('.dmo-primary-nav');
  if(page==='boquilhas'&&header&&primary&&header.contains(primary))header.insertAdjacentElement('afterend',primary);
  if(primary){
    primary.querySelectorAll('a').forEach(link=>{if((link.getAttribute('href')||'').includes('JOB_ON'))link.textContent='Planeamento'});
    const chosen=window.betaDemoSession?.get()?.modules;
    const order=['jobon','controlo-criar','controlo-aprovar','boquilhas'];
    const position=href=>href.includes('JOB_ON')?'jobon':href.includes('CONTROLO')?'controlo-criar':href.includes('BOQUILHAS')?'boquilhas':'admin';
    [...primary.querySelectorAll('a')].sort((a,b)=>{const rank=x=>{const id=position(x.getAttribute('href')||'');return (chosen||order).findIndex(module=>module===id||(id==='controlo-criar'&&module==='controlo-aprovar'))};return (rank(a)<0?99:rank(a))-(rank(b)<0?99:rank(b))}).forEach(link=>primary.append(link));
  }
  if(page==='login'){
    const id=document.querySelector('#email');
    if(id){id.type='text';id.placeholder='Número de funcionário';id.previousElementSibling.textContent='Utilizador';}
    const form=document.querySelector('#loginForm');
    form?.insertAdjacentHTML('beforeend','<div class="beta-demo-accounts"><strong>Contas para testar</strong><div class="beta-demo-account-list"></div><small>Palavra-passe das três contas: <code>Demo123</code>. Os dados desta demonstração ficam apenas na sessão do navegador.</small></div>');
    const examples=form?.querySelector('.beta-demo-account-list');
    window.betaDemoSession?.accounts.forEach(account=>{const button=document.createElement('button');button.type='button';button.className='beta-demo-account';button.innerHTML=`<strong>${account.title}</strong><span>Nº ${account.number} · ${account.template}</span>`;button.onclick=()=>{id.value=account.number;document.querySelector('#password').value='Demo123';id.focus()};examples.append(button)});
    if(form)form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const value=(id?.value||'').trim();const account=window.betaDemoSession?.resolve(value);const message=document.querySelector('#formMessage');if(!account||document.querySelector('#password').value!=='Demo123'){message.textContent='Número ou palavra-passe de demonstração inválidos, ou utilizador inativo.';message.classList.add('show');return}window.betaDemoSession.set(account.number);location.href=account.home},true);
  }
  if(page==='controlo-hub'){
    document.querySelector('#openResumo')?.addEventListener('click',()=>location.href='resumo.html');
    document.querySelectorAll('.beta-control-summary .tool-control-card').forEach(card=>{
      const action=card.querySelector('.text-action');if(action)action.onclick=()=>location.href='resumo.html';
      const menu=card.querySelector('.tool-menu-trigger');if(menu)menu.onclick=()=>location.href='resumo.html';
    });
  }
  if(page==='controlo-create'){
    const tabs=document.querySelector('.tabs');
    if(tabs){tabs.insertAdjacentHTML('beforeend','<a class="beta-sub-link" href="24_PEGAMENTOS_01_VISUAL_AUTHORITY_pegamentos.html">Pegamentos</a><a class="beta-sub-link" href="resumo.html">Resumo</a>');}
    if(new URLSearchParams(location.search).get('view')==='settings')document.querySelector('.tab[data-view="settings"]')?.click();
  }
  if(page==='controlo-approve'){
    const head=document.querySelector('.page-head p');if(head)head.textContent='Controlos submetidos para decisão do responsável autorizado.';
    const tabs=document.querySelector('.tabs.dmo-secondary-nav');
    tabs?.insertAdjacentHTML('afterbegin','<a class="beta-sub-link" href="resumo.html?mode=approve">Resumo</a>');
    tabs?.insertAdjacentHTML('beforeend','<a class="beta-sub-link" href="resumo.html?mode=approve&view=history">Histórico</a>');
  }
  if(page==='pegamentos'){
    const tabs=document.querySelector('nav.tabs');
    if(tabs)tabs.insertAdjacentHTML('afterbegin','<a class="beta-sub-link" href="22_PESO_OPERADOR_01_VISUAL_AUTHORITY_peso-operador.html">Peso</a><a class="beta-sub-link active" href="24_PEGAMENTOS_01_VISUAL_AUTHORITY_pegamentos.html">Pegamentos</a><a class="beta-sub-link" href="resumo.html">Resumo</a>');
  }
  if(page==='jobon'){
    const title=document.querySelector('.sheet-reference-title');if(title)title.textContent='5447T137';
    const production=document.querySelector('#sheetProduction');if(production)production.value='202601';
    const machine=document.querySelector('#sheetMachine');if(machine)machine.value='B3';
    const productionSelect=document.querySelector('#productionSelect');
    if(productionSelect&&productionSelect.options[0]){productionSelect.options[0].value='202601';productionSelect.options[0].textContent='202601 · atual';}
    const tools={
      CM:{reference:'ST100',lot:'12',machines:'B1 · B3',process:'NNPB',quantity:'16',usage:'30%'},
      MF:{reference:'5447',lot:'08',machines:'B3',process:'NNPB',quantity:'16',usage:'22%'},
      BQ:{reference:'T173',lot:'04',machines:'B3',process:'—',quantity:'144',usage:'42%'}
    };
    Object.entries(tools).forEach(([type,facts])=>{
      const card=document.querySelector(`.tool-card[data-family="${type}"]`);
      if(!card)return;
      const fields=card.querySelector('.tool-fields');
      if(!fields)return;
      const original=fields.querySelectorAll('label');
      if(original[0]?.querySelector('input')){original[0].querySelector('span').textContent='Referência da ferramenta';original[0].querySelector('input').value=facts.reference;}
      if(original[1]){const select=original[1].querySelector('select');if(select){select.add(new Option(facts.lot,facts.lot,true,true));}}
      fields.insertAdjacentHTML('afterbegin',`<div class="beta-tool-identity"><span>Ferramenta selecionada</span><strong>${type} ${facts.reference} · Lote ${facts.lot}</strong><small>${facts.machines} · ${facts.process} · ${facts.quantity} peças · ${facts.usage} utilização</small></div>`);
    });
    const toolSection=document.querySelector('.priority-grid');
    if(toolSection)toolSection.insertAdjacentHTML('beforebegin','<div class="beta-module-note" style="margin-bottom:12px"><strong>Conjunto 5447T137 · Produção 202601 · Linha B3</strong>CM ST100 lote 12 · MF 5447 lote 08 · BQ T173 lote 04</div>');
    const pickerRows=document.querySelectorAll('#inventoryPicker table tbody tr');
    if(pickerRows[0]){pickerRows[0].children[0].innerHTML='<strong>ST100</strong>';pickerRows[0].children[1].textContent='12';}
    if(pickerRows[1]){pickerRows[1].children[0].innerHTML='<strong>ST21</strong>';pickerRows[1].children[1].textContent='07';}
  }
  if(['jobon','controlo-create','controlo-hub','pegamentos','boquilhas'].includes(page)){
    document.querySelector('.dmo-app-header__user,.user')?.insertAdjacentHTML('beforeend','<div class="beta-user-nav"><a href="12_LOGIN_01_VISUAL_AUTHORITY_login.html">Sair</a></div>');
  }
  // Novas identidades Tool e lotes são criados exclusivamente no Job On.
  if(page==='boquilhas'){
    window.betaProductionOverview?.renderRail(document.querySelector('#bqCurrentLines'),{
      onSelect:(_line,row)=>{
        if(!row){document.querySelector('#recordEmpty').textContent='Sem produção atual nesta linha.';return}
        const reference=row.bq?.split(' · ')[0]||'';
        document.querySelector('[data-view="registo"]')?.click();
        document.querySelector('#recordSearch').value=reference;
        document.querySelector('#recordEmpty').textContent=`${row.line} · ${row.reference} · ${row.production} · ${row.bq}. Selecione a boquilha para abrir o registo.`;
        document.querySelector('#recordEmpty').classList.remove('hidden');
        document.querySelector('#recordDetail').classList.add('hidden');
      },
      onOpen:(_line,row)=>location.href=`20_JOB_ON_01_VISUAL_AUTHORITY_job-on.html?reference=${encodeURIComponent(row.reference)}&production=${encodeURIComponent(row.production)}`
    });
    for(const selector of ['#newLot','#newLotBatches']){const button=document.querySelector(selector);if(button){button.textContent='Abrir Job On';button.onclick=()=>location.href='20_JOB_ON_01_VISUAL_AUTHORITY_job-on.html'}}
    document.querySelector('#inlineCreate')?.remove();
  }
  if(page==='boquilhas'){
    const lotGrid=document.querySelector('#lots');
    if(lotGrid){
      const section=lotGrid.closest('.card');section?.insertAdjacentHTML('beforeend','<div class="beta-table-actions"><span id="selectedBqLabel">Selecione uma boquilha</span><button class="btn" type="button" id="openBqCard" disabled>Abrir ficha</button></div>');
      let selectedLot=null;
      const openCard=()=>{if(!selectedLot)return;const [reference,lot]=selectedLot.querySelector('h4').textContent.split('·').map(x=>x.trim());const data=[...selectedLot.querySelectorAll('.lot-data div')];const quantity=data.find(x=>x.querySelector('span')?.textContent==='Quantidade')?.querySelector('strong')?.textContent.match(/\d+/)?.[0]||'';const line=data.find(x=>x.querySelector('span')?.textContent==='Linha')?.querySelector('strong')?.textContent||'';location.href=`tool-create.html?mode=detail&from=boquilhas&type=BQ&reference=${encodeURIComponent(reference)}&lot=${encodeURIComponent(lot)}&quantity=${encodeURIComponent(quantity)}&line=${encodeURIComponent(line)}`};
      lotGrid.querySelectorAll('.lot').forEach(lot=>{lot.tabIndex=0;lot.setAttribute('role','button');lot.onclick=()=>{selectedLot=lot;lotGrid.querySelectorAll('.lot').forEach(item=>item.classList.toggle('selected',item===lot));document.querySelector('#selectedBqLabel').textContent=lot.querySelector('h4').textContent;document.querySelector('#openBqCard').disabled=false};lot.ondblclick=()=>{lot.click();openCard()};lot.onkeydown=e=>{if(e.key==='Enter'){lot.click();openCard()}else if(e.key===' '){e.preventDefault();lot.click()}}});
      document.querySelector('#openBqCard').onclick=openCard;
    }
    const main=document.querySelector('main.main');
    if(main)main.insertAdjacentHTML('afterbegin',`<section class="beta-bq-context" aria-label="Contexto da boquilha e produção">
      <div><span>Boquilha</span><strong>T132</strong></div>
      <div><span>Referência</span><strong>5447T137</strong></div>
      <div><span>Produção</span><strong>202601</strong></div>
      <div><span>Lote</span><strong>04</strong></div>
      <div><span>Linha</span><strong>B3</strong></div>
      <div><span>Estado</span><strong>Aberto</strong></div>
    </section>`);
    const summary=[...document.querySelectorAll('.history-summary .metric')].find(x=>x.textContent.includes('Saldo de movimentos'));
    if(summary)summary.innerHTML='<span>Discrepância geral</span><strong>−5</strong><small>Gerada na entrada de 14/08/2026 · 09:16</small>';
    const incoming=[...document.querySelectorAll('.movement[data-type="in"]')][0];
    if(incoming){incoming.children[3].textContent='15';incoming.children[4].textContent='−5';incoming.children[7].textContent='14/08/2026 · 09:16';}
  }
})();
