<?php
// API -> control
/*
 * @user = "string"
 * @skey = "string"
 * @active = slide-(int),(int)
 * (e.g. slide-1,2 for 1st slide with 2nd step)
 */
if(!empty($_POST)){
	foreach($_POST as $key => $val){
		$req[$key]=$val;
	}
}else{
	#return false; // return to api index
}

// Deny hacker attacks on demo user =/
if($req['user']=='demo'){
	header('HTTP/1.0 403 Forbidden');
	echo "User \"demo\" not allowed to login.";
	exit;
}

if(
	!empty($db['skeys'][$req['skey']])
	&& $db['skeys'][$req['skey']]['user']===$req['user']
	&&
	(
		(!empty($db['skeys'][$req['skey']]['timestamp']) && $db['skeys'][$req['skey']]['timestamp']<(date('U')+60*60*24))
		|| !isset($db['skeys'][$req['skey']]['timestamp'])
	)
	&& !empty($q[1])
){
	$dir['home']=$dir['db']."/".$req['user'];
	$webslide['ctrl']=$dir['home']."/".$q[1].".ctrl";
	$test=explode(",",$req['active']);

	if(
		$test[0]!='slide-end'
		&& file_put_contents($webslide['ctrl'],$req['active'])
	){
		header('HTTP/1.0 200 OK');
		echo "OK";
		exit;
	}elseif($test[0]=='slide-end'){
		if(unlink($webslide['ctrl'])){
			header('HTTP/1.0 200 OK');
			echo "END";
			exit;
		}
	}
}else{
	header('HTTP/1.0 403 Forbidden');
	exit;
}

// not exited before, something is wrong =/
header('HTTP/1.0 500 Internal Server Error');
exit;
?>
