(function(){

/* PRELOADER CODE */

function a(){
if(document.getElementById('sn-preloader'))return;
var p=document.createElement('div');
p.id='sn-preloader';
p.style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;display:flex;align-items:center;justify-content:center;z-index:99999999';
p.innerHTML='<img src="https://i.ibb.co/8L0r4nQY/image.png" style="max-width:220px;">';
document.body.appendChild(p);
}

})();