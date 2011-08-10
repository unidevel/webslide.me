<?php
// API -> edit/save
/*
 * @file = filename.html
 * @download = yes|no
 * @meta = {json}
 * @user = "string"
 * @skey = "string"
 * @blob = <html> -> can be post or blob data
 */


if ($_FILES['blob']) {
	$req['webslide'] = file_get_contents($_FILES['blob']['tmp_name']);
} else {
	$req['webslide'] = $req['blob'];
}

if (
	$api['valid_session'] && !in_array(basename($req['file']), $db['protected'])
){

	if (!empty($req['webslide'])) {

		$dir['home'] = $dir['db']."/".$req['user'];
		$req['file'] = strtolower($req['file']);
		$webslide['html'] = $dir['home']."/".$req['file']; // transferred with .html
		$webslide['json'] = $dir['home']."/".eregi_replace(".html",".json",$req['file']);

		if (!is_dir(dirname($webslide['html']))) {
			// 1=x, 2=w, 4=r
			@mkdir(dirname($webslide['html']),0775);
		}

		$meta = json_decode($req['meta'], true);
		foreach ($meta as $key => $val) {
			if ($key!='theme') {
				if (empty($val)) {
					$meta[$key] = 'No '.$key;
				}
			}
		}
		$req['meta'] = json_encode($meta, true);


		if (
			file_put_contents($webslide['html'], $req['webslide'])
			&& file_put_contents($webslide['json'], $req['meta'])
		){
			header('HTTP/1.0 200 OK');
			// only echo filename if download is disabled
			if ($req['download'] !== 'yes') {
				echo basename($webslide['html']);
				exit;
			} else { // reroute to download site
				//header("Location: http://".$req['user'].".webslide.me/api/download/".basename($webslide['html']));
				echo "http://".$req['user'].".".$domain."/api/download/".basename($webslide['html']);
				exit;
			}
		} else {
			header('HTTP/1.0 500 Internal Server Error');
			echo "Something went wrong while storing the file to the database.";
			exit;
		}
	}
} else {
	header('HTTP/1.0 403 Forbidden');
	exit;
}

?>
