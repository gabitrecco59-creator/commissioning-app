/* Efectos fluidos Commissioning: revelado circular del tema, indicador de pestañas, entrada escalonada, números que cuentan, foco en tarjetas. */
(function(){
  var root=document.documentElement,red=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* revelado circular al cambiar tema (envuelve toggleTheme existente) */
  var px=innerWidth/2,py=0;
  document.addEventListener('pointerdown',function(e){px=e.clientX;py=e.clientY},{capture:true,passive:true});
  function wrapTheme(){
    var o=window.toggleTheme;if(typeof o!=='function'||o.__cx)return;
    var f=function(){
      var b=document.getElementById('thm');if(b){var r=b.getBoundingClientRect();px=r.left+r.width/2;py=r.top+r.height/2}
      if(!document.startViewTransition||red){return o.apply(this,arguments)}
      var x=px,y=py,rad=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y)),self=this,a=arguments;
      var t=document.startViewTransition(function(){o.apply(self,a)});
      t.ready.then(function(){root.animate({clipPath:['circle(0px at '+x+'px '+y+'px)','circle('+rad+'px at '+x+'px '+y+'px)']},{duration:900,easing:'cubic-bezier(.2,.7,.2,1)',pseudoElement:'::view-transition-new(root)'})}).catch(function(){});
    };
    f.__cx=1;window.toggleTheme=f;
  }
  /* indicador deslizante: usa offsetLeft/Top (relativos al contenedor que se desplaza) y conserva el scroll de la barra entre renders */
  var prev=null,lastSL=0,tabsEl=null;
  function geo(on){return {x:on.offsetLeft,y:on.offsetTop,w:on.offsetWidth,h:on.offsetHeight}}
  function put(ind,g){ind.style.width=g.w+'px';ind.style.height=g.h+'px';ind.style.transform='translate('+g.x+'px,'+g.y+'px)'}
  function tabInd(centrar){
    var nav=document.getElementById('tabs');if(!nav)return;
    if(nav!==tabsEl){tabsEl=nav;nav.addEventListener('scroll',function(){lastSL=nav.scrollLeft},{passive:true})}
    var on=nav.querySelector('button.on');if(!on)return;
    var ind=nav.querySelector('.cxind'),g=geo(on);
    if(!ind){
      ind=document.createElement('span');ind.className='cxind';nav.insertBefore(ind,nav.firstChild);nav.classList.add('cxi');
      nav.scrollLeft=lastSL;
      ind.style.transition='none';put(ind,prev||g);void ind.offsetWidth;ind.style.transition='';
    }
    put(ind,g);prev=g;
    if(centrar){
      var objetivo=on.offsetLeft-(nav.clientWidth-on.offsetWidth)/2;
      if(Math.abs(nav.scrollLeft-objetivo)>2){if(red||!nav.scrollTo)nav.scrollLeft=objetivo;else nav.scrollTo({left:objetivo,behavior:'smooth'})}
    }
  }
  /* números que cuentan */
  function count(el){
    var t=el.textContent.trim(),m=/^(\d+)([.,]\d+)?$/.exec(t);if(!m||red)return;
    var dec=m[2]?m[2].length-1:0,sep=m[2]?m[2][0]:',',to=parseFloat(t.replace(',','.')),t0=performance.now(),D=900;
    (function s(n){var k=Math.min(1,(n-t0)/D),e=1-Math.pow(1-k,4),v=to*e;el.textContent=dec?v.toFixed(dec).replace('.',sep):String(Math.round(v));if(k<1)requestAnimationFrame(s);else el.textContent=t})(t0);
  }
  var last=null,v;
  function onRender(){
    tabInd();wrapTheme();
    var on=document.querySelector('#tabs button.on'),cur=on?on.textContent:'';
    if(!v||cur===last)return;last=cur;if(red)return;
    var i=0;Array.prototype.forEach.call(v.children,function(c){c.style.setProperty('--i',Math.min(i++,8))});
    v.classList.remove('cx-in');void v.offsetWidth;v.classList.add('cx-in');
    setTimeout(function(){v.classList.remove('cx-in')},1500);
    v.querySelectorAll('.kpi b,.ring b>span,.ring b').forEach(function(e){if(e.children.length===0)count(e)});
  }
  /* foco que sigue al puntero */
  function set(e){var c=e.target&&e.target.closest&&e.target.closest('.card,.tile');if(!c)return;var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')}
  document.addEventListener('pointermove',set,{passive:true});
  document.addEventListener('pointerdown',function(e){set(e);var c=e.target.closest&&e.target.closest('.card,.tile');if(c){c.classList.add('spot');setTimeout(function(){c.classList.remove('spot')},700)}},{passive:true});
  function boot(){
    v=document.getElementById('v');wrapTheme();
    if(v)new MutationObserver(function(){requestAnimationFrame(onRender)}).observe(v,{childList:true});
    var t=document.getElementById('tabs');if(t)new MutationObserver(function(){requestAnimationFrame(function(){tabInd(true)})}).observe(t,{childList:true});
    addEventListener('resize',function(){tabInd(true)});onRender();
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){tabInd(true)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  /* window.toggleTheme se define en un módulo: reintenta unos instantes */
  var n=0,iv=setInterval(function(){wrapTheme();if(window.toggleTheme&&window.toggleTheme.__cx||++n>40)clearInterval(iv)},250);
})();
