(function(){
function a(){
if(document.getElementById('sn-preloader'))return;
var p=document.createElement('div');
p.id='sn-preloader';
p.style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;display:flex;align-items:center;justify-content:center;z-index:99999999;transition:opacity .5s ease';
p.innerHTML='<img src="https://i.ibb.co/8L0r4nQY/image.png" style="max-width:220px;">';
document.body.appendChild(p);
}
function r(){
var p=document.getElementById('sn-preloader');
if(!p)return;
p.style.opacity='0';
setTimeout(function(){if(p.parentNode)p.parentNode.removeChild(p)},500);
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',a)}else{a()}
window.addEventListener('load',function(){setTimeout(r,700)});
})();
