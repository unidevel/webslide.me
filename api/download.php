<?php
// API -> download/filename.html
$req=array();
$tmp=explode(".",$_SERVER['HTTP_HOST']);
$req['user']=(($_REQUEST['user'])?$_REQUEST['user']:(($tmp[0]!='webslide' && $tmp[0]!='www')?$tmp[0]:(($_COOKIE['user'])?$_COOKIE['user']:'demo')));
$req['skey']=(($_COOKIE['skey'])?$_COOKIE['skey']:'demo');
$req['pass']=(($_REQUEST['pass'])?$_REQUEST['pass']:'demo');
$req['file']=((!empty($q[1]))?$q[1]:false);

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
	$webslide['html']=$dir['home']."/".$req['file'].".html"; // transferred with .html
	$webslide['json']=$dir['home']."/".$req['file'].".json";

	if(file_exists($webslide['html']) && file_exists($webslide['json'])){
		$_meta=json_decode(file_get_contents($webslide['json']),true);
		$_webslide=file_get_contents($webslide['html']);

		$obj['template']=@new template("../html");
		$obj['template']->load("play_offline.html");

		if(file_exists('../css/'.$_meta['theme'])){
			$_theme=file_get_contents('../css/'.$_meta['theme']);
		}else{
			$_theme=file_get_contents('../css/theme-blue.css');
		}

		// compress $_theme
		$_theme=eregi_replace("\n","",$_theme);
		$_theme=eregi_replace("\t","",$_theme);
		$_theme=preg_replace("~\/\*(.*)\*\/~Uis","",$_theme);
		$_theme=eregi_replace("}","}\n",$_theme);
		$_theme=eregi_replace(", ",",",$_theme);
		$_theme=eregi_replace(";}","}",$_theme);

		$arr=array(
			'meta' => $_meta,
			'webslide' => $_webslide,
			'player' => array('theme' => $_theme)
		);

		$obj['template']->replace($arr);
		$tpl=$obj['template']->get();

		header('HTTP/1.0 200 OK');
		header('Content-Disposition: attachment; filename="'.$req['file'].' (webslide.me).html"');
		header('Content-Type: text/html; charset=UTF-8');

		echo $tpl;
		exit;
	}else{
		header('HTTP/1.0 500 Internal Server Error');
		exit;
	}
}else{
	header('HTTP/1.0 403 Forbidden');
	exit;
}

?>
