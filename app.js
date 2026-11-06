'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const RAD = Math.PI / 180, HOME = {latitude:60.1699*RAD,longitude:24.9384*RAD,height:.025};
  const GROUPS = {stations:'Avaruusasema',weather:'Sääsatelliitti',resource:'Maanhavainnointi',science:'Tiedesatelliitti',navigation:'Navigointisatelliitti',starlink:'Starlink',active:'Muu aktiivinen satelliitti'};
  const COLORS = {stations:'#ffce63',weather:'#59edbf',resource:'#59edbf',science:'#70baff',navigation:'#70baff',starlink:'#91a8c5',active:'#c79dea'};
  const fmt = new Intl.NumberFormat('fi-FI',{maximumFractionDigits:0});
  const hhmm = d => new Intl.DateTimeFormat('fi-FI',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Helsinki'}).format(d);
  const TRACK_COLORS=['#59edbf','#ffce63','#d5a3ff'];
  let map, canvas, ctx, data, sats=[], points=[], allPoints=[], selected=null, filter='all', world=false, auto=true, track=null;
  let tracked=[], searchSignature='', detailSignature='';
  const viewParams=new URLSearchParams(location.search), savedView=(viewParams.get('view')||'').split(',').map(Number);
  const hasSavedView=savedView.length===3&&savedView.every(Number.isFinite)&&Math.abs(savedView[0])<=85&&Math.abs(savedView[1])<=180&&savedView[2]>=-2&&savedView[2]<=8;
  let viewMode=hasSavedView?'custom':'region', settingView=false, viewTimer;
  const requestedIds=[...new Set((new URLSearchParams(location.search).get('track')||'').split(',').map(Number).filter(n=>Number.isInteger(n)&&n>0))].slice(0,3);
  const isTracked=id=>tracked.some(t=>t.id===id);
  const colorFor=s=>tracked.find(t=>t.id===s.id)?.color||COLORS[s.group];
  const shownSatellites=()=>tracked.length?tracked.map(t=>sats.find(s=>s.id===t.id)).filter(Boolean):(selected?[selected]:[]);
  let lastAuto=Date.now(), lastTrail=0, lastPass=0, lastRows=0, refreshing=false, tileErrors=0;
  let pass=null, generation=0, lastError='', painted=[];
  const dist=(a,b,c,d)=>{const x=Math.sin((c-a)*RAD/2)**2+Math.cos(a*RAD)*Math.cos(c*RAD)*Math.sin((d-b)*RAD/2)**2;return 6371*2*Math.asin(Math.min(1,Math.sqrt(x)));};
  const ageHours = (s, now=Date.now()) => Math.abs(now-s.epoch)/3600000;
  function clock(){const d=new Date();$('clock').textContent=new Intl.DateTimeFormat('fi-FI',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Helsinki'}).format(d);$('date').textContent=new Intl.DateTimeFormat('fi-FI',{day:'numeric',month:'numeric',year:'numeric',timeZone:'Europe/Helsinki'}).format(d)+' · HELSINKI';}
  function status(text,kind=''){ $('data-status').textContent=text;$('data-status').className=kind; }
  function position(s,when){
    if(ageHours(s,when.getTime())>168)return null;
    try{
      const pv=satellite.propagate(s.rec,when);if(!pv?.position||!pv?.velocity||s.rec.error)return null;
      const gmst=satellite.gstime(when), geo=satellite.eciToGeodetic(pv.position,gmst);
      const lat=geo.latitude/RAD,lon=geo.longitude/RAD;
      if(!Number.isFinite(lat)||!Number.isFinite(lon)||!Number.isFinite(geo.height)||geo.height<80)return null;
      const ecf=satellite.eciToEcf(pv.position,gmst),look=satellite.ecfToLookAngles(HOME,ecf);
      return {s,lat,lon,height:geo.height,speed:Math.hypot(pv.velocity.x,pv.velocity.y,pv.velocity.z)*3600,elevation:look.elevation/RAD,distance:dist(lat,lon,60.1699,24.9384)};
    }catch(e){return null;}
  }
  function saveSelection(){try{const url=new URL(location.href);if(tracked.length)url.searchParams.set('track',tracked.map(t=>t.id).join(','));else url.searchParams.delete('track');history.replaceState(null,'',url);}catch(e){/* Some embedded previews do not permit address changes. */}}
  function saveMapView(){clearTimeout(viewTimer);viewTimer=setTimeout(()=>{try{const url=new URL(location.href),c=map.getCenter();url.searchParams.set('view',[c.lat.toFixed(4),c.wrap().lng.toFixed(4),map.getZoom()].join(','));history.replaceState(null,'',url);}catch(e){}},180);}
  function applyMapView(mode){
    settingView=true;viewMode=mode;world=mode==='world';
    const size=map.getSize(),padding=Math.min(35,size.x*.06,size.y*.06);
    if(mode==='world')map.fitBounds([[-75,-180],[80,180]],{padding:[padding,padding],animate:false});
    else if(mode==='region')map.fitBounds([[45,-12],[72,55]],{padding:[padding,padding],maxZoom:3,animate:false});
    else if(mode==='tracked'){
      const locations=allPoints.filter(p=>isTracked(p.s.id)).map(p=>[p.lat,p.lon]);
      if(locations.length===1)map.setView(locations[0],2.5,{animate:false});
      else if(locations.length)map.fitBounds(locations,{padding:[padding+15,padding+25],maxZoom:3,animate:false});
    }
    $('map-title').textContent=mode==='world'?'MAAILMANKARTTA':mode==='tracked'?'VALITUT SATELLIITIT':'POHJOIS-EUROOPPA';
    settingView=false;saveMapView();draw();
  }
  function fitTracked(){if(allPoints.some(p=>isTracked(p.s.id)))applyMapView('tracked');}
  function changeTracking(){lastTrail=0;detailSignature='';searchSignature='';auto=tracked.length===0;lastAuto=Date.now();selected=tracked.length?sats.find(s=>s.id===tracked[0].id):null;saveSelection();updateAuto();renderTracking();tick();}
  function addTracked(s,fit=true){if(isTracked(s.id)){if(fit)fitTracked();return;}if(tracked.length>=3){$('search-message').textContent='Kolme kohdetta on jo valittu. Poista ensin yksi valinta.';return;}const color=TRACK_COLORS.find(c=>!tracked.some(t=>t.color===c));tracked.push({id:s.id,color});changeTracking();if(fit)fitTracked();}
  function removeTracked(id){tracked=tracked.filter(t=>t.id!==id);changeTracking();}
  function select(s,manual=false){if(manual){addTracked(s);return;}selected=s;lastTrail=0;renderDetail();draw();}
  function updateAuto(){$('auto').classList.toggle('on',auto);$('auto').textContent=(auto?'●':'○')+' Automaattinen vaihto';}
  function updateTrail(now){
    if(track){map.removeLayer(track);track=null;}lastTrail=now.getTime();const layers=[];
    for(const s of shownSatellites()){
      const segments=[];let segment=[],previous=null;
      for(let m=-30;m<=90;m+=1){const p=position(s,new Date(now.getTime()+m*60000));if(!p){if(segment.length>1)segments.push(segment);segment=[];previous=null;continue;}if(previous&&Math.abs(p.lon-previous.lon)>180){if(segment.length>1)segments.push(segment);segment=[];}segment.push([p.lat,p.lon]);previous=p;}
      if(segment.length>1)segments.push(segment);
      if(segments.length)layers.push(L.polyline(segments,{color:colorFor(s),opacity:.75,weight:tracked.length?2.3:1.8,dashArray:'5 7',interactive:false,renderer:L.canvas()}));
    }
    track=L.layerGroup(layers).addTo(map);
  }
  function renderDetail(){
    if(tracked.length){renderTrackedDetails();return;}
    const p=points.find(p=>p.s.id===selected?.id);
    if(!p){$('selected-name').textContent=sats.length?'Ei tuoretta ratatietoa':'Ratatietoja ei saatavilla';$('selected-group').textContent='';for(const id of ['height','speed','period','coordinates','orbit-age'])$(id).textContent='—';return;}
    const s=p.s;$('selected-name').textContent=s.name;$('selected-name').title=s.name+' · NORAD '+s.id;
    $('selected-group').textContent=GROUPS[s.group];$('height').textContent=fmt.format(p.height);$('speed').textContent=fmt.format(p.speed);$('period').textContent=fmt.format(1440/s.omm.MEAN_MOTION);
    $('coordinates').textContent=`${Math.abs(p.lat).toFixed(1)}° ${p.lat>=0?'N':'S'} / ${Math.abs(p.lon).toFixed(1)}° ${p.lon>=0?'E':'W'} · NORAD ${s.id}`;
    const a=ageHours(s);$('orbit-age').textContent='Ratatiedon ikä '+fmt.format(a)+' h';$('orbit-age').className=a>48?'warning':'';
  }
  function renderTrackedDetails(){
    const signature=tracked.map(t=>t.id).join(',');
    if(signature!==detailSignature){
      detailSignature=signature;$('tracked-details').replaceChildren();
      for(const t of tracked){const s=sats.find(s=>s.id===t.id),card=document.createElement('article');card.className='tracked-card';card.dataset.id=String(t.id);card.style.borderLeftColor=t.color;
        const heading=document.createElement('div');heading.className='tracked-heading';const name=document.createElement('strong');name.textContent=s?.name||'NORAD '+t.id;name.style.color=t.color;
        const group=document.createElement('span');group.textContent=s?GROUPS[s.group]:'';const remove=document.createElement('button');remove.type='button';remove.className='remove-track';remove.textContent='×';remove.setAttribute('aria-label','Poista seurannasta '+name.textContent);remove.onclick=()=>removeTracked(t.id);heading.append(name,group,remove);
        const measurements=document.createElement('div');measurements.className='tracked-measurements';
        for(const [field,label] of [['height','KORKEUS · KM'],['speed','NOPEUS · KM/H'],['period','KIERROS · MIN']]){const cell=document.createElement('div'),value=document.createElement('strong'),caption=document.createElement('span');value.dataset.field=field;caption.textContent=label;cell.append(value,caption);measurements.append(cell);}
        const note=document.createElement('p');note.className='tracked-note';card.append(heading,measurements,note);$('tracked-details').append(card);
      }
    }
    for(const card of $('tracked-details').children){const id=Number(card.dataset.id),s=sats.find(s=>s.id===id),p=allPoints.find(p=>p.s.id===id);for(const field of ['height','speed','period'])card.querySelector('[data-field="'+field+'"]').textContent=p?fmt.format(field==='period'?1440/s.omm.MEAN_MOTION:p[field]):'—';const note=card.querySelector('.tracked-note');note.textContent=p?`NORAD ${id} · ${Math.abs(p.lat).toFixed(1)}° ${p.lat>=0?'N':'S'} / ${Math.abs(p.lon).toFixed(1)}° ${p.lon>=0?'E':'W'} · Ratatiedon ikä ${fmt.format(ageHours(s))} h`:'NORAD '+id+' · Ei käyttökelpoista ajantasaista ratatietoa';note.classList.toggle('warning',!p||ageHours(s)>48);}
  }
  function renderTracking(){
    $('tracking-count').textContent=tracked.length+' / 3 valittu';$('detail-label').textContent=tracked.length?'VALITUT KOHTEET · '+tracked.length+' / 3':'SEURATTAVA KOHDE';$('single-detail').hidden=!!tracked.length;$('tracked-details').hidden=!tracked.length;document.body.classList.toggle('multi-tracking',tracked.length>=2);
    $('clear-tracked').disabled=!tracked.length;$('fit-tracked').disabled=!tracked.length;
    const legend=document.querySelector('.map-bottom');legend.replaceChildren();const items=tracked.length?tracked.map(t=>({color:t.color,label:sats.find(s=>s.id===t.id)?.name||'NORAD '+t.id})):[{color:COLORS.stations,label:'Avaruusasemat'},{color:COLORS.weather,label:'Sää / maanhavainnointi'},{color:COLORS.science,label:'Tiede / navigointi'}];
    if(!tracked.length)items.push({color:COLORS.starlink,label:'Starlink'},{color:COLORS.active,label:'Muut aktiiviset'});
    for(const item of items){const span=document.createElement('span'),key=document.createElement('b');key.className='key';key.style.background=item.color;span.append(key,document.createTextNode(item.label));legend.append(span);}
    renderSearch();
  }
  function renderSearch(){
    if(!$('search-panel').open)return;
    const query=$('sat-search').value.trim().toLocaleLowerCase('fi-FI'),signature=query+'|'+tracked.map(t=>t.id).join(',')+'|'+generation;if(searchSignature===signature)return;searchSignature=signature;
    const normalizeSearch=text=>text.toLocaleLowerCase('fi-FI').replace(/iceye[\s-]*x(?=\s*\d)/g,'iceye').replace(/[^\p{L}\p{N}]/gu,'');
    const terms=query.replace(/iceye[\s-]*x(?=\s*\d)/g,'iceye').split(/\s+/).map(normalizeSearch).filter(Boolean);
    const matches=sats.filter(s=>{const text=normalizeSearch(s.name+' '+s.id+' '+(s.id===48274?'Tiangong Tianhe Kiinan avaruusasema':'')+' '+(s.id===25544?'kansainvälinen avaruusasema':''));return terms.every(term=>text.includes(term));}).sort((a,b)=>Number(isTracked(b.id))-Number(isTracked(a.id))||a.name.localeCompare(b.name));
    const list=$('search-results');list.replaceChildren();
    $('search-message').textContent=matches.length?`${matches.length} osumaa${matches.length>40?' · Näytetään ensimmäiset 40, tarkenna hakua':''}. Valitse enintään kolme.`:'Ei osumia ladatussa satelliittivalikoimassa.';
    for(const s of matches.slice(0,40)){const b=document.createElement('button');b.type='button';b.className='search-result';b.dataset.id=String(s.id);const chosen=isTracked(s.id);b.setAttribute('aria-pressed',String(chosen));b.disabled=!chosen&&(tracked.length>=3||ageHours(s)>168);
      const marker=document.createElement('span');marker.className='search-check';marker.textContent=chosen?'✓':'+';if(chosen)marker.style.color=colorFor(s);
      const info=document.createElement('span'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=s.name;meta.textContent='NORAD '+s.id+' · '+GROUPS[s.group]+(ageHours(s)>168?' · vanhentunut rata':'');info.append(name,meta);b.append(marker,info);b.onclick=()=>chosen?removeTracked(s.id):addTracked(s);list.append(b);}
  }
  function renderRows(now){
    if(now-lastRows<5000)return;lastRows=now;
    const near=[...points].sort((a,b)=>a.distance-b.distance).slice(0,3), target=$('near-list');target.replaceChildren();
    if(!near.length){const p=document.createElement('p');p.className='empty';p.textContent='Ei laskettavia kohteita tässä ryhmässä.';target.append(p);return;}
    for(const p of near){const b=document.createElement('button');b.className='near-row';b.type='button';b.title='Seuraa: '+p.s.name;
      const key=document.createElement('b');key.className='key';key.style.background=COLORS[p.s.group];const name=document.createElement('span');name.className='name';name.textContent=p.s.name;
      const distance=document.createElement('span');distance.className='distance';distance.textContent=fmt.format(p.distance)+' km';b.append(key,name,distance);b.onclick=()=>select(p.s,true);target.append(b);}
  }
  function draw(){
    if(!map||!ctx)return;const size=map.getSize(),dpr=Math.min(2,window.devicePixelRatio||1);
    if(canvas.width!==Math.round(size.x*dpr)||canvas.height!==Math.round(size.y*dpr)){canvas.width=Math.round(size.x*dpr);canvas.height=Math.round(size.y*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size.x,size.y);painted=[];
    const displayPoints=allPoints.filter(p=>filter==='all'||p.s.group===filter||isTracked(p.s.id));
    const visible=displayPoints.map(p=>({...p,xy:map.latLngToContainerPoint([p.lat,p.lon])})).filter(p=>p.xy.x>-15&&p.xy.x<size.x+15&&p.xy.y>-15&&p.xy.y<size.y+15);
    const labelIds=new Set([...visible].sort((a,b)=>(a.s.id===selected?.id?-1:b.s.id===selected?.id?1:a.distance-b.distance)).slice(0,world?7:9).map(p=>p.s.id));
    const scale=Math.max(.65,Math.min(1.6,size.x/850)),labels=[];
    for(const p of visible.sort((a,b)=>(a.s.id===selected?.id?1:b.s.id===selected?.id?-1:0))){
      const {x,y}=p.xy,isSelected=isTracked(p.s.id)||(!tracked.length&&p.s.id===selected?.id),color=colorFor(p.s),r=(isSelected?5:3)*scale;
      if(visible.length>700&&!isSelected&&!labelIds.has(p.s.id)){painted.push({x,y,s:p.s});ctx.fillStyle=color;ctx.fillRect(x-1.3*scale,y-1.3*scale,2.6*scale,2.6*scale);continue;}
      painted.push({x,y,s:p.s});ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.strokeStyle=color;
      if(isSelected){ctx.beginPath();ctx.arc(0,0,13*scale,0,Math.PI*2);ctx.fillStyle=color+'24';ctx.fill();ctx.strokeStyle=color+'99';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=color;}
      ctx.rotate(-Math.PI/5);ctx.fillRect(-r*.6,-r,r*1.2,r*2);ctx.fillRect(-r*2.6,-r*.85,r*1.3,r*1.7);ctx.fillRect(r*1.3,-r*.85,r*1.3,r*1.7);ctx.beginPath();ctx.moveTo(-r*2,0);ctx.lineTo(r*2,0);ctx.lineWidth=.8;ctx.stroke();ctx.restore();
      if(labelIds.has(p.s.id)||isSelected){
        const text=p.s.name,font=(isSelected?15:12)*scale;ctx.font=`${isSelected?'700':'600'} ${font}px Arial`;
        const w=ctx.measureText(text).width,tx=Math.max(4,Math.min(size.x-w-8,x+15*scale)),ty=Math.max(20,Math.min(size.y-30,y-8*scale));
        if(!isSelected&&labels.some(l=>Math.abs(l.y-ty)<font+4&&tx<l.x+l.w+4&&tx+w>l.x-4))continue;
        labels.push({x:tx,y:ty,w});ctx.lineWidth=4;ctx.strokeStyle='#07151df0';ctx.strokeText(text,tx,ty);ctx.fillStyle=isSelected?color:'#e4eff3';ctx.fillText(text,tx,ty);
      }
    }
  }
  function renderStatus(){
    if(!data)return;const now=Date.now(),hours=(now-Date.parse(data.generatedAt))/3600000;
    const stale=sats.filter(s=>ageHours(s)>48).length,excluded=sats.filter(s=>ageHours(s)>168).length;
    const text='Ratatiedot haettu '+new Intl.DateTimeFormat('fi-FI',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Helsinki'}).format(new Date(data.generatedAt));
    if(lastError)status(lastError+' · Käytössä edellinen aineisto.','warning');
    else if(hours>8)status('PÄIVITYS VIIVÄSTYNYT · '+text,'warning');
    else status(text+' · '+sats.length+' kohdetta',stale?'warning':'');
    $('data-note').textContent=`CelesTrak · SGP4-ratalaskenta · Ei paikannustelemetriaa. ${stale?'Yli 48 h vanhoja ratoja: '+stale+'. ':''}${excluded?'Yli 7 vrk vanhat '+excluded+' kohdetta piilotettu. ':''}${data.groups?.includes('active')?'Aktiivisten satelliittien luettelo, myös Starlink. Ei romua eikä salassa pidettäviä ratoja.':'Rajattu lähtöaineisto. Laajennettu aineisto odottaa päivitysajoa.'}`;
  }
  function calculatePass(){
    lastPass=Date.now();const iss=sats.find(s=>s.id===25544);pass=null;
    if(!iss||ageHours(iss)>48){$('pass-time').textContent='Ei tuoretta tietoa';$('pass-info').textContent='ISS:n ohitusta ei arvioida yli 48 h vanhasta radasta.';return;}
    const start=Date.now();let previous=position(iss,new Date(start));
    if(previous&&previous.elevation>=10){pass={start,ongoing:true};}
    for(let t=start+30000;!pass&&t<=start+48*3600000;t+=30000){const p=position(iss,new Date(t));if(p&&p.elevation>=10&&(!previous||previous.elevation<10)){
      let lo=t-30000,hi=t;for(let j=0;j<6;j++){const mid=(lo+hi)/2,probe=position(iss,new Date(mid));if(probe&&probe.elevation>=10)hi=mid;else lo=mid;}pass={start:hi,ongoing:false};break;}previous=p;}
    if(pass){let max=0,end=pass.start;for(let t=pass.start;t<=pass.start+40*60000;t+=10000){const p=position(iss,new Date(t));if(!p||p.elevation<9.9)break;max=Math.max(max,p.elevation);end=t;}pass.max=max;pass.end=end;renderPass();}
    else{$('pass-time').textContent='Ei 48 tunnissa';$('pass-info').textContent='Ei vähintään 10°:n ohitusta Helsingissä seuraavan 48 tunnin aikana.';}
  }
  function renderPass(){if(!pass)return;const now=Date.now(),started=pass.start<=now;if(now>pass.end+10000){lastPass=0;return;}
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Helsinki'}).format(new Date(now)),day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Helsinki'}).format(new Date(pass.start));
    const dayLabel=today===day?'Tänään':new Intl.DateTimeFormat('fi-FI',{weekday:'short',day:'numeric',month:'numeric',timeZone:'Europe/Helsinki'}).format(new Date(pass.start));
    $('pass-time').textContent=started?'Juuri nyt':dayLabel+' '+hhmm(new Date(pass.start));$('pass-info').textContent=`${started?'Päättyy noin '+hhmm(new Date(pass.end)):'Alkaa noin '+fmt.format((pass.start-now)/60000)+' minuutin kuluttua'}. Suurin korkeuskulma noin ${fmt.format(pass.max)}°. Ajat: Helsinki.`;}
  function tick(){
    clock();const now=new Date();allPoints=sats.map(s=>position(s,now)).filter(Boolean);points=allPoints.filter(p=>filter==='all'||p.s.group===filter);
    $('total').textContent=fmt.format(points.length);$('nearby').textContent=fmt.format(points.filter(p=>p.distance<=1500).length);$('above').textContent=fmt.format(points.filter(p=>p.elevation>=10).length);
    if(tracked.length)selected=sats.find(s=>s.id===tracked[0].id)||null;
    else{if(!points.some(p=>p.s.id===selected?.id))selected=null;
    if(!selected&&points.length)selected=[...points].sort((a,b)=>a.distance-b.distance)[0].s;}
    if(auto&&now.getTime()-lastAuto>=25000&&points.length){const near=[...points].sort((a,b)=>a.distance-b.distance).slice(0,8);const i=near.findIndex(p=>p.s.id===selected?.id);selected=near[(i+1)%near.length].s;lastAuto=now.getTime();lastTrail=0;}
    if(now.getTime()-lastTrail>45000)updateTrail(now);
    renderDetail();renderRows(now.getTime());draw();renderStatus();renderSearch();
    if(now.getTime()-lastPass>600000)calculatePass();else renderPass();
  }
  async function loadData(){
    if(refreshing)return;refreshing=true;$('refresh').disabled=true;
    try{
      const r=await fetch('./data/orbits.json',{cache:'no-cache'});if(!r.ok)throw new Error('Ratatietotiedosto: HTTP '+r.status);
      const json=await r.json();if(!Array.isArray(json.satellites)||!json.satellites.length||!Number.isFinite(Date.parse(json.generatedAt)))throw new Error('Virheellinen ratatietotiedosto');
      const next=[];let invalid=0;
      for(const item of json.satellites){try{const omm=item.omm;if(!omm||!Number.isFinite(Number(omm.NORAD_CAT_ID))||!GROUPS[item.group])throw new Error('Ratatietue puuttuu');const epoch=Date.parse(omm.EPOCH+( /Z$|[+-]\d\d:\d\d$/.test(omm.EPOCH)?'':'Z'));if(!Number.isFinite(epoch))throw new Error('Epoch');const rec=satellite.json2satrec(omm);if(rec.error)throw new Error('SGP4 '+rec.error);next.push({id:Number(omm.NORAD_CAT_ID),name:omm.OBJECT_NAME,group:item.group,omm,rec,epoch});}catch(e){invalid++;}}
      if(!next.length)throw new Error('Ratojen laskenta ei onnistunut');data=json;sats=next;lastError=invalid?invalid+' virheellistä ratatietuetta ohitettu':'';generation++;
      if(generation===1&&requestedIds.length){for(const id of requestedIds){tracked.push({id,color:TRACK_COLORS[tracked.length]});}auto=!tracked.length;}
      lastTrail=0;lastPass=0;lastRows=0;detailSignature='';searchSignature='';updateAuto();renderTracking();tick();if(generation===1&&tracked.length&&!hasSavedView)fitTracked();
    }catch(e){console.error('Satelliittitutka:',e);lastError='Ratatietojen päivitys epäonnistui';if(!data){status(lastError+': '+e.message,'error');$('selected-name').textContent='Ratatiedot eivät latautuneet';$('near-list').textContent='Tarkista verkkoyhteys ja data/orbits.json.';$('pass-time').textContent='Ei ratatietoa';}else renderStatus();}
    finally{refreshing=false;$('refresh').disabled=false;}
  }
  function init(){
    clock();if(typeof L==='undefined'||typeof satellite==='undefined'||typeof satellite.json2satrec!=='function'){status('Kartta- tai ratalaskentakirjasto ei latautunut. Tarkista verkkoyhteys.','error');$('selected-name').textContent='Tarvittava kirjasto puuttuu';return;}
    canvas=$('satellites');ctx=canvas.getContext('2d');map=L.map('map',{center:hasSavedView?savedView.slice(0,2):[59,25],zoom:hasSavedView?savedView[2]:2,minZoom:-2,maxZoom:8,zoomSnap:.5,zoomDelta:.5,zoomAnimation:false,worldCopyJump:false,attributionControl:true});
    const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',minZoom:-2,minNativeZoom:0,maxZoom:8,noWrap:true}).addTo(map);
    tiles.on('tileerror',()=>{if(++tileErrors>=3)$('map-error').hidden=false;});tiles.on('tileload',()=>{tileErrors=0;$('map-error').hidden=true;});
    for(let lat=-60;lat<=60;lat+=30)L.polyline([[lat,-180],[lat,180]],{color:'#80b3c3',weight:.5,opacity:.18,interactive:false}).addTo(map);
    for(let lon=-180;lon<=180;lon+=30)L.polyline([[-85,lon],[85,lon]],{color:'#80b3c3',weight:.5,opacity:.18,interactive:false}).addTo(map);
    L.circle([60.1699,24.9384],{radius:1500000,color:'#59edbf',weight:1,dashArray:'4 7',opacity:.35,fillColor:'#59edbf',fillOpacity:.025,interactive:false}).addTo(map);
    L.circleMarker([60.1699,24.9384],{radius:4,color:'#f0f5f5',weight:1,fillColor:'#59edbf',fillOpacity:1}).addTo(map).bindTooltip('HELSINKI',{direction:'bottom',permanent:true,className:'home-label'});
    map.on('move zoom resize',draw);map.on('click',e=>{let best=null,range=24;for(const p of painted){const d=Math.hypot(p.x-e.containerPoint.x,p.y-e.containerPoint.y);if(d<range){best=p;range=d;}}if(best)select(best.s,true);});
    map.on('moveend zoomend',()=>{if(!settingView){viewMode='custom';world=map.getZoom()<=2;$('map-title').textContent='OMA KARTTARAJAUS';}saveMapView();});
    new ResizeObserver(()=>{const mode=viewMode;settingView=true;map.invalidateSize({animate:false,pan:false});settingView=false;if(mode!=='custom')applyMapView(mode);draw();}).observe($('map'));
    if(!hasSavedView)applyMapView('region');else $('map-title').textContent='OMA KARTTARAJAUS';
    $('region').onclick=()=>applyMapView('world');$('finland').onclick=()=>applyMapView('region');$('map-fit-tracked').onclick=fitTracked;
    $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){status('Koko näyttö ei ole tässä näkymässä sallittu. Käytä selaimen koko näytön tilaa.','warning');}};
    $('auto').onclick=()=>{if(tracked.length){tracked=[];changeTracking();}else{auto=!auto;lastAuto=Date.now();updateAuto();}};$('refresh').onclick=loadData;
    $('sat-search').oninput=()=>{searchSignature='';renderSearch();};
    $('search-panel').ontoggle=()=>{if($('search-panel').open){searchSignature='';renderSearch();$('sat-search').focus();}};
    $('sat-search').onkeydown=e=>{if(e.key==='Escape')$('search-panel').open=false;};
    $('close-search').onclick=()=>{$('search-panel').open=false;};$('clear-tracked').onclick=()=>{tracked=[];changeTracking();};$('fit-tracked').onclick=fitTracked;
    document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));selected=null;lastRows=0;lastTrail=0;tick();});
    loadData();setInterval(tick,1000);setInterval(loadData,15*60000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();loadData();}});
    window.radarDiagnostics=()=>({loaded:sats.length,calculated:points.length,selected:selected?.name,tracked:tracked.map(t=>({...t,name:sats.find(s=>s.id===t.id)?.name})),tracks:track?.getLayers().length||0,trackedVisible:painted.filter(p=>isTracked(p.s.id)).map(p=>p.s.id),auto,filter,generation,dataGeneratedAt:data?.generatedAt,pass,lastError,mapSize:map.getSize(),zoom:map.getZoom(),center:map.getCenter(),bounds:map.getBounds(),viewMode,library:typeof satellite.json2satrec});
  }
  init();
})();
