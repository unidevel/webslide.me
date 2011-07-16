<?php
// API -> feedback
/*
 * @email = "string"
 * @idea = "string"
 * @user = "string"
 * @skey = "string"
 */
if(!empty($_POST)){
	foreach($_POST as $key => $val){
		$req[$key]=$val;
	}
}else{
	//return false; // return to api index
}

// user && skey is required!
if(empty($req['user']) || empty($req['skey'])){ exit; }

if(
	!empty($db['skeys'][$req['skey']])
	&& $db['skeys'][$req['skey']]['user']===$req['user']
	&&
	(
		(!empty($db['skeys'][$req['skey']]['timestamp']) && $db['skeys'][$req['skey']]['timestamp']<(date('U')+60*60*24))
		|| !isset($db['skeys'][$req['skey']]['timestamp'])
	)
){
	if(!empty($req['idea'])){
		$message = trim("
user: ".$req['user']."
skey: ".$req['skey']."
email: ".$req['email']."
time: ".date('d.m.Y H:i:s')."

(skey started at: ".date('d.m.Y H:i:s',$db['skeys'][$req['skey']]['timestamp']).")

message:
<<<
".trim($req['idea'])."
>>>");

		$boundary = "\n--".md5(strlen($message).phpversion())."--\n";

		$message=$boundary.$message.$boundary;

		$fh=fopen($dir['db'].'/feedback.txt','a+');
		fwrite($fh,$message);
		fclose($fh);

		header('HTTP/1.0 200 OK');
		exit;
	}
}else{
	header('HTTP/1.0 403 Forbidden');
	exit;
}

?>
