/**
 * @author ant-lafarge / http://ant.lafarge.free.fr/
 */

THREE.OAKLoader = function ( showStatus ) {

	THREE.Loader.call( this, showStatus );

};

THREE.OAKLoader.prototype = Object.create( THREE.Loader.prototype );

THREE.OAKLoader.prototype.load = function ( url, callback, texturePath ) {

	var scope = this;

	texturePath = texturePath ? texturePath : this.extractUrlBase( url );

	this.onLoadStart();
	this.loadAjaxJSON( this, url, callback, texturePath );

};

THREE.OAKLoader.prototype.loadAjaxJSON = function ( context, url, callback, texturePath, callbackProgress ) {

	var xhr = new XMLHttpRequest();

	var length = 0;

	xhr.onreadystatechange = function () {

		if ( xhr.readyState === xhr.DONE ) {

			if ( xhr.status === 200 || xhr.status === 0 ) {

				if ( xhr.responseText ) {
				
					var parser = new DOMParser();
					var xml = parser.parseFromString( xhr.responseText, "text/xml" );
					context.createModel( xml, callback, texturePath );

				} else {

					console.warn( "THREE.OAKLoader: [" + url + "] seems to be unreachable or file there is empty" );

				}

				// in context of more complex asset initialization
				// do not block on single failed file
				// maybe should go even one more level up

				context.onLoadComplete();

			} else {

				console.error( "THREE.OAKLoader: Couldn't load [" + url + "] [" + xhr.status + "]" );

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

THREE.OAKLoader.prototype.createModel = function ( xml, callback, texturePath ) {

	var loader = this;
	var geometry = new THREE.Geometry();

	parseMaterial( texturePath );
	
	parseModel();
	
	function parseMaterial( texturePath )
	{
		// MATERIALS
		var mat = xml.querySelector( "Material" );
		
		var material = new THREE.MeshPhongMaterial();
		material.name = mat.getAttribute( "Name" );
		
		var emissive = mat.getAttribute( "Emissive" ).split(' ');
		material.emissive.r = emissive[0];
		material.emissive.g = emissive[1];
		material.emissive.b = emissive[2];
		
		var ambient = mat.getAttribute( "Ambient" ).split(' ');
		material.ambient.r = ambient[0];
		material.ambient.g = ambient[1];
		material.ambient.b = ambient[2];
		
		var diffuse = mat.getAttribute( "Diffuse" ).split(' ');
		material.color.r = diffuse[0];
		material.color.g = diffuse[1];
		material.color.b = diffuse[2];
		
		var specular = mat.getAttribute( "Specular" ).split(' ');
		material.specular.r = specular[0];
		material.specular.g = specular[1];
		material.specular.b = specular[2];
		
		var tex = xml.querySelector( "Texture" );
		material.map = THREE.ImageUtils.loadTexture( texturePath + '/' + tex.getAttribute("Name") );
		material.side = THREE.DoubleSide;
		
		geometry.materials.push( material );
	}

	function parseModel()
	{
		// VERTICES
		var vertices = xml.querySelector( "Attribute[Name='Position']" ).getAttribute( "Data" ).split(' ');
		for ( var i=0 ; i<vertices.length ; i+=3 )
		{
			geometry.vertices.push( new THREE.Vector3( vertices[i], vertices[i+1], vertices[i+2] ) );
		}
		
		// NORMALS
		var normals = xml.querySelector( "Attribute[Name='Normal']" ).getAttribute( "Data" ).split(' ');
		geometry.normals = [];
		for ( var i=0 ; i<normals.length ; i+=3 )
		{
			geometry.normals.push( new THREE.Vector3( normals[i], normals[i+1], normals[i+2] ) );
		}
		//geometry.computeFaceNormals();
		
		// UVS
		var uvs = xml.querySelector( "Attribute[Name='Texcoord1']" ).getAttribute( "Data" ).split(' ');
		geometry.uvs = [];
		for ( var i=0 ; i<uvs.length ; i+=2 )
		{
			geometry.uvs.push( new THREE.UV( uvs[i], uvs[i+1] ) );
		}
		
		// INDICES / FACES
		var indices = xml.querySelector( "Index[Name='Default']" ).getAttribute( "Data" ).split(' ');
		var n = 0;
		for ( var i=0 ; i<indices.length ; i+=3 )
		{
			geometry.faces.push( new THREE.Face3( indices[i], indices[i+1], indices[i+2], geometry.normals[n], null, 0 ) );
			geometry.faceVertexUvs[0].push( [ geometry.uvs[indices[i]], geometry.uvs[indices[i+1]], geometry.uvs[indices[i+2]] ] );
			n++;
		}
		
		geometry.computeCentroids();
	}
	
	callback( geometry );
};
