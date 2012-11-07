AnimationUtils = {};

AnimationUtils.createSkeleton = function( skinnedMesh )
{
	var boneSize = 2;
	var skeletonGeometry = new THREE.Geometry();
	skeletonGeometry.bones = [];
	for ( var i=0 ; i < skinnedMesh.geometry.bones.length ; i++ )
	{
		// get bone
		var bone = skinnedMesh.geometry.bones[i];
		// Create bone cube
		var boneGeometry = new THREE.CubeGeometry( boneSize,boneSize,boneSize );
		var boneMesh = new THREE.Mesh( boneGeometry );
		boneMesh.position.set( bone.pos[0], bone.pos[1], bone.pos[2] );
		boneMesh.useQuaternion = true;
		boneMesh.quaternion.set( bone.rotq[1], bone.rotq[2], bone.rotq[3], bone.rotq[0] );
		//boneMesh.rotation.set( bone.rot[0], bone.rot[1], bone.rot[2] );
		boneMesh.scale.set( bone.scl[0], bone.scl[1], bone.scl[2] );
		// Merge bone cube in skeleton
		THREE.GeometryUtils.merge( skeletonGeometry, boneMesh );
		// Add bone to skeleton
		skeletonGeometry.bones.push( bone );
		// set skinIndex and skinWeight to just added cube in skeleton
		var sl = skeletonGeometry.skinIndices.length;
		var vl = skeletonGeometry.vertices.length;
		for ( var j=0 ; j < vl ; j++ )
		{
			if ( j >= sl )
			{
				skeletonGeometry.skinIndices.push( new THREE.Vector4( i,0,0,0 ) );
				skeletonGeometry.skinWeights.push( new THREE.Vector4( 1,0,0,0 ) );
			}
		}
	}
	var skeletonMesh = new THREE.SkinnedMesh( skeletonGeometry, new THREE.MeshLambertMaterial() );
	skeletonMesh.material.skinning = true;
	//skeletonMesh.material.ambient.setHex( 0xff0000 );
	console.log( "ske", skeletonMesh );
	return skeletonMesh;
}
