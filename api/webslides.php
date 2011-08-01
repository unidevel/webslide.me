<?php
// API -> webslides
/*
 * @user = "string"
 */
if(!empty($_POST)){
	foreach($_POST as $key => $val){
		$req[$key]=$val;
	}
}

$tmp=explode(".",$_SERVER['HTTP_HOST']);
$req['user']=(($_REQUEST['user'])?$_REQUEST['user']:(($tmp[0]!='webslide' && $tmp[0]!='www')?$tmp[0]:(($_COOKIE['user'])?$_COOKIE['user']:'demo')));

if(!empty($req['user'])){
	$dir['home']=$dir['db']."/".$req['user'];

	if(is_dir($dir['home'])){
		$webslides=array();
		$dh=opendir($dir['home']);
		while(($file=readdir($dh))!==false){
			if(is_file($dir['home']."/".$file) && preg_match("~(.*)\.html~Uis",$file)){
				$meta=json_decode(file_get_contents($dir['home']."/".eregi_replace(".html",".json",$file)),true);

				$webslides[]=array(
					'file' => $file,
					'title' => $meta['title'],
					'description' => $meta['description'],
					'theme' => $meta['theme']
				);
			}
		}
	}

	header('HTTP/1.0 200 OK');
	echo json_encode($webslides);
	exit;
}else{
	header('HTTP/1.0 404 Not Found');
	exit;
}

?>
