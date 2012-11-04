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

	var xmlMaterialList = xml.querySelector( "MaterialList" );
	var xmlMaterials = xmlMaterialList.querySelectorAll( "Material" );
	var materials = [];
	for ( var i=0 ; i < xmlMaterials.length ; i++ )
	{
		materials.push( parseMaterial( xmlMaterials[i] ) );
	}

	var xmlMeshList = xml.querySelector( "MeshList" );
	var xmlMeshs = xmlMeshList.querySelectorAll( "Mesh" );
	var meshes = [];
	for ( var i=0 ; i < xmlMeshs.length ; i++ )
	{
		meshes.push( parseMesh( xmlMeshs[i] ) );
	}
	
	function getMatIdFromName( name )
	{
		for ( var i=0 ; i < materials.length ; i++ )
		{
			if ( materials[i].name == name )
			{
				return i;
			}
		}
		return -1;
	}
	
	function parseMaterial( xmlMaterial )
	{
		// MATERIAL
		var material = new THREE.MeshPhongMaterial();
		material.name = xmlMaterial.getAttribute( "Name" );
		
		var emissive = xmlMaterial.getAttribute( "Emissive" ).split(' ');
		material.emissive.r = emissive[0];
		material.emissive.g = emissive[1];
		material.emissive.b = emissive[2];
		
		var ambient = xmlMaterial.getAttribute( "Ambient" ).split(' ');
		material.ambient.r = ambient[0];
		material.ambient.g = ambient[1];
		material.ambient.b = ambient[2];
		
		var diffuse = xmlMaterial.getAttribute( "Diffuse" ).split(' ');
		material.color.r = diffuse[0];
		material.color.g = diffuse[1];
		material.color.b = diffuse[2];
		
		var specular = xmlMaterial.getAttribute( "Specular" ).split(' ');
		material.specular.r = specular[0];
		material.specular.g = specular[1];
		material.specular.b = specular[2];
		
		var tex = xml.querySelector( "Texture" );
		if ( tex )
		{
			material.map = THREE.ImageUtils.loadTexture( texturePath + '/' + tex.getAttribute("Name") );
			material.side = THREE.DoubleSide;
		}
		
		return material;
	}

	function parseMesh( xmlMesh )
	{
		var geometry = new THREE.Geometry();
		
		// There is only 1 material per mesh
		var materialId = getMatIdFromName( xmlMesh.getAttribute( "Material" ) );
		geometry.materials.push( materials[materialId] );
		materialId = 0;
	
		// VERTICES
		var vertices = xmlMesh.querySelector( "Attribute[Name='Position']" ).getAttribute( "Data" ).split(' ');
		for ( var i=0 ; i<vertices.length ; i+=3 )
		{
			geometry.vertices.push( new THREE.Vector3( vertices[i], vertices[i+1], vertices[i+2] ) );
		}
		
		// NORMALS
		var normals = xmlMesh.querySelector( "Attribute[Name='Normal']" ).getAttribute( "Data" ).split(' ');
		geometry.normals = [];
		for ( var i=0 ; i<normals.length ; i+=3 )
		{
			geometry.normals.push( new THREE.Vector3( normals[i], normals[i+1], normals[i+2] ) );
		}
		//geometry.computeFaceNormals();
		
		// UVS
		var texcoord1 = xmlMesh.querySelector( "Attribute[Name='Texcoord1']" );
		if ( texcoord1 )
		{
			var uvs = texcoord1.getAttribute( "Data" ).split(' ');
			geometry.uvs = [];
			for ( var i=0 ; i<uvs.length ; i+=2 )
			{
				geometry.uvs.push( new THREE.UV( uvs[i], uvs[i+1] ) );
			}
		}

		// INDICES / FACES
		var indices = xmlMesh.querySelector( "Index[Name='Default']" ).getAttribute( "Data" ).split(' ');
		var n = 0;
		for ( var i=0 ; i<indices.length ; i+=3 )
		{
			geometry.faces.push( new THREE.Face3( indices[i], indices[i+1], indices[i+2], geometry.normals[n], null, materialId ) );
			if ( texcoord1 )
			{
				geometry.faceVertexUvs[0].push( [ geometry.uvs[indices[i]], geometry.uvs[indices[i+1]], geometry.uvs[indices[i+2]] ] );
			}
			n++;
		}
		
		// BONES
		parseSkin( xmlMesh.querySelector( "Skin" ), geometry );
		
		// SKININDEX
		var xmlBoneIndex = xmlMesh.querySelector( "Attribute[Name='BoneIndex']" );
		if ( xmlBoneIndex )
		{
			var bi = xmlBoneIndex.getAttribute( "Data" ).split(' ');
			for ( var i=0 ; i < bi.length ; i+=4 )
			{
				geometry.skinIndices.push( new THREE.Vector4( parseFloat(bi[0]), parseFloat(bi[1]), parseFloat(bi[2]), parseFloat(bi[3]) ) );
			}
		}
		
		// SKINWEIGHT
		var xmlBoneWeight = xmlMesh.querySelector( "Attribute[Name='BoneWeight']" );
		if ( xmlBoneWeight )
		{
			var bw = xmlBoneWeight.getAttribute( "Data" ).split(' ');
			for ( var i=0 ; i < bw.length ; i+=4 )
			{
				geometry.skinWeights.push( new THREE.Vector4( parseFloat(bw[0]), parseFloat(bw[1]), parseFloat(bw[2]), parseFloat(bw[3]) ) );
			}
		}
		
		// Post-processing
		geometry.computeCentroids();
		geometry.computeBoundingBox();
		
		return new THREE.Mesh( geometry, new THREE.MeshFaceMaterial() );
	}
	
	function parseSkin( xmlSkin, geometry )
	{
		if ( geometry.bones == null )
			geometry.bones = [];
	
		var xmlBones = xmlSkin.querySelectorAll( "Bone" );
		
		for ( var i=0 ; i < xmlBones.length ; i++ )
		{
			var bone = {};
			bone.name = xmlBones[i].getAttribute( "Name" );
			var im = xmlBones[i].getAttribute( "InitMatrix" ).split(' ');
			var initMatrix = new THREE.Matrix4( im[0], im[1], im[2], 0, im[3], im[4], im[5], 0, im[6], im[7], im[8], 0, im[9], im[10], im[11], 1 );
			bone.parent = -1;
			bone.pos = new THREE.Vector3();
			bone.rotq = new THREE.Quaternion();
			bone.scl = new THREE.Vector3();
			initMatrix.decompose( bone.pos, bone.rotq, bone.scl );
			geometry.bones.push( bone );
		}
	}
	
	var object3d = new THREE.Object3D();
	if ( meshes.length == 1 )
	{
		object3d = meshes[0];
	}
	else
	{
		object3d = new THREE.Object3D();
		for ( var i=0 ; i < meshes.length ; i++ )
		{
			object3d.add( meshes[i] );
		}
	}
	callback( object3d );
};
