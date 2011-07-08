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
