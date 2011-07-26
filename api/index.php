<?php

// FIXME: This needs to be improved somehow
$domain = "webslide.me";

// webslide.me API index
require_once("library.php");
$q=explode("/",$_REQUEST['q']);

// setting up objects
$dir['root']="..";
$dir['db']=$dir['root']."/database";

$db=json_decode(file_get_contents($dir['db']."/database.json"),true);

if(file_exists($q[0]."_".$q[1].".php")){
	include $q[0]."_".$q[1].".php";
}else if(file_exists($q[0].".php")){
	include $q[0].".php";
}else{
	// API plugin not found
	header('HTTP/1.0 404 Not Found');
	echo file_get_contents('api_overview.html');
	exit;
}

?>
