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

// FIXME: ARGHS, maybe create something like _()_ stuff?
var _errors={
	403:'Session expired. Try to <a href="/login">login again</a>.',
	404:'Sorry, but the webslide wasn\'t found.',
	500:'Sorry, try again later.\nServer load is heavy at the moment.'
};


var webslide={};
webslide.me={
	'settings':{
		'ids':{},
		'tags':{},
		'heuristics':{},
		'active':{}
	},
	// set settings
	'set':function(name,value){
		if(name.match(/\./,'g')){
			name=name.split(/\./);

			// needed for all
			if(name.length>=1){ if(!this.settings[name[0]]){ this.settings[name[0]]={}; } }
			if(name.length>=2){ if(!this.settings[name[0]][name[1]]){ this.settings[name[0]][name[1]]={}; } }
			if(name.length>=3){ if(!this.settings[name[0]][name[1]][name[2]]){ this.settings[name[0]][name[1]][name[2]]={}; } }

			if(name.length===1){
				this.settings[name[0]]=value;
				return true;
			}else if(name.length===2){
				this.settings[name[0]][name[1]]=value;
				return true;
			}else if(name.length===3){
				this.settings[name[0]][name[1]][name[2]]=value;
				return true;
			}

			// TODO: dynamically build eval() string or so =?
			/*
			for(i=0;i<key.length;i++){
				// (i+'/'+key.length);
				// (str);
			}
			*/

		}else{
			this.settings[name]=value;
			return true;
		}
		return false;
	},
	// get settings
	'get':function(name){
		if(name.match(/\./,'g')){
			name=name.split(/\./);
			var cache=this.settings;

			for(var k in name){
				if(typeof(cache[name[k]])!='undefined'){
					cache=cache[name[k]];
				}else{
					cache=false;
				}
			}
			return cache;
		}else if(typeof(this.settings[name])!='undefined'){
			return this.settings[name];
		}
		return false;
	},
	'init':function(properties){
		for(var k in properties){
			if(typeof(properties[k])!='undefined'){
				this.set(k,properties[k]);
			}
		}

		//this.slides.update();
		this.slides.init();
		this.events.init();
		this.notify('webslide.me editor ready.');
		//this.wizard.init();
	},
	// update list with api call
	'updatelist':function(id){
		var target=document.getElementById(id.replace(/#/,''));
		// list type, single=radio, multiple=checkbox
		var itemtype=(arguments[1]===false)?'checkbox':'radio';

		if(target){
			var api=target.getAttribute('data-api');
			var method=target.getAttribute('data-method');

			if(method=='get'){
				ajax.get(api,function(json,type,status){
					if(status==200){
						var results=JSON.parse(json);
						if(results){
							target.innerHTML=''; // clear old list
							for(var i=0;i<results.length;i++){
								var item=document.createElement('p');
								item.innerHTML='<input type="'+itemtype+'" name="'+target.id+'" id="'+target.id+'-'+parseInt(i+1,10)+'" value="'+results[i].file+'"/><label class="auto" for="'+target.id+'-'+parseInt(i+1,10)+'">'+results[i].file+"</label>";
								target.appendChild(item);
							}
						}
					}
					// don't notify user if list update failed.
				});
			}
			//else if(method=='post'){
				// TODO: offer a post method, maybe with data-post='{key:val,key2:val2}' or similiar?
			//}
		}
	},
	// new webslide
	'new':function(){
		if(window.confirm('Sure to create a new slide?\nAll unsaved changes will be lost.')){
			var x=window.location.href+''.split('#');
			window.location.href=x[0];
		}
	},
	// open webslide from server
	'open':function(){
		var list=document.getElementById('lb-open-list');
		var items=list.getElementsByTagName('input');

		// alternative calling variant
		var file=(arguments[0])?arguments[0]:false;

		// check for a selected file
		for(var i=0;i<items.length;i++){
			if(items[i].checked){
				file=items[i].value;
			}
		}

		// return if no file was found.
		if(!file){ return; }

		ajax.post('/api/edit/open',{
			'user':login.user,
			'skey':login.skey,
			'file':file,
			'type':'webslide'
		},function(result,type,status){
			if(status==200){
				var parent=document.getElementById('slides');
				if(parent){
					var slides=parent.getElementsByTagName('section');
					for(i=0;i<parseInt(slides.length - 1,10);i++){
						parent.removeChild(slides[i]);
					}
					parent.innerHTML=result+parent.innerHTML; // insert once before #slides-new

					webslide.me.slides.init();
					webslide.me.events.init(); // re-attach all events to modified DOM

					// load meta data
					ajax.post('/api/edit/open',{
						'user':login.user,
						'skey':login.skey,
						'file':file,
						'type':'meta'
					},function(json,type,status){
						if(status==200){
							webslide.me.parser.set('meta',JSON.parse(json));
							document.getElementById('meta-filename').value=file.replace('.html','');
						}
					});

				}
			}else{
				webslide.me.notify(_errors[status]);
			}
		});

		webslide.me.hide('#lb-open');
	},
	// remove webslide from server
	'remove':function(){
		var list=document.getElementById('lb-manage-list');
		var items=list.getElementsByTagName('input');

		for(var i=0;i<items.length;i++){
			if(items[i].checked && window.confirm('Sure to remove webslide "'+items[i].value+'"?\nRemoval can not be undone.')){
				var item=items[i];
				ajax.post('/api/edit/remove',{
					'user':login.user,
					'skey':login.skey,
					'file':items[i].value
				},function(result,type,status){
					if(status==200){
						// remove input item's parentNode (<li>,<p>) from DOM
						list.removeChild(item.parentNode);
					}
				});
			}
		}
	},
	// wrapper, saves and redirects to the play URL
	'play':function(){
		webslide.me.save(function(file,type,status){
			if(status==200){
				var question='Sure to play the webslide?\nGet to here again using the back button of your browser.';
				if(window.confirm(question)){
					window.location.href='/play/'+file;
				}
			}else{
				webslide.me.notify(_errors[status]);
			}
		});
	},
	// save webslide to server
	'save':function(){
		// optional argument
		var callback=((arguments[0])?arguments[0]:false);

		var _file=document.getElementById('meta-filename').value;
		var _download=(document.getElementById('meta-download').checked) ? 'yes' : 'no';

		var _meta='';
		var meta=webslide.me.parser.get('meta');
		if(meta){
			for(var k in meta){
				if(k!='filename'){ // don't include filename in meta data
					if(k=='theme'){
						if(!meta[k].length){ meta[k]='theme-blue.css'; }
					}
					_meta+='\n\t'+'"'+k+'":"'+meta[k]+'",';
				}
			}

			if(_meta.length>0){
				_meta=_meta.substr(0,parseInt(_meta.length-1,10));
				_meta='{'+_meta+'\n}';
			}
		}else{
			alert('Error: Could not parse meta data.');
			return false;
		}

		var _webslide='';
		var slides=document.getElementById('slides').getElementsByTagName('section');

		for (var i=0;i<slides.length;i++){
			if(slides[i].getAttribute('id')!='slides-new'){
				var y='';
				if(slides[i].getAttribute('data-animation')){
					y+=' data-animation="'+slides[i].getAttribute('data-animation')+'"';
				}
				if(slides[i].getAttribute('data-layout')){
					y+=' data-layout="'+slides[i].getAttribute('data-layout')+'"';
				}

				_webslide+='<section'+y+'>'+slides[i].innerHTML+'</section>\n';
			}
		}

		// _webslide=_webslide.replace(/&/g,"_amp_");
		// what the hell is going on!? I don't get it, fuck URI schema.

		if(_webslide.length>0 && _meta.length>0 && _file.length>0){
			if(!callback){
				ajax.post('/api/edit/save',{
					'user':login.user,
					'skey':login.skey,
					'file':_file+'.html',
					'download':_download,
					'meta':_meta,
					'webslide':_webslide
				},function(result,type,status){
					if(status==200){
						webslide.me.notify('Your webslide was successfully saved.');
					}else{
						webslide.me.notify(_errors[status]);
					}
				});
			}else{
				ajax.post('/api/edit/save',{
					'user':login.user,
					'skey':login.skey,
					'file':_file+'.html',
					'meta':_meta,
					'webslide':_webslide
				},callback);
			}
			webslide.me.hide('#lb-save');
			return true;
		}
		return false;
	},
	// event handlers and callback functionality
	'events':{
		'init':function(){
			var x=document.getElementById('slides-new');
			x.onclick=function(){ webslide.me.slide.create(); };
		},
		'update':function(){
			var slides=webslide.me.get('cache');
			for(var i=0;i<slides.length;i++){
				slides[i].onclick=function(){ webslide.me.slide.open(this); };
			}
		}
	},
	// slide index functionality
	'slides':{
		'init':function(){
			webslide.me.slides.update(); // call update function to prevent un-id-ed section elements
			return true;
		},
		'update':function(){
			// ...(id).childNodes will insert empty TextNodes...
			var slides=document.getElementById('slides').getElementsByTagName('section');
			var cache=[],i;

			// skip the last one ("New Slide")
			for(i=0;i<slides.length;i++){
				if(slides.item(i).getAttribute('id')!='slides-new'){
					cache[i]=slides.item(i);
					cache[i].setAttribute('id','slides-'+parseInt(i+1,10));
					cache[i].setAttribute('title',parseInt(i+1,10)+' of '+(slides.length-1));
				}
			}

			webslide.me.set('cache',cache);
			webslide.me.events.update();
		}
	},
	// slide manipulation
	'slide':{
		'open':function(slide){
			var slides=webslide.me.get('cache');
			var i,j;

			// cleanup
			for(i=0;i<slides.length;i++){
				slides[i].removeAttribute('class');
			}

			// hide overlay
			var overlay = document.getElementById('workspace-overlay');
			overlay.removeAttribute('style'); overlay.value='';

			// optional argument
			var workspace=(arguments[2]) ? arguments[2] : document.getElementById('workspace');
			workspace.innerHTML=slide.innerHTML;
			slide.className='active';
			webslide.me.set('active.slide',slide);

			// update slide animation
			var animation=(slide.getAttribute('data-animation')) ? slide.getAttribute('data-animation') : false;
			if(animation){
				workspace.setAttribute('data-animation',animation);
				webslide.me.parser.set('slide','data-animation',animation);
			}else{
				workspace.removeAttribute('data-animation');
				webslide.me.parser.set('slide','data-animation','false');
			}

			// update slide layout
			var layout=(slide.getAttribute('data-layout')) ? slide.getAttribute('data-layout') : false;
			if(layout){
				workspace.setAttribute('data-layout',layout);
				webslide.me.parser.set('slide','data-layout',layout);
			}else{
				workspace.removeAttribute('data-layout');
				webslide.me.parser.set('slide','data-layout','false');
			}

			// make elements editable
			var tags=webslide.me.get('tags.editable');
			for(i=0;i<tags.length;i++){
				var elements=workspace.getElementsByTagName(tags[i]);
				if(elements){
					for(j=0;j<elements.length;j++){
						elements[j].onclick=function(e){ webslide.me.element.open(this); };
					}
				}
			}
		},
		'save':function(){
			// optional arguments
			var workspace=document.getElementById('workspace');
			var innerHTML=(arguments[1]) ? arguments[1] : workspace.innerHTML;
			var slide=(arguments[0]) ? arguments[0] : webslide.me.get('active.slide');

			// update content
			slide.innerHTML=innerHTML;

			// update properties
			var props=webslide.me.parser.get('slide');

			// data-animation
			if(props['data-animation']!='false' && props['data-animation']!=slide.getAttribute('data-animation')){
				// save animation changes to slide
				slide.setAttribute('data-animation',props['data-animation']);

				if(check_css('transform') && check_css('transition')){
					// hide overlay
					var overlay = document.getElementById('workspace-overlay');
					overlay.removeAttribute('style'); overlay.value='';

					// animation preview on #workspace
					workspace.setAttribute('data-animation',props['data-animation']);
					workspace.setAttribute('data-next','true');

					// simulates slide-navigation to "active slide"
					window.setTimeout(function(){
						workspace.removeAttribute('data-next');
						workspace.setAttribute('aria-selected','true');
					},1000);

					// ends animation simulation
					window.setTimeout(function(){
						var ws=document.getElementById('workspace');
						ws.removeAttribute('aria-selected');
					},3000);

				}
			}else if(props['data-animation']=='false'){
				slide.removeAttribute('data-animation');
				workspace.removeAttribute('data-animation');
			}

			// data-layout
			if(props['data-layout']!='false' && props['data-layout']!=slide.getAttribute('data-layout')){
				slide.setAttribute('data-layout',props['data-layout']);
				workspace.setAttribute('data-layout',props['data-layout']);
			}else if(props['data-layout']=='false'){
				slide.removeAttribute('data-layout');
				workspace.removeAttribute('data-layout');
			}

			webslide.me.slides.update();
		},
		'create':function(){
			// optional argument!
			var id=(arguments[0]) ? arguments[0] : parseInt(webslide.me.get('cache').length + 1,10);

			var x=document.getElementById('slides');
			var y=document.createElement('section');
			y.title=id; y.id='slides-'+id;
			y.innerHTML="<h1>Title</h1><p>Edit / Click me!</p>";
			x.insertBefore(y,document.getElementById('slides-new'));

			webslide.me.slides.update();
		},
		'remove':function(){
			if(window.confirm('Sure to remove this slide?')){
				// optional argument
				var slide=(arguments[0]) ? arguments[0] : webslide.me.get('active.slide');
				var parent=document.getElementById('slides');
				parent.removeChild(slide);
				webslide.me.slides.update();
			}
		}
	},
	// element manipulation
	'element':{
		'open':function(element){
			webslide.me.set('active.element',element);

			// update element properties
			webslide.me.parser.set('element','tagName',element.tagName.toLowerCase());
			webslide.me.parser.set('element','class',element.getAttribute('class'));

			var workspace = document.getElementById('workspace');
			var overlay = document.getElementById('workspace-overlay');
			var c = window.getComputedStyle(element,null);

			overlay.value=webslide.me.apply_heuristics(element.innerHTML,false,element.tagName);

			overlay.onblur=function(){ webslide.me.element.update(); };
			overlay.onkeypress=function(event){
				if(event.keyCode==13){
					var _lineHeight;
					// increase height, add a new line
					if(this.style.lineHeight=='normal'){
						_lineHeight=parseInt(this.style.fontSize.replace(/px/,''),10);
					}else{
						_lineHeight=parseInt(this.style.lineHeight.replace(/px/,''),10);
					}
					this.style.height=(parseInt(this.style.height.replace(/px/,''),10) + _lineHeight)+'px';
				}
			};

			// update offset and dimensions
			overlay.style.top=(workspace.offsetTop + element.offsetTop)+'px';
			overlay.style.left=(workspace.offsetLeft + element.offsetLeft)+'px';
			overlay.style.width=(element.offsetWidth)+'px';
			overlay.style.height=(element.offsetHeight)+'px';

			// update font and text styles
			overlay.style.lineHeight=c.getPropertyValue('line-height');
			overlay.style.fontFamily=c.getPropertyValue('font-family');
			overlay.style.fontSize=c.getPropertyValue('font-size');
			overlay.style.fontStyle=c.getPropertyValue('font-style');
			overlay.style.fontWeight=c.getPropertyValue('font-weight');
			overlay.style.textAlign=c.getPropertyValue('text-align');

			// show overlay
			overlay.style.display='block';
			overlay.focus();
		},
		'update':function(){
			webslide.me.element.save(webslide.me.get('active.element'),true);
		},
		'save':function(){
			// optional argument
			var element = (arguments[0]) ? arguments[0] : webslide.me.get('active.element');
			var donthide = (arguments[1]) ? arguments[1] : false;

			var target=webslide.me.parser.get('element');
			if(target){
				if(!donthide){
					// hide overlay
					var overlay=document.getElementById('workspace-overlay');
					overlay.removeAttribute('style'); overlay.value='';
				}

				// apply heuristics in textarea > html mode
				target.innerHTML=webslide.me.apply_heuristics(target.innerHTML,true,target.tagName);

				if(element.tagName.toLowerCase()!=target.tagName.toLowerCase()){
					var _current=element;
					var _next=element.nextSibling;
					var _parent=element.parentNode;

					element=document.createElement(target.tagName);
					element.innerHTML=target.innerHTML;
					element.onclick=function(){ webslide.me.element.open(this); };
					// TODO: data -onload and -onunload attributes

					if(_next!==null){
						_parent.removeChild(_current);
						_parent.insertBefore(element,_next);
					}else{
						_parent.removeChild(_current);
						_parent.appendChild(element);
					}

					webslide.me.set('active.element',element);
				}else if(element.innerHTML!=target.innerHTML){
					element.innerHTML=target.innerHTML;
				}
			}

			webslide.me.slide.save();
		},
		'create':function(_parent){
			// optional argument
			var workspace = (arguments[0]) ? arguments[0] : document.getElementById('workspace');
			var target = webslide.me.parser.get('element');

			if(target){
				target.innerHTML='New element';

				var _clone=document.createElement(target.tagName);
				_clone.innerHTML=target.innerHTML;
				_clone.onclick=function(){ webslide.me.element.open(this); };

				if(workspace.appendChild(_clone)){
					webslide.me.slide.save();
					return true;
				}else{
					return false;
				}
			}
		},
		'remove':function(){
			var element = (arguments[0]) ? arguments[0] : webslide.me.get('active.element');

			var overlay = document.getElementById('workspace-overlay');
			overlay.removeAttribute('style'); overlay.value='';

			var workspace = document.getElementById('workspace');
			if(workspace.firstChild==element){
				alert('You can\'t remove the first element!');
				return false;
			}
			if(workspace.removeChild(element)){
				webslide.me.slide.save(); // obj, html
				return true;
			}
		}
	},
	// theme manipulation
	'theme':{
		'open':function(url){
			if(webslide.me.theme.update(url)){
				webslide.me.parser.set('meta','theme',url);
			}
		},
		'update':function(url){
			var sheet=document.getElementById('meta-theme');
			if(sheet){
				sheet.href='/css/'+url;
				return true;
			}
			return false;
		}
	},
	// parser
	'parser':{
		'get':function(relation){
			var attribute=(arguments[1])?arguments[1]:false;

			var cache={};
			var types=['input','textarea','select'];
			for(var i=0;i<types.length;i++){
				var _=document.getElementsByTagName(types[i]);
				for(var j=0;j<_.length;j++){
					// filter all unrelated fieldtypes
					if(_[j].getAttribute('data-rel')==relation){
						if(_[j].tagName=='TEXTAREA'){
							cache[_[j].getAttribute('data-attr')]=((_[j].value) ? _[j].value : '');
						}else if(_[j].getAttribute('type')!='RADIO' || (_[j].getAttribute('type')=='RADIO' && _[j].checked)){
							cache[_[j].getAttribute('data-attr')]=((_[j].value) ? _[j].value : '');
						}else if(_[j].tagName=='SELECT'){
							cache[_[j].getAttribute('data-attr')]=_[j].getElementsByTagName('option')[_[j].selectedIndex].value;
						}
					}
				}
			}

			if(attribute){
				return cache[attribute];
			}else{
				return cache;
			}
		},
		'set':function(relation){
			var attributes;
			if(arguments[1] && arguments[2]){
				attributes={};
				attributes[arguments[1]]=arguments[2];
			}else if(typeof(arguments[1])=='object'){
				attributes=arguments[1];
			}

			var types=['input','textarea','select'];

			for(var attr in attributes){ // fixed value
				for(var j=0;j<types.length;j++){ // fixed value
					var _=document.getElementsByTagName(types[j]);
					for(var k=0;k<_.length;k++){ // dynamic value!
						if(_[k].getAttribute('data-rel')==relation && _[k].getAttribute('data-attr')==attr){ // filter unrelated fields
							if(_[k].getAttribute('type') && _[k].getAttribute('type').toLowerCase()=='select'){
								var __=_[k].getElementsByTagName('option');
								for(var l=0;l<__.length;l++){
									if(__[l].value==attributes[attr]){
										__[l].setAttribute('selected',true);
									}else{
										__[l].removeAttribute('selected');
									}
								}
							}else{
								_[k].value=(attributes[attr])?attributes[attr]:'';
							}
						}
					}
				}

				// hook for updating theme in <link> element
				if(attr=='theme'){
					document.getElementById('meta-theme').href='/css/'+attributes[attr];
				}
			}
		}
	},
	// lightbox functionality
	'show':function(url){
		var callback=(arguments[1])?arguments[1]:false;
		var arr=url.split("#");
		var id=arr[arr.length-1];

		// lightbox functionality
		var lb=document.getElementById(id);
		if(lb){
			if(lb.setAttribute('class','lightbox')){
				if(callback){ callback(); }
			}
		}

		return false;
	},
	// lightbox functionality
	'hide':function(url){
		var callback=(arguments[1])?arguments[1]:false;
		var arr=url.split("#");
		var id=arr[arr.length-1];

		var lb=document.getElementById(id);
		if(lb){
			if(lb.setAttribute('class','lightbox hidden')){
				if(callback){ callback(); }
			}
		}
		return false;
	},
	// notification functionality
	'notify':function(msg){
		var notification=document.getElementById('notification');
		if(notification){
			notification.innerHTML=msg;
			notification.style.display='block';
			window.setTimeout(function(){
				document.getElementById('notification').style.display='none';
			},5000);
		}
	},
	'apply_heuristics':function(str,backward,type){
		str=str.replace(/^\s+/, '').replace(/\s+$/, '');
		var i,j,parts;

		// apply list heuristics
		if(type.toLowerCase()=='ol' || type.toLowerCase()=='ul'){
			// html2textarea
			if(!backward){
				var marker=this.get('heuristics').li[0];
				parts=str.split(/<li/i); // <li class=...

				str=''; // clear cache

				for(i=0;i<parts.length;i++){
					parts[i]=parts[i].substr(1);
					parts[i]=parts[i].replace(/<\/li>/i,'');

					if(parts[i].length>0){
						str+=marker+' '+parts[i]+'\n';
					}
				}

			// textarea2html
			}else{
				var markers=this.get('heuristics').li;
				parts=str.split(/\n/);
				str=''; // clear cache

				for(i=0;i<parts.length;i++){
					parts[i]=parts[i].replace(/^\s+/, '').replace(/\s+$/, '');

					// check for markers at first position of trimmed string
					for(j=0;j<markers.length;j++){
						if(parts[i].indexOf(markers[j])===0){
							parts[i]=parts[i].substr(markers[j].length);
							// now fix spaces ("> Item" instead of ">Item")
							parts[i]=parts[i].replace(/^\s+/, '').replace(/\s+$/, '');
							str+="<li>"+parts[i]+"</li>";
						}
					}
				}

				// heuristics didn't work, so we don't give a fuck on the semantics
				if(str===''){
					for(i=0;i<parts.length;i++){
						str+="<li>"+parts[i]+"</li>";
					}
				}
			}

		// no list, so standard stuff =)
		}else{
			// html2textarea
			if(!backward){
				if(str.match(/<br>/i)){ // browser is in html5 mode
					parts=str.split(/<br>/i);
				}else{ // browser is in xhtml mode
					parts=str.split(/<br\/>/i);
				}
				str=''; // clear cache
				for(i=0;i<parts.length;i++){
					if(i!=parseInt(parts.length-1,10)){
						str+=parts[i]+'\n';
					}else{
						str+=parts[i];
					}
				}

			// textarea2html
			}else{
				parts=str.split(/\n/);
				str=''; // clear cache

				for(i=0;i<parts.length;i++){
					parts[i].replace(/^\s+/, '').replace(/\s+$/, '');
					if(i<parseInt(parts.length-1,10) && parts[i].length>0){
						str+=parts[i]+'<br/>';
					}else if(parts[i].length>0){ // allow only <br/>, not <br/><br/>
						str+=parts[i];
					}
				}
			}
		}

		return ((str.length)?str:false);
	},
	'feedback':function(){
		var feedback=webslide.me.parser.get('feedback');
		if(feedback && feedback.idea.length>20){
			ajax.post('/api/feedback',{
				'user':login.user,
				'skey':login.skey,
				'email':feedback.email,
				'idea':feedback.idea
			});
		}

		webslide.me.notify('Thanks for your feedback! We\'ll have a look on it soon.');
		return;
	},
	// wizard functionality
	'wizard':{
		'steps':[
			{'align':'right', 'target':'#slides-new','content':'Click here to create a new slide.'},
			{'align':'right', 'target':'#slides>section:nth-child(1)','content':'Click here to open the first slide.'},
			{'align':'left',  'target':'#workspace>*:nth-child(1)','content':'Click the first element to edit it.'},
			{'align':'left',  'target':'#properties-element','content':'Change the element type here.','event':'onchange'},
			{'align':'top','target':'#workspace>*:nth-child(2)','content':'Click the second element to edit it.'}
		],
		'init':function(){
			webslide.me.wizard.jumpto(0);

		},
		'jumpto':function(id){
			var wizard;
			var step=webslide.me.wizard.steps[id];
			var old=document.querySelector('[data-wizard]');
			if(old){
				old.removeAttribute('data-wizard');
			}

			var next=document.querySelector(step.target);
			if(step && next){
				if(!step.event){
					step.event='onclick';
				}
				next.setAttribute('data-wizard','true');
				next[step.event] = (function(old) {
					return function() {
						if(old){ old.call(this, arguments); }
						webslide.me.wizard.jumpto((parseInt(id,10)+1));
					};
				})(next[step.event]);

				wizard=document.getElementById('wizard-bubble');
				wizard.innerHTML=step.content;
				wizard.style.display='block';

				var cstyle=window.getComputedStyle(next,null);
				var parent=next.parentNode;

				var _top = parseInt((cstyle.getPropertyValue('top')=='auto') ? (parent.offsetTop + next.offsetTop) : cstyle.getPropertyValue('top').replace(/px/,''),10);
				var _left  = parseInt((cstyle.getPropertyValue('left')=='auto') ? (parent.offsetLeft + parent.offsetWidth + next.offsetLeft) : cstyle.getPropertyValue('left').replace(/px/,''),10);

				if(step.align=='left'){
					wizard.style.top=_top+'px';
					wizard.style.left=(_left - next.offsetWidth - 220)+'px';
					wizard.setAttribute('class','right');
				}else if(step.align=='right'){
					wizard.style.top=_top+'px';
					wizard.style.left=(_left - 10)+'px';
					wizard.setAttribute('class','left');
				}else if(step.align=='bottom'){
					wizard.style.top=(_top + next.offsetHeight)+'px';
					wizard.style.left=(_left - next.offsetWidth)+'px';
					wizard.setAttribute('class','top');
				}else if(step.align=='top'){
					var _height=window.getComputedStyle(wizard,null).getPropertyValue('height').replace(/px/,'');
					wizard.style.top=(_top - next.offsetHeight - _height)+'px';
					wizard.style.left=(_left - next.offsetWidth)+'px';
					wizard.setAttribute('class','bottom');
				}

				//wizard.style.right = ((cstyle.getPropertyValue('right')=='auto') ? next.offsetRight : cstyle.getPropertyValue('right'))+'px';

			}else{
				wizard=document.getElementById('wizard-bubble');
				wizard.removeAttribute('style');
			}
			// TODO: fix alignment issues with coordinate sums of the offsets.
			// TODO: fix arrow alignments & "marked element" border style (remove border style of last focussed element)			
		}
	}
};
