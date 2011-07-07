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


var ajax={
	'init':function(){
		ajax.req=false;

		if(typeof(XMLHttpRequest) != 'undefined'){
			ajax.req=new XMLHttpRequest();
		}else{
			var msxmlhttp='Msxml2.XMLHTTP.5.0 Msxml2.XMLHTTP.4.0 Msxml2.XMLHTTP.3.0 Msxml2.XMLHTTP Microsoft.XMLHTTP'.split(' ');
			for(var i=0;i<msxmlhttp.length;i++){
				try{
					ajax.req=new ActiveXObject(msxmlhttp[i]);
				}catch(e){
					ajax.req=null;
				}
			}
		}
	},
	// GET url, optional callback
	'get':function(url){
		if(!ajax.req){ ajax.init(); }
		ajax.callback=((arguments[1])?arguments[1]:null);
		ajax.req.open('GET',url,true);
		ajax.req.send(null);

		ajax.req.onreadystatechange=function(){ ajax.handle(); };

		//window.setTimeout(function(){ ajax.abort(); },2000,true);
	},
	// POST url with params, optional callback
	'post':function(url){
		if(!ajax.req){ ajax.init(); }
		ajax.callback=((arguments[2])?arguments[2]:null);

		var str='';
		var params=((arguments[1])?arguments[1]:null);
		if(params){
			var i=0;
			for(var k in params){
				str+=(i > 0 ? "&" : "")+k+'='+encodeURI(params[k]);
				i++;
			}
		}

		ajax.req.open('POST',url,true);
		ajax.req.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		ajax.req.send(((str)?str:null));

		ajax.req.onreadystatechange=function(){ ajax.handle(); };

		//window.setTimeout(function(){ ajax.abort(); },2000,true);
	},
	'handle':function(){
		var req=ajax.req;
		if(req.readyState==4){ // got response
			if(req.responseXML && req.responseXML.length){
				ajax.parse(req.responseXML,'xml',req.status);
			}else{
				ajax.parse(req.responseText,'text',req.status);
			}
		}
	},
	'abort':function(){
		ajax.req.abort();
	},
	'parse':function(result,type,status){
		if(ajax.callback){
			ajax.callback(result,type,status);
		}else{
			ajax.result=result;
			ajax.type=type;
			ajax.status=status;
		}
	}
};

var login={
	'user':'demo',
	'skey':'demo'
};

// translateable in later use
var _errors={
	403:'Session expired. Try to <a href="/login">login again</a>.',
	404:'Sorry, but the webslide wasn\'t found.',
	500:'Sorry, try again later.\nServer load is heavy at the moment.'
};

// load login environment
(function setlogin(){
	function get_cookie(c_name){
		var d_c=document.cookie;
		if(d_c.length>0){
			var c_start=d_c.indexOf(c_name + "=");
			if(c_start!=-1){
				c_start=c_start + c_name.length+1;
				var c_end=d_c.indexOf(";",c_start);
				if(c_end==-1){ c_end=d_c.length; }
				return unescape(d_c.substring(c_start,c_end));
			}
		}
		return "";
	}

	// load cookie with session key
	if(document.cookie){
		login.user=(get_cookie('user'))?get_cookie('user'):'demo';
		login.skey=(get_cookie('skey'))?get_cookie('skey'):'demo';
	}
})();



// advanced IE9 functionalities
(function ie9sitemode(){
	if(window.external && typeof(window.external.msIsSiteMode)!='undefined' && window.external.msIsSiteMode()){
		ajax.post('/api/external/webslides',{
			'user':login.user
		},function(result,type,status){
			if(status==200){
				var slides=JSON.parse(result);
				if(slides){
					window.external.msSiteModeClearJumplist();
					window.external.msSiteModeCreateJumplist("Edit "+login.user+"'s Webslides");
					for(var i=0;i<slides.length;i++){
						window.external.msSiteModeAddJumpListItem(slides[i].title,"/edit/"+slides[i].file,"/favicon.ico");
					}
					window.external.msSiteModeShowJumplist();
				}
			}else{
				window.location.href='/login';
			}
		});
	}
})();
