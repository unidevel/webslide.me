<?php
// API -> edit/remove
/*
 * @file = filename.html
 * @user = "string"
 * @skey = "string"
 */
if(!empty($_POST)){
	foreach($_POST as $key => $val){
		$req[$key]=$val;
	}
}else{
	#return false; // return to api index
}

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
	$webslide['html']=$dir['home']."/".$req['file']; // transferred with .html
	$webslide['json']=$dir['home']."/".eregi_replace(".html",".json",$req['file']);

	if(
		file_exists($webslide['html'])
		&& file_exists($webslide['json'])
		&& !in_array(basename($webslide['html']),$db['protected'])
	){
		if(unlink($webslide['html']) && unlink($webslide['json'])){
			header('HTTP/1.0 200 OK');
			exit;
		}else{
			header('HTTP/1.0 500 Internal Server Error');
			exit;
		}
	}else if(
		in_array(basename($webslide['html']),$db['protected'])
		|| in_array(basename($webslide['json']),$db['protected'])
	){
		header('HTTP/1.0 403 Forbidden');
		exit;
	}else{
		header('HTTP/1.0 404 Not Found');
		exit;
	}
}else{
	header('HTTP/1.0 403 Forbidden');
	exit;
}

?>
