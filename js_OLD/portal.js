var portal={
	'login':{
		'show':function(){
			var element=document.getElementById('login');
			if(element){
				element.setAttribute('class','lightbox');
			}

			this.update();
		},
		'hide':function(){
			var element=document.getElementById('login');
			if(element){
				element.setAttribute('class','lightbox hidden');
			}
		},
		'update':function(){
			element=(arguments[0])?arguments[0]:document.getElementById('login-switch');
			var x=document.getElementById('login-email');
			var y=document.getElementById('fieldset-links');

			if(element.checked){
				x.style.display='inline-block';
				y.style.display='block';
			}else{
				x.style.display='none';
				y.style.display='none';
			}
		},
		'submit':function(){
			var _={
				'name':document.getElementById('login-1').value,
				'pass':document.getElementById('login-3').value
			};

			if(document.getElementById('login-switch').checked){
				_.email=document.getElementById('login-2').value;
				_.create_login='yes';
			}else{
				_.email='';
				_.create_login='no';
			}

			ajax.init();
			ajax.post('/api/login',{
				'user':_.name,
				'pass':_.pass,
				'email':_.email,
				'create_login':_.create_login
			},function(result,type,status){
				if(status==200){
					// show the dashboard (http://user.webslide.me/dashboard)
					window.location.href=result;
				}else if(result.length){
					portal.login.notify(result.trim());
				}else{
					portal.login.notify('Sorry, request failed. Please check your credentials.');
				}
			});

			return false;
		},
		'notify':function(msg){
			var element=document.getElementById('login-notify');
			if(element){
				element.innerHTML=msg;
				return true;
			}
			return false;
		}
	},
	'listen':function(obj){
		var elements=document.getElementsByClassName(obj.getAttribute('id'));
		if(elements){
			for(var i=0;i<elements.length;i++){
				elements[i].innerHTML=obj.value;
			}
		}
	}
};

(function(){
	var element=document.getElementById('login-1');
	if(window.addEventListener){
		element.addEventListener('keyup',function(){ portal.listen(this); },true);
	}else if(window.attachEvent){
		element.attachEvent('keyup',function(){ portal.listen(this); });
	}
})();

