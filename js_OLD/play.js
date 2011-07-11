/*
 * (c)2010 by webslide.me
 * @author: Christoph Martens
 * @email: ninja@martens.ms
 * 
 * This code is copyrighted. You are not allowed to copy,
 * modify or redistribute it without my knowledge.
 * 
 * But feel free to contact me if you want to get more
 * details about the concept or the source code.
*/

// translateable in later use
var _errors={
	403:'Session expired. Try to <a href="/login">login again</a>.',
	404:'Sorry, but the webslide wasn\'t found.',
	500:'Sorry, try again later.\nServer load is heavy at the moment.'
};



// (function(){
var webslide={};
webslide.me={

	// navigate to targeted slide
	'navigate_to':function(str){
		var target = str.trim().split(',');
		var slides = webslide.me.slides;
		var i,j;

		// find out what's the targeted slide
		i=(parseInt(target[0].replace(/slide-/,''),10) - 1); // #slide-7 = slides[6]

		// correct hacked webslides
		if(i>=slides.length){ i=(slides.length - 1); }
		if(i<0){ i=0; }

		if(slides[i]!=webslide.me.get('active')){ // animate only if active slide is not targeted one
			// call onunload-functionality of latest viewn slide
			var active=webslide.me.get('active');
			if(active.hasAttribute('data-onunload')){
				window[active.getAttribute('data-onunload')].call(window, active);
			}

			for(j=0;j<slides.length;j++){
				if(j<i){ // slide was already played
					slides[j].setAttribute('data-prev','true');
					slides[j].removeAttribute('data-next');
					slides[j].removeAttribute('aria-selected');
				}else if(j===i){ // slide is targeted
					slides[j].removeAttribute('data-prev');
					slides[j].removeAttribute('data-next');
					slides[j].setAttribute('aria-selected','true');
					if(slides[j].hasAttribute('data-onload')){
						window[slides[j].getAttribute('data-onload')].call(window, slides[j]);
					}
					webslide.me.set('active',slides[j]);
				}else if(j>i){ // slide will be played
					slides[j].removeAttribute('data-prev');
					slides[j].setAttribute('data-next','true');
					slides[j].removeAttribute('aria-selected');
				}
			}
		}
		// modify location hash for re-opening or sharing targeted slides
		if(window.location){
			window.location.hash='slide-'+parseInt(i + 1,10);
		}
		document.getElementById('pagenumber').innerHTML=parseInt(i + 1,10);

		var cur=webslide.me.get('active');
		// animate to targeted animation step
		i=parseInt(target[1],10);

		if(!isNaN(i)){
			var steps=document.getElementsByClassName('animation-step');
			if(steps){ // WebKit doesn't allow getElementsByClassName on nodes =/
				var h=1; // j=animation-step in document; h=animation-step in slide
				for(j=0;j<steps.length;j++){
					var slide=steps[j].parentNode;
					if(slide==cur){
						if(i>=h){ // animation step was played or is targeted animation step
							steps[j].style.opacity=1;
							h++;
						}else{ // animation step will be played
							steps[j].style.opacity=0;
							h++;
						}
					}else{
						steps[j].style.opacity=0;
					}
				}
			}
		}
	},
	// remote capabilities
	'remote':{
		'init':function(){
			webslide.me.set('timer',1000);
			window.setTimeout("webslide.me.remote.update()",webslide.me.get('timer'));

			var notice=document.getElementById('control-notice');
			if(notice){
				notice.innerHTML='This presentation is controlled live, follow it up at:<br/>';

				var a=document.createElement('a');
				var url=window.location.href.replace(/#.+/,'');
				a.setAttribute('href',url);
				a.innerHTML=url;
				notice.appendChild(a);
			}
		},
		'update':function(){
			var url=window.location.href.replace(/#.+/,'').replace(/\/play\//,'/api/control/client/');

			// Fix for IE9, caches, but doesn't validate new content against cache!
			// url+='?s='+Date().getTime();
			webslide.me.set('timeout',Math.round(new Date().getTime()));

			ajax.get(url,function(response,type,status){
				if(status==200 && response){
					webslide.me.navigate_to(response.toString().trim());

					var _start = webslide.me.get('timeout');
					var _end   = Math.round(new Date().getTime());
					var _timer = parseInt((_end - _start),10);

					// improves connection stability and constant updating process
					if(webslide.me.get('timer') < _timer){
						webslide.me.set('timer',_timer);
					}

					window.setTimeout("webslide.me.remote.update()",webslide.me.get('timer'));
				}else if(status==404){
					window.alert('The presentation is over, remote control deactivated.');
				}
			});
			return true;
		}
	}
};
//})();
