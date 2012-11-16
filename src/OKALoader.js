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
	anim.length = ( keyCount- 1 ) * tick / 1000;
	anim.fps = keyCount / anim.length;
	anim.hierarchy = [];
	
	var xmlBoneList = xml.querySelector( "BoneList" );
	var xmlBones = xmlBoneList.querySelectorAll( "Bone" );
	for ( var b=0 ; b < xmlBones.length ; b++ )
	{
		var xmlBone = xmlBones[ b ];
		var bone = {};
		bone.name = xmlBone.getAttribute( "Name" );
		bone.parent = xmlBone.getAttribute( "Parent" );
		bone.keys = [];
		var xmlKeys = xmlBone.querySelectorAll( "Key" );
		for ( var k=0 ; k < xmlKeys.length ; k++ )
		{
			var xmlKey = xmlKeys[ k ];
			var key = {};
			key.time = parseFloat( xmlKey.getAttribute( "Time" ) ) * tick / 1000;

			var tra = xmlKey.getAttribute( "Translation" ).split(' ').map( parseFloat );
			tra.map( parseFloat );
			key.pos = [ tra[0], tra[1], tra[2] ];

			var rot = xmlKey.getAttribute( "Rotation" ).split(' ').map( parseFloat );
			rot.map( parseFloat );
			key.rot = new THREE.Quaternion( rot[1], rot[2], rot[3], rot[0] );

			var scl = xmlKey.getAttribute( "Scale" );
			if ( scl )
			{
				scl = scl.split(' ').map( parseFloat );	
				key.scl = [ scl[0], scl[1], scl[2] ];
			}
			else
			{
				key.scl = [ 1,1,1 ];
			}
			
			bone.keys.push( key );
		}
		anim.hierarchy.push( bone );
	}

	for( var b=0 ; b < anim.hierarchy.length ; b++ )
	{
		var bone = anim.hierarchy[ b ];
		bone.parent = getBoneIdFromName( anim.hierarchy, bone.parent );
	}
	
	callback( anim );
};
