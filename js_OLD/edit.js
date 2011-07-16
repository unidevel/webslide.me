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

		}

		return ((str.length)?str:false);
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
