<?php
// API -> control
/*
 * No parameters needed.
 */
if(!empty($_POST)){
	foreach($_POST as $key => $val){
		$req[$key]=$val;
	}
}else{
	#return false; // return to api index
}
if(empty($req['user'])){
	$test=explode(".",$_SERVER['HTTP_HOST']);
	$req['user']=$test[0];
}
$webslide['ctrl']=$dir['db']."/".$req['user']."/".$q[2].".ctrl";

if(file_exists($webslide['ctrl'])){
	header('HTTP/1.0 200 OK');
	echo file_get_contents($webslide['ctrl']);
	exit;
}else{
	header('HTTP/1.0 404 Not Found');
	exit;
}

// not exited before, something is wrong =/
header('HTTP/1.0 500 Internal Server Error');
exit;
?>
