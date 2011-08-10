<?php
// API -> webslides
/*
 * @user = "string"
 */

if (!empty($req['user'])) {
	
	$dir['home'] = $dir['db']."/".$req['user'];

	if (is_dir($dir['home'])) {
		$webslides = array();
		$dh = opendir($dir['home']);
		while (($file = readdir($dh)) !== false) {

			if (is_file($dir['home']."/".$file) && preg_match("~(.*)\.html~Uis",$file)) {

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

} else {
	header('HTTP/1.0 404 Not Found');
	exit;
}

?>
