<?php

class database{
	var $db;
	var $path;
	var $tmp;

	public function __construct($path){
		if(is_file($path)){
			$arr=json_decode(file_get_contents($path),true);
			if(is_array($arr)){
				$this->db=$arr;
				$this->path=$path;
				return true;
			}
		}
		return false;
	}

	public function create($user,$details){
		$user=strtolower($user);
		$db=$this->db;
		if(empty($db['users'][$user]) && is_array($details)){
			$db['users'][$user]=$details;
			$this->db=$db;
			if($this->save()){
				return true;
			}
		}
		return false;
	}

	public function login($user,$lifetime=false){
		$user=strtolower($user);
		if(!$lifetime){ $lifetime=time()+3600; }

		$db=$this->db;
		if(!empty($db['users'][$user])){
			$found=false;
			foreach($db['skeys'] as $key => $details){
				if($details['user']===$user){
					$found=$key;
				}
			}
			if($found){
				unset($this->db['skeys'][$found]);
			}

			do{
				$this->gen_skey();
			}while(
				isset($this->db['skeys'][$this->key])
			);

			$this->db['skeys'][$this->key]=array(
				'user' => strtolower($user),
				'timestamp' => $lifetime
			);

			if($this->save()){
				return array(
					'skey' => $this->key,
					'timestamp' => $lifetime
				);
			}
		}
		return false;
	}

	private function gen_skey(){
		// No false friends (I,1,O,0,o,S,5)
		$charlist="ABCDEFGHJKLMNPQRTUVWabcdefghjklmnpqrstuv2346789";
		$key="";
		for($i=0;$i<=10;$i++){
			$key.=$charlist[rand(0,strlen($charlist))];
		}
		if(!empty($key)){
			$this->key=$key;
		}

		return true;
	}

	private function save($path=false){
		if(!$path){
			$path=$this->path;
		}
		if(is_file($path)){
			$json = json_encode($this->db);
			return file_put_contents($path, $json);
		}
		return false;
	}
}

class template{
	var $path;
	var $prefix='{{';
	var $suffix='}}';

	public function __construct($path=false){
		$this->path=(is_dir($path)?$path:"./html");
	}

	public function load($file=false){
		if(
			$file && is_dir($this->path)
			&& file_exists($this->path."/".$file)
		){
			$this->cache=file_get_contents($this->path."/".$file);
		}
	}

	public function replace($arr=false,$ret=false){
		if(is_array($arr)){
			foreach($arr as $key=>$val){
				if(is_array($val)){
					foreach($val as $skey=>$sval){
						// replace {{meta:data}} with given value of $arr[meta][data]
						$this->cache=preg_replace("~".$this->prefix.$key.":".$skey.$this->suffix."~Uis",$sval,$this->cache);
					}
				}else{
					// replace {{key}} with given value of $arr[key]
					$this->cache=preg_replace("~".$this->prefix.$key.$this->suffix."~Uis",$val,$this->cache);
				}
			}
			return (($ret)?$this->cache:true);
		}
		return false;
	}

	public function get(){
		return (!empty($this->cache)?$this->cache:false);
	}
}

class manifest{
	var $_dir; // needed for file_exists() later

	var $_cache;
	var $_fallback;
	var $_network;

	var $cache='';

	public function __construct($dir=false){
		if(is_dir($dir)){
			$this->_dir=$dir;
		}

		return false;
	}

	public function add($file,$section='cache'){
		if(!empty($file)){
			switch($section){
				case 'cache': $this->_cache[]=$file; break;
				case 'fallback': $this->_fallback[]=$file; break;
				case 'network': $this->_network[]=$file; break;
				default: return false; break;
			}
			return true;
		}
		return false;
	}

	public function build(){
		if(
			is_array($this->_cache)
			|| is_array($this->_fallback)
			|| is_array($this->_network)
		){
			$this->cache="CACHE MANIFEST\n";
			if(is_array($this->_cache)){
				$this->cache.="\nCACHE:\n";
				foreach($this->_cache as $key => $val){
					$this->cache.=$val."\n";
				}
			}

			if(is_array($this->_network)){
				$this->cache.="\nNETWORK:\n";
				foreach($this->_network as $key => $val){
					$this->cache.=$val."\n";
				}
			}

			// fallback has to be listed at least due to browser bugs.
			if(is_array($this->_fallback)){
				$this->cache.="\nFALLBACK:\n";
				foreach($this->_fallback as $key => $val){
					$this->cache.=$val."\n";
				}
			}

			return $this->cache;
		}

		return false;
	}

	public function get(){
		if($this->build()){
			return $this->cache;
		}
		return false;
	}
}
?>
