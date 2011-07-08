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
