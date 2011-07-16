<?php
error_reporting(E_ALL^E_NOTICE);
ini_set('display_errors','Off');
require_once("./api/library.php");

function stripit($str){
	$str=eregi_replace(" ","%20",$str);
	return $str;
}
// setting up query
$q=(!empty($_GET['q'])?$_GET['q']:'portal');
$q=explode("/",$q);

// setting up request
$req=array();
$tmp=explode(".",$_SERVER['HTTP_HOST']);
$req['user']=(($_REQUEST['user'])?$_REQUEST['user']:(($_COOKIE['user'])?$_COOKIE['user']:'demo'));
$req['skey']=(($_COOKIE['skey'])?$_COOKIE['skey']:'demo');
$req['pass']=(($_REQUEST['pass'])?$_REQUEST['pass']:'demo');

// setting up objects
$dir['root']=".";
$dir['db']=$dir['root']."/database";

$db = json_decode(file_get_contents($dir['db']."/database.json"),true);

$obj['template']=@new template('./html');

// webslide.me functionality
if($q[0]=='play' || $q[0]=='edit' || $q[0]=='control' || $q[0]=='manifest'){
	$req['file']=$q[1];

// media handler
}else{
	$req['file']=$q[2];
}

switch($q[0]){

	// load portal
	case "license":
		$obj['template']->load('license.html');
		$tpl=$obj['template']->get();
		header('Etag: '.md5($tpl));
		echo $tpl;
		exit;
	break;
	default:
	case "login":
	case "portal":
		if($q[0]=='login'){ $switch=''; }else{ $switch=' hidden'; }
		$arr=array(
			'manifest'=>'/manifest/_.manifest',
			'switch' => $switch
		);

		$obj['template']->load('portal.html');
		$obj['template']->replace($arr);
		$tpl=$obj['template']->get();
		header('Etag: '.md5($tpl));
		echo $tpl;
		exit;
	break;
	case "tour":
		$obj['template']->load('tour.html');
		$obj['template']->replace(array('manifest'=>'/manifest/_.manifest'));
		$tpl=$obj['template']->get();
		header('Etag: '.md5($tpl));
		echo $tpl;
		exit;
	break;

	// load the control
	case "control":
		if(
			!empty($db['skeys'][$req['skey']])
			&& $req['user']!='demo' // forbid demo user
			&& $db['skeys'][$req['skey']]['user']===$req['user']
			&& (
				(!empty($db['skeys'][$req['skey']]['timestamp']) && $db['skeys'][$req['skey']]['timestamp']<(date('U')+60*60*24))
				|| !isset($db['skeys'][$req['skey']]['timestamp'])
			)
		){
			$obj['template']->load('control.html');
			$tpl=$obj['template']->get();

			header('Etag: '.md5($tpl));
			echo $tpl;
		}else{
			header('Location: /login');
			exit;
		}
	break;

	// load the dashboard
	case "dashboard":
		if(
			!empty($db['skeys'][$req['skey']])
			&& $db['skeys'][$req['skey']]['user']===$req['user']
			&& (
				(!empty($db['skeys'][$req['skey']]['timestamp']) && $db['skeys'][$req['skey']]['timestamp']<(date('U')+60*60*24))
				|| !isset($db['skeys'][$req['skey']]['timestamp'])
			)
		){
			$dir['home']=$dir['db']."/".$req['user'];
			$webslides=array();
			if(is_dir($dir['home'])){
				$dh=opendir($dir['home']);
				while(($file=readdir($dh))!==false){
					if(
						is_file($dir['home']."/".$file)
						&& preg_match("~\.html~Uis",$file)
					){
						$webslides[]=$dir['home']."/".$file;
					}
				}
				closedir($dh);
			}
			@natsort($webslides);
	
			$dashboard=array();
			$dashboard['user']=$req['user'];

			$i=1;
			foreach($webslides as $key => $url){
				$tmp=array();
				$tmp['json']=eregi_replace(".html",".json",$url);
	
				if(file_exists($tmp['json'])){
					$json=json_decode(file_get_contents($tmp['json']),true);
				}else{
					$json=array('title','description','author','copyright');
				}
	
				$tmp=array(
					'title' => (($json['title'])?$json['title']:'No title'),
					'description' => (($json['description'])?$json['description']:'No description'),
					'theme' => (($json['theme'])?" ".eregi_replace("theme-","",eregi_replace(".css","",$json['theme'])):' white')
					//'author' => (($json['author'])?$json['author']:'No author'),
					//'copyright' => (($json['copyright'])?$json['copyright']:'No copyright')
				);

				$dashboard['items'].="
<div class=\"themes-preview".$tmp['theme']."\">
	<h4>".$tmp['title']."</h4>
	<p>".$tmp['description']."</p>
	<div class=\"webslide-actions\">
		<a class=\"button\" href=\"/play/".basename($url)."\">Play</a>
		<a class=\"button\" href=\"/edit/#!".basename($url)."\">Edit</a>
	</div>
</div>";
				$i++;
				unset($tmp);
			}
			if(empty($dashboard['items'])){
				$dashboard['items']="<h3>Start with <a href=\"/edit/\">creating a webslide</a>.</h3><p>Questions? Have a look at <a href=\"/tour\">the Tour</a>.</p>";
			}
			$arr=array(
				'dashboard' => $dashboard,
				'manifest'=>'/manifest/_.manifest'
			);

			$obj['template']->load('dashboard.html');
			$obj['template']->replace($arr);
			header('Etag: '.md5($tpl));
			echo $obj['template']->get();
		}else{
			header('Location: /login');
			exit;
		}
	break;

	// load webslide editor
	case "edit":
		$arr=array('manifest'=>"/manifest/_.manifest");
		$obj['template']->load('edit.html');
		$obj['template']->replace($arr);
		$tpl=$obj['template']->get();

		header('Etag: '.md5($tpl));
		echo $tpl;
		exit;
	break;

	// load webslide player
	case "play":
		$dir['home']=$dir['db']."/".$req['user'];
		$webslide['ctrl']=$dir['home']."/".$req['file'].".ctrl";
		$webslide['html']=$dir['home']."/".$req['file'].".html";
		$webslide['json']=$dir['home']."/".$req['file'].".json";

		// extract meta
		if(file_exists($webslide['json'])){
			$meta=json_decode(file_get_contents($webslide['json']),true);
		}else{
			$meta=array(
				'title'=>'No Title','author'=>'webslide.me','description'=>'No description','keywords'=>'','copyright'=>date('Y').' by webslide.me',
				'theme'=>'theme-blue.css'
			);
		}

		// extract webslide
		if(file_exists($webslide['html'])){
			$_webslide=file_get_contents($webslide['html']);
		}else{
			$_webslide="<section><h1>Not found</h1><p>We are sorry, but this webslide was deleted by the author meanwhile.</p></section>";
		}

		// check control status
		if(file_exists($webslide['ctrl'])){
			$control='var control = confirm(\'There\\\'s a presentation running!\n\nClick OK to activate remote control - slides will then be automatically updated by the presenter.\');';
		}else{
			$control='var control = false;';
		}

		$arr=array(
			'manifest'=>"/manifest/".$req['file'].".manifest",
			'meta'=>$meta,
			'webslide'=>$_webslide,
			'player'=>array('control'=>$control)
		);

		$obj['template']->load('play.html');
		$obj['template']->replace($arr);
		$tpl=$obj['template']->get();

		header('Etag: '.md5($tpl));
		echo $tpl;
		exit;
	break;

	case "manifest":
		$dir['home']=$dir['db']."/".$req['user'];

		$manifest=@new manifest('.'); // current directory, alternative: ../test

		// required for all
		$manifest->add('/css/library.css','cache');
		$manifest->add('/js/library.js','cache');
		$manifest->add('/js/fixes.js','cache');

		// required for editor
		$manifest->add('/css/edit.css','cache');
		$manifest->add('/js/editor.js','cache');
		$manifest->add('/css/spritemap.png','cache');

		// required for player || editor
		$manifest->add('/css/play.css','cache');
		$manifest->add('/js/player.js','cache');
		$manifest->add('/css/play-animations.css','cache');
		$manifest->add('/css/theme-basic.css','cache');

		// required themes for player || editor
		$manifest->add('/css/theme-blue.css','cache');
		$manifest->add('/css/theme-brown.css','cache');
		$manifest->add('/css/theme-white.css','cache');

		// network connection required for api && control
		$manifest->add('/api/*','network');
		$manifest->add('/control/*','network');

		// TODO: fix problem with /edit/ being cached false way. Maybe like the following?
		/*
		$manifest->add('/edit/*','network');
		$manifest->add('/play/*','network');
		*/

		// everything else (e.g. images, videos)
		$manifest->add('*','fallback');

		// required for portal
		/*
		$manifest->add('/css/portal.css','cache');
		$manifest->add('/js/portal.min.js','cache');
		$manifest->add('/css/portal.png','cache');
		$manifest->add('/css/social.png','cache');
		$manifest->add('/css/browsers.png','cache');
		*/

		header('Content-Type: text/cache-manifest');
		echo $manifest->get();
		exit;
	break;

	// load media handler
	case "media":
		if($q[1]=="css" || $q[1]=="js"){
			$req['url']=$q[1]."/".$q[2];
			if(file_exists($req['url'])){
				$info=pathinfo($req['url']);
				switch($info['extension']){
					case "css": $content_type="text/css"; break;
					case "jpg": case "jpeg": $content_type="image/jpeg"; break;
					case "js": $content_type="text/javascript"; break;
					case "png": $content_type="image/png"; break;
				}

				if($cache=file_get_contents($req['url'])){
					header('HTTP/1.0 200 OK');
					header('Content-Type: '.$content_type);
					header('Etag: '.md5($cache));
					header('Expires: '.gmdate('D, d M Y H:i:s', (time()+60*60*24*7)).' GMT');
					header('Vary: User-Agent,Accept-Encoding');

					if(strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'x-gzip') !== false){
						header('Content-Encoding: x-gzip');
						ob_start('ob_gzhandler');
					}elseif(strpos($_SERVER['HTTP_ACCEPT_ENCODING'],'gzip') !== false){
						header('Content-Encoding: gzip');
						ob_start('ob_gzhandler');
					}

					// Content Length at end, because of gzcompress minimized cache =)
					#header('Content-Length: '.strlen($cache));
					echo $cache;
				}else{
					header('HTTP/1.0 404 Not Found');
				}
			}else{
				header('HTTP/1.0 404 Not Found');
			}
			exit;

		}elseif($q[1]=="img"){
			$dir['home']=$dir['db']."/".$req['user'];
			$req['url']=$dir['home']."/".$req['file'];

			if(file_exists($req['url'])){
				$info=pathinfo($q[1]."/".$q[2]);
				switch($info['extension']){
					case "jpg": case "jpeg": $content_type="image/jpeg"; break;
					case "png": $content_type="image/png"; break;
				}

				if($cache=file_get_contents($req['url'])){
					header('HTTP/1.0 200 OK');
					header('Content-Type: '.$content_type);
					header('Etag: '.md5($cache));
					header('Expires: '.gmdate('D, d M Y H:i:s', (time()+60*60*24*7)).' GMT');
					header('Vary: User-Agent,Accept-Encoding');

					if(strpos($_SERVER['HTTP_ACCEPT_ENCODING'], 'x-gzip') !== false){
						header('Content-Encoding: x-gzip');
						ob_start('ob_gzhandler');
					}elseif(strpos($_SERVER['HTTP_ACCEPT_ENCODING'],'gzip') !== false){
						header('Content-Encoding: gzip');
						ob_start('ob_gzhandler');
					}

					// Content Length at end, because of gzcompress minimized cache =)
					#header('Content-Length: '.strlen($cache));
					echo $cache;
				}else{
					header('HTTP/1.0 404 Not Found');
				}
			}else{
				header('HTTP/1.0 404 Not Found');
			}
			exit;
		}
	break;
}

?>
