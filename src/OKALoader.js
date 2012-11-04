/**
 * @author ant-lafarge / http://ant.lafarge.free.fr/
 */

THREE.OKALoader = function ( showStatus ) {

	THREE.Loader.call( this, showStatus );

};

THREE.OKALoader.prototype = Object.create( THREE.Loader.prototype );

THREE.OKALoader.prototype.load = function ( url, callback ) {

	var scope = this;

	this.onLoadStart();
	this.loadAjaxJSON( this, url, callback );

};

THREE.OKALoader.prototype.loadAjaxJSON = function ( context, url, callback, callbackProgress ) {

	var xhr = new XMLHttpRequest();

	var length = 0;
	
	var filename = url.split('/').pop().split('.')[0];

	xhr.onreadystatechange = function () {

		if ( xhr.readyState === xhr.DONE ) {

			if ( xhr.status === 200 || xhr.status === 0 ) {

				if ( xhr.responseText ) {
				
					var parser = new DOMParser();
					var xml = parser.parseFromString( xhr.responseText, "text/xml" );
					context.createAnimation( xml, filename, callback );

				} else {

					console.warn( "THREE.OKALoader: [" + url + "] seems to be unreachable or file there is empty" );

				}

				// in context of more complex asset initialization
				// do not block on single failed file
				// maybe should go even one more level up

				context.onLoadComplete();

			} else {

				console.error( "THREE.OKALoader: Couldn't load [" + url + "] [" + xhr.status + "]" );

			}

		} else if ( xhr.readyState === xhr.LOADING ) {

			if ( callbackProgress ) {

				if ( length === 0 ) {

					length = xhr.getResponseHeader( "Content-Length" );

				}

				callbackProgress( { total: length, loaded: xhr.responseText.length } );

			}

		} else if ( xhr.readyState === xhr.HEADERS_RECEIVED ) {

			length = xhr.getResponseHeader( "Content-Length" );

		}

	};

	xhr.open( "GET", url, true );
	xhr.send( null );

};

THREE.OKALoader.prototype.createAnimation = function ( xml, animName, callback ) {

	var anim = {};
	
	anim.name = animName;
	var xmlKeyFrameList = xml.querySelector( "KeyFrameList" );
	var tick = parseFloat( xmlKeyFrameList.getAttribute( "Tick" ) );
	if ( ! tick )
		tick = parseFloat( xmlKeyFrameList.getAttribute( "FrameTime" ) );
	var keyCount = parseFloat( xmlKeyFrameList.getAttribute( "KeyCount" ) );
	anim.length = keyCount * tick / 1000;
	anim.fps = keyCount / anim.length;
	anim.hierarchy = [];
	
	var xmlBoneList = xml.querySelector( "BoneList" );
	var xmlBones = xmlBoneList.querySelectorAll( "Bone" );
	for ( var i=0 ; i < xmlBones.length ; i++ )
	{
		var xmlBone = xmlBones[i];
		var bone = {};
		bone.name = xmlBone.getAttribute( "Name" );
		bone.parent = getBoneIdFromName( xmlBone.getAttribute( "Parent" ) );
		bone.keys = [];
		var xmlKeys = xmlBone.querySelectorAll( "Key" );
		for ( var j=0 ; j < xmlKeys.length ; j++ )
		{
			var xmlKey = xmlKeys[j];
			var key = {};
			key.index = bone.keys.length;
			key.time = parseFloat( xmlKey.getAttribute( "Time" ) ) * tick / 1000;
			var tra = xmlKey.getAttribute( "Translation" ).split(' ');
			key.pos = [ parseFloat(tra[0]), parseFloat(tra[1]), parseFloat(tra[2]) ];
			var rot = xmlKey.getAttribute( "Rotation" ).split(' ');
			key.rot = new THREE.Quaternion( parseFloat(rot[0]), parseFloat(rot[1]), parseFloat(rot[2]), parseFloat(rot[3]) );
			key.scl = [ 1, 1, 1 ];
			bone.keys.push( key );
		}
		anim.hierarchy.push( bone );
	}
	
	function getBoneIdFromName( name )
	{
		for ( var i=0 ; i < anim.hierarchy.length ; i++ )
		{
			if ( anim.hierarchy[i].name == name )
			{
				return i;
			}
		}
		return -1;
	}
	
	callback( anim );
};
