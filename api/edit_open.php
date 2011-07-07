<?php
// API -> edit/open

/*
 * @file = filename.html
 * @user = "string"
 * @skey = "string"
 * @type = meta || webslide
 */
if(!empty($_POST)){
	foreach($_POST as $key => $val){
		$req[$key]=$val;
	}
}else{
	//return false; // return to api index
}

// fallback to demo user
if(empty($req['user'])){ $req['user']='demo'; }
if(empty($req['skey'])){ $req['skey']='demo'; }

if(
	!empty($db['skeys'][$req['skey']])
	&& $db['skeys'][$req['skey']]['user']===$req['user']
	&&
	(
		(!empty($db['skeys'][$req['skey']]['timestamp']) && $db['skeys'][$req['skey']]['timestamp']<(date('U')+60*60*24))
		|| !isset($db['skeys'][$req['skey']]['timestamp'])
	)
){

	$dir['home']=$dir['db']."/".$req['user'];
	$req['file']=strtolower($req['file']);
	$webslide['html']=$dir['home']."/".$req['file']; // transferred with .html
	$webslide['json']=$dir['home']."/".eregi_replace(".html",".json",$req['file']);

	if(
		$req['type']=='meta' && is_file($webslide['json'])
		&& $cache=file_get_contents($webslide['json'])
	){
		// return (json) meta data
		header('HTTP/1.0 200 OK');
		echo $cache;
		exit;
	}elseif(
		$req['type']=='webslide' && is_file($webslide['html'])
		&& $cache=file_get_contents($webslide['html'])
	){
		// return webslide
		header('HTTP/1.0 200 OK');
		echo $cache;
		exit;
	}

	header('HTTP/1.0 500 Internal Server Error');
	exit;
}else{
	header('HTTP/1.0 403 Forbidden');
	exit;
}

?>
