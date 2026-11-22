(() => {
  if (window.__knightlySwarmLoaded) return;
  window.__knightlySwarmLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    #knight-swarm{position:fixed;inset:0;z-index:45;pointer-events:none;overflow:hidden;color:#f5f7ff;font:12px Inter,system-ui,sans-serif}
    #knight-swarm .stage{position:absolute;inset:0;overflow:hidden}
    #knight-swarm .fragment{position:absolute;overflow:hidden;opacity:0;border:1px solid rgba(135,177,255,.5);background:rgba(115,132,169,.15);box-shadow:0 0 18px rgba(89,139,255,.10);transform-origin:center}
    #knight-swarm .fragment.text{background:transparent;border-color:transparent;box-shadow:none;white-space:pre-wrap;text-shadow:0 1px 5px #0008}
    #knight-swarm .fragment img{width:100%;height:100%;object-fit:cover}
    #knight-swarm .cursor{position:absolute;z-index:3;left:0;top:0;pointer-events:none;filter:drop-shadow(0 2px 5px #000);will-change:transform;transition:transform 1.35s cubic-bezier(.18,.72,.25,1)}
    #knight-swarm .cursor svg{width:17px;height:21px;display:block}
    #knight-swarm .cursor label{position:absolute;left:13px;top:13px;padding:4px 7px;border-radius:3px;background:var(--agent);font:8px 'DM Mono',monospace;color:#08101d;white-space:nowrap;opacity:.9}
    #knight-swarm .guide{position:absolute;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#8abaffaa,transparent);opacity:0;transition:opacity 1s}
    @media(prefers-reduced-motion:reduce){#knight-swarm .cursor{transition:none}}
  `;
  document.head.appendChild(style);

  const root=document.createElement('div');
  root.id='knight-swarm';
  root.innerHTML='<div class="stage"></div><div class="guide"></div>';
  document.body.appendChild(root);

  const stage=root.querySelector('.stage');
  const colors=['#79c7ff','#f2a0c6','#a9e6b0','#ffd27c','#b6a4ff','#73e0d5','#ff9d83','#9caeff'];
  const pointer='<svg viewBox="0 0 18 22" fill="none"><path d="M1 1L1 17L5.5 13L9 20L12 18.5L8.5 11.5L15 11Z" fill="var(--agent)" stroke="#07101c" stroke-width="1.2"/></svg>';
  let agents=[],timers=[],cycleTimer=null,sequence=0,lastY=window.scrollY,direction=1,raf=0,jobIndex=0,cycleRunning=false;

  function clearTimers(){
    timers.forEach(clearTimeout);timers=[];
    if(cycleTimer)clearTimeout(cycleTimer);
    cycleTimer=null;
  }

  function visibleElements(){
    const selector='main h1,main h2,main h3,main p,main a,main img,main .panel,main .skill,main .rating,main .link,main .chip,main button,main section,main header,nav,footer';
    return Array.from(document.querySelectorAll(selector)).map(el=>{
      const r=el.getBoundingClientRect();
      if(r.width<5||r.height<4||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return null;
      if(el.closest('#knight-swarm'))return null;
      const c=getComputedStyle(el);
      const isText=/^(H[1-6]|P|A|BUTTON)$/.test(el.tagName)&&el.innerText.trim().length>0;
      return {el,r,c,text:isText?el.innerText.trim().slice(0,150):'',isText,isImg:el.tagName==='IMG'};
    }).filter(Boolean).slice(0,160);
  }

  function makeFragment(item){
    const r=item.r,c=item.c,f=document.createElement('div');
    f.className='fragment'+(item.isText?' text':'');
    f.style.left=Math.max(-20,r.left)+'px';
    f.style.top=Math.max(-20,r.top)+'px';
    f.style.width=Math.max(3,Math.min(r.width,innerWidth-r.left)+20)+'px';
    f.style.height=Math.max(3,Math.min(r.height,innerHeight-r.top)+20)+'px';
    if(item.isText){
      f.textContent=item.text;
      f.style.font=c.font;
      f.style.color=c.color;
      f.style.lineHeight=c.lineHeight;
      f.style.textAlign=c.textAlign;
      f.style.letterSpacing=c.letterSpacing;
    }else{
      f.style.background=c.backgroundColor&&c.backgroundColor!=='rgba(0, 0, 0, 0)'?c.backgroundColor:'rgba(107,126,165,.17)';
      f.style.borderRadius=c.borderRadius;
      if(item.isImg&&item.el.complete&&item.el.naturalWidth){
        const img=document.createElement('img');img.src=item.el.currentSrc||item.el.src;f.appendChild(img);
      }
    }
    stage.appendChild(f);
    return f;
  }

  function spawnAgents(){
    agents.forEach(a=>a.node.remove());agents=[];
    const total=Math.min(24,Math.max(12,Math.round(innerWidth/52)));
    for(let i=0;i<total;i++){
      const node=document.createElement('div');
      node.className='cursor';
      node.style.setProperty('--agent',colors[i%colors.length]);
      node.innerHTML=pointer+'<label>agent-'+String(i+1).padStart(2,'0')+'</label>';
      stage.appendChild(node);
      agents.push({node});
    }
  }

  function move(agent,x,y){
    agent.node.style.transform='translate3d('+Math.max(0,Math.min(innerWidth-15,x))+'px,'+Math.max(0,Math.min(innerHeight-18,y))+'px,0)';
  }

  function runCycle(mySequence){
    if(mySequence!==sequence)return;
    clearTimers();
    stage.innerHTML='';
    spawnAgents();
    const items=visibleElements();
    const jobs=items.map(item=>({item,fragment:makeFragment(item)}));
    if(!jobs.length){
      cycleTimer=setTimeout(()=>runCycle(mySequence),1800);
      return;
    }
    jobIndex=0;
    agents.forEach((a,i)=>move(a,innerWidth*(.08+Math.random()*.84),innerHeight*(.08+Math.random()*.84)));

    jobs.forEach((job,i)=>{
      const delay=i*680;
      const timer=setTimeout(()=>{
        if(mySequence!==sequence)return;
        const agent=agents[i%agents.length],r=job.item.r;
        move(agent,r.left+Math.min(22,r.width*.35),r.top+Math.min(22,r.height*.35));
        const f=job.fragment;
        f.style.transition='opacity 1.1s ease, transform 1.8s cubic-bezier(.18,.72,.25,1)';
        f.style.transform='scale(1)';
        f.style.opacity=job.item.isText?'.93':'.72';
        jobIndex++;
      },delay);
      timers.push(timer);
    });

    const totalDuration=jobs.length*680+2200;
    cycleTimer=setTimeout(()=>{
      if(mySequence!==sequence)return;
      // Fade the completed drawing softly, then continuously rebuild the current view.
      stage.querySelectorAll('.fragment').forEach((f,i)=>{
        f.style.transition='opacity 2.4s ease';
        f.style.opacity='.22';
      });
      cycleTimer=setTimeout(()=>runCycle(mySequence),2600);
    },totalDuration);
  }

  function restartForDirection(nextDirection){
    direction=nextDirection;
    sequence++;
    clearTimers();
    const guide=root.querySelector('.guide');
    guide.style.top=(direction>0?'72%':'28%');
    guide.style.opacity='.65';
    setTimeout(()=>guide.style.opacity='0',900);
    runCycle(sequence);
  }

  function onScroll(){
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const y=window.scrollY,delta=y-lastY;
      if(Math.abs(delta)>=5){
        const next=delta>0?1:-1;
        if(next!==direction)restartForDirection(next);
        lastY=y;
      }
    });
  }

  spawnAgents();
  restartForDirection(1);
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',()=>{
    sequence++;clearTimers();runCycle(sequence);
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden){lastY=window.scrollY;sequence++;clearTimers();runCycle(sequence);}
  });
  window.KnightlySwarmRebuild={refresh:()=>restartForDirection(direction)};
})();