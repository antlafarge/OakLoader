AnimationUtils = {};

AnimationUtils.createSkeleton = function( skinnedMesh, boneScale )
{
	console.log( skinnedMesh.geometry.bones );
	// Construct the bones hierarchy with objects
	var iii = {};
	var root = new THREE.Object3D();
	iii[-1] = root;
	root.name = "root";
	root.position.set( skinnedMesh.position.x, skinnedMesh.position.y, skinnedMesh.position.z );
	root.rotation.set( skinnedMesh.rotation.x, skinnedMesh.rotation.y, skinnedMesh.rotation.z );
	root.quaternion.set( skinnedMesh.quaternion.x, skinnedMesh.quaternion.y, skinnedMesh.quaternion.z, skinnedMesh.quaternion.w );
	root.scale.set( skinnedMesh.scale.x, skinnedMesh.scale.y, skinnedMesh.scale.z );
	root.useQuaternion = true;

	for ( var i=0 ; i < skinnedMesh.geometry.bones.length ; i++ )
	{
		var bone = skinnedMesh.geometry.bones[i];

		var obj = new THREE.Object3D();
		obj.name = bone.name;

		obj.position.set( bone.pos[0], bone.pos[1], bone.pos[2] );
		if ( bone.rotq )
		{
			obj.quaternion.set( bone.rotq[0], bone.rotq[1], bone.rotq[2], bone.rotq[3] );
			obj.useQuaternion = true;
		}
		else
		{
			obj.rotation.set( bone.rot[0], bone.rot[1], bone.rot[2] );
		}
		obj.scale.set( bone.scl[0], bone.scl[1], bone.scl[2] );

		iii[ bone.parent ].add( obj );
		iii[ i ] = obj;
	}

	// Create skeleton by using hiererchy
	var skeletonGeometry = new THREE.Geometry();
	skeletonGeometry.materials.push( new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true, transparent: false, opacity: 1, side: THREE.DoubleSide } ) );

	function treatChild( obj )
	{
		// Retrieve the bone position
		obj.updateMatrix();
		obj.updateMatrixWorld();
		var position = obj.matrixWorld.getPosition().clone();

		// BONE
		// Create and merge the bone as a shpere in the skeleton
		var boneMesh = new THREE.Mesh( new THREE.SphereGeometry( boneScale,8,8 ), new THREE.MeshFaceMaterial() );
		boneMesh.geometry.materials.push( new THREE.MeshBasicMaterial({color:0xff0000}) );
		for ( var i=0 ; i < boneMesh.geometry.faces.length ; i++ )
		{
			boneMesh.geometry.faces[ i ].materialIndex = 0;
		}
		boneMesh.position.set( position.x, position.y, position.z );
		THREE.GeometryUtils.merge( skeletonGeometry, boneMesh );

		// process recursively the children
		for ( var i=0 ; i < obj.children.length ; i++ )
		{
			var child = obj.children[i];
			var childPosition = child.matrixWorld.getPosition().clone();

			var vl = skeletonGeometry.vertices.length;
			skeletonGeometry.vertices.push( position.clone(), childPosition.clone() );
			skeletonGeometry.faces.push( new THREE.Face3( vl, vl, vl+1, null, null, 0 ) );

			treatChild( child );
		}
	}

	for ( var i=0 ; i < root.children.length ; i++ )
	{
		treatChild( root.children[i] );
	}

	var skeleton = new THREE.Mesh( skeletonGeometry, new THREE.MeshFaceMaterial() );
	skeleton.name = skinnedMesh.name + "_skeleton";

	return skeleton;
}
