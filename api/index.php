<?php

// FIXME: This needs to be improved somehow
$domain = "webslide.me";

// webslide.me API index
require_once("library.php");
$q = explode("/",$_REQUEST['q']);

// setting up objects
$dir['root'] = "..";
$dir['db'] = $dir['root']."/database";

$db = json_decode(file_get_contents($dir['db']."/database.json"),true);


if (!empty($_POST)) {
	foreach($_POST as $key => $val) {
		$req[$key] = $val;
	}
}

if (!$req['user']) {
	$req['user'] = 'demo';
	$req['skey'] = 'demo';
}


// Faster access for API plugins to determine if there's a valid session
if(
	!empty($db['skeys'][$req['skey']])
	&& $db['skeys'][$req['skey']]['user'] == $req['user']
	&& (
		(!empty($db['skeys'][$req['skey']]['timestamp']) && $db['skeys'][$req['skey']]['timestamp'] < date('U' + 60*60*24))
		|| !isset($db['skeys'][$req['skey']]['timestamp'])
	)
) {
	$api['valid_session'] = true;
} else {
	$api['valid_session'] = false;
}


if (file_exists($q[0]."_".$q[1].".php")) {

	include $q[0]."_".$q[1].".php";

} else if (file_exists($q[0].".php")) {

	include $q[0].".php";

} else if (strlen($q[0])) {

	echo "\$req\n";
	var_dump($req);

	echo "\n\n\n\$_POST\n";
	var_dump($_POST);

	var_dump($_FILES);

} else {

	// API plugin not found
	// header('HTTP/1.0 404 Not Found');
	echo file_get_contents('api_overview.html');
	exit;

}

?>
