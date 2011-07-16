<?php
// API -> login
/*
 * @user = "string"
 * @pass = "string"
 */
if(!empty($_POST)){
	foreach($_POST as $key => $val){
		$req[$key]=trim($val);
	}
}else{
	#return false; // return to api index
}

require_once("library.php");
$obj['database']=@new database("../database/database.json");
$db = $obj['database']->db;

// API Tests
// $req['user']='christoph';
// $req['pass']='mypassword123';

// Deny hacker attacks on demo user =/
if($req['user']=='demo'){
	header('HTTP/1.0 403 Forbidden');
	echo "User \"demo\" not allowed to login.";
	exit;
}

// Login a known user
if(
	$req['create_login']!='yes'
	&& !empty($db['users'][$req['user']])
	&& !empty($db['users'][$req['user']]['password'])
	&& $db['users'][$req['user']]['password']===$req['pass']
){
	if($return=$obj['database']->login($req['user'])){
		header('HTTP/1.0 200 OK');
		setcookie("skey", $return['skey'],$return['timestamp'],"/",".".$domain);
		setcookie("user", $req['user'],$return['timestamp'],"/",".".$domain);

		$host = $_SERVER['HTTP_HOST'];

		// show the dashboard link
		echo "http://".$req['user'].".".$domain."/dashboard";
		exit;
	}

// Login failed, password is false
}else if($req['create_login']!='yes'){
	header('HTTP/1.0 403 Forbidden');
	echo "Invalid login credentials.";
	exit;

// Register a new user
}else if(
	$req['create_login']=='yes'
	&& empty($db['users'][$req['user']])
	&& !empty($req['user']) && preg_match("/^([0-9a-z]{4,20})$/",$req['user'])
	&& !empty($req['email']) // TODO: check valid email
	&& !empty($req['pass']) && strlen($req['pass'])>7
){
	if($obj['database']->create($req['user'],array(
		'name' => 'John Doe',
		'email' => $req['email'],
		'password' => $req['pass']
	))){

		if($return=$obj['database']->login($req['user'])){
			header('HTTP/1.0 200 OK');
			setcookie("skey", $return['skey'],$return['timestamp'],"/",".".$domain);
			setcookie("user", $req['user'],$return['timestamp'],"/",".".$domain);
			// show the dashboard link
			echo "http://".$req['user'].".".$domain."/dashboard";
			exit;
		}
	}

	// Something went wrong...
	header('HTTP/1.0 500 Internal Server Error');
	exit;

// User not valid
}else if(!preg_match("/^([0-9a-z]{4,20})$/",$req['user'])){
	header('HTTP/1.0 403 Forbidden');
	echo "Your Account:<ul><li>may contain numbers (0-9) or lowercase characters (a-z)</li><li>has to be at least 4 characters long</li></ul>";
	exit;

// E-Mail not valid
}else if(empty($req['email'])){
	header('HTTP/1.0 403 Forbidden');
	echo "Please enter a valid e-mail address to reset your password later.";
	exit;

// Password not valid
}else if(empty($req['pass']) || strlen($req['pass'])<=7){
	header('HTTP/1.0 403 Forbidden');
	echo "Your password should be at least 8 characters long.";
	exit;

// Cancel registration process, user already exists
}else{
	header('HTTP/1.0 403 Forbidden');
	echo "Account \"".$req['user']."\" already exists.";
	exit;
}

?>
