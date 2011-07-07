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

// (function(){
var webslide={};
webslide.me={
	'settings':{},
	'slides':[], // slides cache
	'init':function(remote){
		// detect apabilities
		this.detect_features();

		var title = document.getElementsByTagName('title')[0].textContent;
		var slides = document.getElementsByTagName('section');

		// IE fix, because IE doesn't know textContent =/
		title= (title) ? title : ((document.title) ? document.title : 'Please use a more up-to-date Web Browser!');

		// cache the elements
		for (var i=0;i<slides.length;i++){
			slides[i].setAttribute('id','slide-'+(i + 1));
			slides[i].setAttribute('data-next','true'); // prepare animation positioning
			this.slides.push(slides[i]);
		}

		// create the footer with information
		var footer = document.createElement('footer');
		footer.id = 'footer';
		footer.innerHTML = '<div class="title">'+title+'</div>'+'<div class="index"><span id="pagenumber">1</span> / ' + slides.length +'</div>';
		document.getElementsByTagName('body')[0].appendChild(footer);

		// set first slide to active
		this.set('active',this.slides[0]);

		// attach the events
		this.attach_events();

		// finally activate the remote control
		if(remote){
			this.remote.init();
		}
	},
	'get':function(key){
		return ((typeof(this.settings[key])!='undefined')?this.settings[key]:false);
	},
	'set':function(key,val){
		this.settings[key]=val;
		return true;
	},
	'detect_features':function(){
		if(window.addEventListener){
			this.set('event_method','addEventListener');
		}else if(window.attachEvent) {
			this.set('event_method','attachEvent');
		}else{
			this.set('event_method',false);
		}

		var methods='';
		if(window.Touch || document.ontouchstart){
			methods+=' touchstart';
		}

		// Fuck you, Opera ASA, idiots!
		// You're too silly to implement a simple if(window.event)!
		// I hate Opera browser and its fucked up window.Event and window.event mixery.

		// DOM Level 2 (except Opera)
		if(window.event){ // typeof(window.event) crashes Opera. Amazing JS engine. No, really.
			if(window.event.mouseup){
				methods+=' mouseup';
			}else if(window.event.keyup){
				methods+=' keyup';
			}
		// Old Internet Explorer implementation
		}else if(window.Event){
			if(window.Event.MOUSEUP){
				methods+=' mouseup';
			}else if(window.Event.KEYUP){
				methods+=' keyup';
			}
		}

		// This is just for Opera and its buggy window.event mixery
		if((document.onmouseup=function(){}) && !methods.match(/mouseup/)){
			document.onmouseup=null;
			methods+=' mouseup';
		}
		if((document.onkeyup=function(){}) && !methods.match(/keyup/)){
			document.onkeyup=null;
			methods+=' keyup';
		}

		// DOM Level 0 / Model 2
		if((document.onclick=function(){}) && !methods.match(/mouseup/)){
			// Well, we've got an old, old browser. Seems like grandma is online.
			document.onclick=null;
			methods=''; // clear methods.
			// elemen.onclick is fallback if event_method is false
		}

		// only god knows which IE he's running =/
		methods=(methods.length!==0) ? methods.trim().split(' ') : false;
		// this.set('play_methods',[]);
		this.set('play_methods',methods);
	},
	'attach_events':function(){
		// default navigation methods
		var navi=document.createElement('div');
		navi.setAttribute('id','navigation');
		navi.innerHTML = '<button accesskey="3" title="backward" onclick="webslide.me.navigate(\'backward\')">&lt;</button><button accesskey="2" title="forward" onclick="webslide.me.navigate(\'forward\')">&gt;</button>';
		if(!document.getElementById('footer').appendChild(navi)){
			// Notice grandma that her browser is born before me.
			var body=document.getElementsByTagName('body')[0];
			body.innerHTML='Your browser is a dinosaur. Never mentioned of updating it?';
			body.style.color='#fff';
			body.style.backgroundColor='#444';
			body.style.textAlign='center';
		}

		var play_function=function(event){
			// touch fixes
			if(typeof(event.preventDefault)!='undefined'){
				event.preventDefault();
			}
			if(typeof(event.touches)!='undefined'){
				event=event.touches[0];
			}
			// mouse click
			if(typeof(event.clientX)!='undefined'){
				if(event.button && event.button!==0){
					// middle mouse button || right mouse button clicked
					return;
				}
				if(event.clientX > parseInt(window.innerWidth/2,10)){
					webslide.me.navigate('forward');
				}else{
					webslide.me.navigate('backward');
				}
			}else if(event.keyCode){
				// page down
				if(event.keyCode == 34){
					event.preventDefault();
					webslide.me.navigate('forward');
				// page up
				}else if(event.keyCode == 33){
					event.preventDefault();
					webslide.me.navigate('backward');
				}
			}
		};

		var slides=webslide.me.slides;
		var event_method=webslide.me.get('event_method');
		var play_methods=webslide.me.get('play_methods');

		if(slides && event_method && play_methods.length){
			for(var i=0;i<slides.length;i++){
				for(var j=0;j<play_methods.length;j++){
					if(event_method=='addEventListener'){
						if(play_methods[j]=='mouseup' || play_methods[j]=='touchstart'){
							slides[i].addEventListener(play_methods[j],play_function,false);
						}else{
							document.addEventListener(play_methods[j],play_function,false);
						}
					}else if(event_method=='attachEvent'){
						slides[i].attachEvent(play_methods[j],play_function,false);
					}
				}
			}
		}
		//else if(slides && event_method===false){
			//for(i=0;i<slides.length;i++){
				// Sorry, grandma. But you're surfing with a dinosaur browser
			//	slides[i].onclick=function(){ webslide.me.navigate('forward'); };
			//}
		//}
	},
	// navigate to direction
	'navigate':function(direction){
		var slides = webslide.me.slides;
		var cur  = webslide.me.get('active');
		var slide,next,i;

		// WebKit doesn't allow getElementsByClassName on elements -.-
		var steps=document.getElementsByClassName('animation-step');

		if(direction==='forward'){
			// animate animation steps
			if(steps){
				for(i=0;i<steps.length;i++){
					slide=steps[i].parentNode;
					if(slide==cur && steps[i].style.opacity!=1){
						steps[i].style.opacity=1;
						return; // skips animation to next slide
					}
					// clear animation steps when second-next slide is active doesn't make sense for screen readers.
					//else if(slide!=cur){
					//	steps[i].style.opacity=0;
					//}
				}
			}

			// animate to next slide
			i=parseInt(cur.id.replace(/slide-/,''),10); // #slide-7 = slides[6] + 1 = slides[7]
			next=(slides[i])?slides[i]:false;

			if(i<slides.length && next){
				cur.removeAttribute('aria-selected');
				cur.removeAttribute('data-next');
				cur.setAttribute('data-prev','true');
				if(cur.hasAttribute('data-onunload')){
					window[cur.getAttribute('data-onunload')].call(window, cur);
				}

				next.removeAttribute('data-next');
				next.setAttribute('aria-selected','true');
				webslide.me.set('active',next);
				if(next.hasAttribute('data-onload')){
					window[next.getAttribute('data-onload')].call(window, next);
				}
			}

		}else if(direction==='backward'){
			// animate animation steps
			if(steps){
				for(i=(steps.length - 1);i>=0;i--){
					slide=steps[i].parentNode;
					if(slide==webslide.me.get('active') && steps[i].style.opacity==1){
						steps[i].style.opacity=0;
						return; // skips animation to next slide
					}
					// do nothing with animation-steps on other slides
				}
			}

			// animate to next slide
			i=(parseInt(cur.id.replace(/slide-/,''),10) - 1); // #slide-7 = slides[6] - 1 = slides[5]
			if(i>0){
				i=i-1; // disallows slide-1 being i=-1
			}
			next=(slides[i])?slides[i]:false;

			if(next){
				cur.removeAttribute('aria-selected');
				cur.setAttribute('data-next','true');
				cur.removeAttribute('data-prev');
				if(cur.hasAttribute('data-onunload')){
					window[cur.getAttribute('data-onunload')].call(window, cur);
				}

				next.removeAttribute('data-prev');
				next.setAttribute('aria-selected','true');
				webslide.me.set('active',next);
				if(next.hasAttribute('data-onload')){
					window[next.getAttribute('data-onload')].call(window, next);
				}
			}
		}

		if(next){
			// modify location hash for re-opening or sharing targeted slides
			if(window.location){
				window.location.hash=next.id;
			}
			document.getElementById('pagenumber').innerHTML=next.id.replace(/slide-/,'');
		}
	},
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
