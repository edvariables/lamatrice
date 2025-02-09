<?php
// migration-php8.php



function check_path( $dir, $level = 0 ){
	$cdir = scandir($dir);

	foreach ($cdir as $key => $file){
		if (!in_array($file, array(".",".."))){
			if (is_dir($dir . DIRECTORY_SEPARATOR . $file)){
				if( $level > 200) continue;
				check_path( $dir . DIRECTORY_SEPARATOR . $file, $level + 1);
			}
			else {
				$ext = pathinfo( $file, PATHINFO_EXTENSION );
				if( $ext === 'php' )
					check_file( $dir . '/' . $file );
			} 
		}
	}
	
}
function check_file( $file ){
	$header = false;
	$content = file_get_contents( $file );
	$matches = [];
	if( preg_match_all('/\sclass\s+(\w+)\s*/', $content, $matches) ){
		// var_dump($matches);
		foreach($matches[1] as $index => $class){
			$constructor = [];
			if( preg_match( '/function\s+'.$class.'\s*\(/', $content, $constructor ) ){
				if( ! $header ){
					echo sprintf('<br><a href="%s">%s</a>', $file, $file);
					$header = true;
				}
				echo sprintf('<br><b>Classe %s</b>', $class);
				
				$content = str_replace($constructor[0], 'function __construct(', $content);
				// die( '<textarea cols="400" rows="100">'.$content.'</textarea>');
				file_put_contents( $file, $content );
				// die();
				flush();
			}
		}
	}
}

check_path( dirname(__FILE__) );
// check_path( 'C:\Arbeit\www\lamatrice\include\Webservices' );

?>