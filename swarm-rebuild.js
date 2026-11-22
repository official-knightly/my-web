(() => {
  if (window.__knightlySwarmLoaded) return;
  window.__knightlySwarmLoaded = true;

  const COLORS = ['#7dc9ff','#f3a6ce','#a9e6b0','#ffd27c','#b7a5ff','#73dfd5','#ff9e83','#9caeff'];
  const style = document.createElement('style');
  style.textContent = `
    #knightly-swarm-layer{position:fixed;inset:0;z-index:49;pointer-events:none;overflow:hidden;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(5,1fr);isolation:isolate}
    #knightly-swarm-layer .swarm-tile{position:relative;background:rgba(5,7,11,.91);border:1px solid rgba(255,255,255,.075);backdrop-filter:blur(5px);opacity:1;transform:scale(1);transition:opacity .48s ease,transform .55s cubic-bezier(.2,.8,.2,1)}
    #knightly-swarm-layer .swarm-tile.cleared{opacity:0;transform:scale(.82)}
    #knightly-swarm-layer .swarm-cursor{position:absolute;left:0;top:0;z-index:5;will-change:transform;transition:transform .42s cubic-bezier(.2,.8,.2,1);filter:drop-shadow(0 2px 5px #000b)}
    #knightly-swarm-layer .swarm-cursor svg{width:20px;height:25px;display:block}
    #knightly-swarm-layer .swarm-cursor label{position:absolute;left:15px;top:15px;padding:3px 6px;border-radius:3px;background:var(--agent-color);color:#10131a;font:8px monospace;white-space:nowrap}
    #knightly-swarm-layer .swarm-tile:after{content:"";position:absolute;inset:0;border:1px solid color-mix(in srgb,var(--tile-color) 35%,transparent);opacity:.45}
    @media(prefers-reduced-motion:reduce){#knightly-swarm-layer .swarm-tile,#knightly-swarm-layer .swarm-cursor{transition-duration:.01ms}}
  `;
  document.head.appendChild(style);

  const layer = document.createElement('div');
  layer.id = 'knightly-swarm-layer';
  layer.setAttribute('aria-hidden','true');
  document.body.appendChild(layer);

  const tiles = [];
  for (let i=0;i<40;i++) {
    const tile=document.createElement('div');
    tile.className='swarm-tile';
    tile.style.setProperty('--tile-color',COLORS[i%8]);
    layer.appendChild(tile);
    tiles.push(tile);
  }

  const cursorSvg='<svg viewBox="0 0 20 25" fill="none"><path d="M1 1L1 19L6 14L10 23L14 21L10 12L18 12Z" fill="var(--agent-color)" stroke="#10131a" stroke-width="1.3"/></svg>';
  const agents=[];
  for(let i=0;i<8;i++){
    const node=document.createElement('div');
    node.className='swarm-cursor';
    node.style.setProperty('--agent-color',COLORS[i]);
    node.innerHTML=cursorSvg+'<label>agent-'+String(i+1).padStart(2,'0')+'</label>';
    layer.appendChild(node);
    agents.push(node);
  }

  let direction=1,lastScroll=window.scrollY,runId=0,scrollTimer=0,cycleTimer=0,active=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function place(node,x,y){
    node.style.transform='translate3d('+Math.max(0,Math.min(innerWidth-20,x))+'px,'+Math.max(0,Math.min(innerHeight-25,y))+'px,0)';
  }
  function orderTiles(dir){
    const order=[];
    for(let row=0;row<5;row++){
      for(let col=0;col<8;col++) order.push(dir>0?row*8+col:(4-row)*8+(7-col));
    }
    return order;
  }
  function rebuild(dir){
    const id=++runId;
    clearTimeout(cycleTimer);
    active=true;
    layer.style.display='grid';
    tiles.forEach(tile=>{tile.classList.remove('cleared');tile.style.display='block'});
    const order=orderTiles(dir);
    const lanes=Array.from({length:8},()=>[]);
    order.forEach((tileIndex,index)=>lanes[index%8].push(tileIndex));
    agents.forEach((agent,i)=>place(agent,(i+.5)*innerWidth/8,dir>0?innerHeight-34:8));
    const delay=reduced?20:390;
    lanes.forEach((lane,agentIndex)=>{
      lane.forEach((tileIndex,step)=>{
        setTimeout(()=>{
          if(id!==runId)return;
          const row=Math.floor(tileIndex/8),col=tileIndex%8;
          place(agents[agentIndex],(col+.5)*innerWidth/8,(row+.5)*innerHeight/5);
          tiles[tileIndex].classList.add('cleared');
          if(step===lane.length-1){
            setTimeout(()=>{
              if(id!==runId)return;
              agents[agentIndex].style.opacity='0';
            },reduced?10:500);
          }
        },step*delay+agentIndex*45);
      });
    });
    const finish=lanes[0].length*delay+900;
    cycleTimer=setTimeout(()=>{
      if(id!==runId)return;
      agents.forEach(agent=>agent.style.opacity='1');
      layer.style.display='none';
      active=false;
    },reduced?200:finish);
  }
  function onScroll(){
    const y=window.scrollY,delta=y-lastScroll;
    if(Math.abs(delta)>1){
      direction=delta>0?1:-1;
      lastScroll=y;
      clearTimeout(scrollTimer);
      scrollTimer=setTimeout(()=>rebuild(direction),reduced?20:260);
    }
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',()=>{if(active)rebuild(direction)},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastScroll=window.scrollY;rebuild(direction)}});
  // Initial page entrance is a real tile-by-tile reveal, not cursor decoration.
  rebuild(1);
})();