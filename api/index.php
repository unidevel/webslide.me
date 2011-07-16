<?php

// FIXME: This needs to be improved somehow
$domain = "ws.me";

// webslide.me API index
require_once("library.php");
$q=explode("/",$_REQUEST['q']);

// setting up objects
$dir['root']="..";
$dir['db']=$dir['root']."/database";

$db=json_decode(file_get_contents($dir['db']."/database.json"),true);

if(file_exists($q[0]."_".$q[1].".php")){
	include $q[0]."_".$q[1].".php";
}else if(file_exists($q[0].".php")){
	include $q[0].".php";
}else{
	// API plugin not found
	header('HTTP/1.0 404 Not Found');
echo "<!doctype html>
<html>
<head>
<title>webslide.me API overview</title>
<style>
body{background:#404040}
a{color:#933;text-decoration:none}
#form,#definitions{width:400px;margin:10px auto;padding:20px;background:#fff;color:#404040;border-radius:20px;-moz-border-radius:20px;-webkit-border-radius:20px}
fieldset{margin:0.5em auto;border:2px solid #c0c0c0}
label,select,input,textarea{display:block;width:49%;float:left}
input,select,textarea{border:1px solid #c0c0c0}
textarea{min-height:5em}
br{clear:both}
ul,li{margin:0;padding:0;list-style:none}
li:target{color:#933}
q{font-weight:bold}
.data-types q:before{content:'@'}
.data-types q:after{content:''}
.schemes q:before{content:'\"'}
.schemes q:after{content:'\"'}
</style>
</head>
<body>
<form id=\"form\" action=\"/api\" method=\"post\">
<fieldset>
	<legend>API Details</legend>
		<label for=\"method\">HTTP Method</label>
		<select id=\"method\">
			<option value=\"post\" selected=\"selected\">post</option>
			<option value=\"get\">get</option>
		</select>
		<br/>

		<label for=\"plugin\">Plugin</label>
		<select id=\"plugin\" onchange=\"update_form()\">
			<option value=\"\" selected=\"selected\"> - no Plugin selected - </option>
			<optgroup label=\"public\">
				<option value=\"/api/webslides\" title=\"returns a webslide list (json)\" data-input=\"acc#user\">/webslides</option>
				<option value=\"/api/feedback\" title=\"feedback procedure\" data-input=\"email#email,_textarea#idea\">/feedback</option>
			</optgroup>
			<optgroup label=\"editor (protected)\">
				<option value=\"/api/edit/open\" title=\"opens a webslide\" data-input=\"acc#user,skey#skey,filename#file,_select#type:meta|webslide\">/edit/open</option>
				<option value=\"/api/edit/save\" title=\"saves a webslide\" disabled=\"disabled\">/edit/save</option>
				<option value=\"/api/edit/remove\" title=\"removes (deletes) a webslide\" data-input=\"acc#user,skey#skey,filename#file\">/edit/remove</option>
			</optgroup>
			<optgroup label=\"control (protected)\">
				<option value=\"/api/control\" title=\"saves control data\" data-query=\"filename\" data-input=\"acc#user,skey#skey,slidescheme#active\">/control</option>
				<option value=\"/api/control/client\" title=\"gets control data\" data-query=\"filename\">/control/client</option>
			</optgroup>
		</select>
	</fieldset>
	<fieldset id=\"target\">
		Please select of the API details above.
	</fieldset>
	<input type=\"submit\" style=\"width:auto;float:right\" value=\"Submit\"/>
	<br/>
</form>
<div id=\"definitions\">
	<fieldset>
		<legend>Data Types</legend>
		<ul class=\"data-types\">
			<li id=\"whatis-acc\"><q>acc</q> (demo01) - the account, may contain lowercase letters or numbers</li>
			<li id=\"whatis-skey\"><q>skey</q> - the session key registered on the server</li>
			<li id=\"whatis-filename\"><q>filename</q> (example.html) - the filename of the webslide</li>
			<li id=\"whatis-email\"><q>email</q> (email@server.tld) - the email address</li>
		</ul>
	</fieldset>
	<fieldset>
		<legend>Schemes</legend>
		<ul class=\"schemes\">
			<li id=\"whatis-slidescheme\"><q>slide-scheme</q> (slide-1,2 / slide-end,0) - the active slide and active animation step. slide-3,2 displays the third slide and second animation step.</li>
			<li id=\"whatis-queryscheme\">
				<q>query-scheme</q> - the query scheme for the API is built as the following:
				<address>
				/api/plugin (POST)<br/>
				/api/plugin/filename.html (GET)<br/>
				/api/plugin/subroutine (POST)<br/>
				/api/plugin/subroutine/filename.html (GET)
				</address>
			</li>
		</ul>
	</fieldset>
	<br/>
	<a href=\"#form\">Top</a>

</div>
<script>
function update_form(){
	var form=document.getElementById('form');
	var target=document.getElementById('target');
	// cleanup the form
	target.innerHTML='<legend>Request Details</legend>';

	var method=document.getElementById('method');
	var _method=method.getElementsByTagName('option')[method.selectedIndex];
	form.setAttribute('method',_method.value);

	var plugin=document.getElementById('plugin');
	var _plugin=plugin.getElementsByTagName('option')[plugin.selectedIndex];
	if(_plugin.getAttribute('data-query')){
		var label=document.createElement('label');
		label.innerHTML='<a href=\"#whatis-'+_plugin.getAttribute('data-query')+'\">/'+_plugin.getAttribute('data-query')+'</a> <sup>(<a href=\"#whatis-queryscheme\">*</a>)</sup>';
		target.appendChild(label);

		var element=document.createElement('input');
		element.setAttribute('type','text');

		element.onkeyup=function(){
			var form=document.getElementById('form');
			var _plugin=plugin.getElementsByTagName('option')[plugin.selectedIndex];
			form.setAttribute('action',_plugin.value+'/'+this.value);
		};
		target.appendChild(element);
		target.appendChild(document.createElement('br'));
	}else{
		form.setAttribute('action',_plugin.value);
	}

	if(raw=_plugin.getAttribute('data-input')){
		raw=raw.split(',');
		for(i in raw){
			var x=raw[i].split('#');
			if(x[1].match('\:')){
				var _type=x[0];

				x=x[1].split(':');
				var _key=x[0];
				var _val=x[1];

			}else{
				var _type=x[0];
				var _key =x[1];
			}

			// always insert label
			var label=document.createElement('label');
			if(_type.match('_')){
				label.innerHTML=_key;
			}else{
				label.innerHTML='<a href=\"#whatis-'+_type+'\">'+_key+'</a>';
			}
			target.appendChild(label);

			// insert input fields depending on _type
			if(_type=='_select'){
				var element=document.createElement('select');
				element.setAttribute('name',_key);

				var _val=_val.split('|');
				var _tmp='';
				for(i in _val){
					_tmp+='<option value=\"'+_val[i]+'\">'+_val[i]+'</option>';
				}

				element.innerHTML=_tmp;
				delete _tmp;
			}else if(_type=='_textarea'){
				var element=document.createElement('textarea');
				element.setAttribute('name',_key);
				if(_val && _val.length){
					element.value=_val;
				}
			}else{
				var element=document.createElement('input');
				element.setAttribute('name',_key);
				element.setAttribute('type','text');
				if(_val && _val.length){
					element.value=_val;
				}
			}

			target.appendChild(element);

			// clear floating and add new line
			target.appendChild(document.createElement('br'));
		}
	}
}
</script>
</body>
</html>";
	exit;
}

?>
