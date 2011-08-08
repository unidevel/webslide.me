<?php
// API -> control
/*
 * @user = "string"
 * @skey = "string"
 * @active = slide-(int),(int)
 * (e.g. slide-1,2 for 1st slide with 2nd step)
 */


// Deny hacker attacks on demo user =/
if($req['user']=='demo'){
	header('HTTP/1.0 403 Forbidden');
	echo "User \"demo\" not allowed to login.";
	exit;
}

if(
    $api['valid_session'] && !empty($q[1])
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
