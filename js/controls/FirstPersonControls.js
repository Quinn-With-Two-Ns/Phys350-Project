/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.FirstPersonControls = function ( object, domElement ) {

	this.object = object;
	this.target = new THREE.Vector3( 0, 0, 0 );

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	this.enabled = true;

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.01;

	this.lookVertical = true;
	this.autoForward = false;

	this.activeLook = true;

	this.heightSpeed = false;
	this.heightCoef = 1.0;
	this.heightMin = 0.0;
	this.heightMax = 1.0;

	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	this.autoSpeedFactor = 0.0;

	this.mouseX = 0;
	this.mouseY = 0;

	this.lat = 0;
	this.lon = 0;
	this.phi = 0;
	this.theta = 0;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;

	this.turnUp = false;
	this.turnDown = false;
	this.turnRight = false;
	this.turnLeft = false;

	this.mouseDragOn = false;

	this.viewHalfX = 0;
	this.viewHalfY = 0;

	this.rotGroup = new THREE.Group();
	this.transGroup = new THREE.Group();
	this.transGroup.add(this.rotGroup);
	this.rotGroup.add(this.object);

	if ( this.domElement !== document ) {

		this.domElement.setAttribute( 'tabindex', - 1 );

	}

	//

	this.handleResize = function () {

		if ( this.domElement === document ) {

			this.viewHalfX = window.innerWidth / 2;
			this.viewHalfY = window.innerHeight / 2;

		} else {

			this.viewHalfX = this.domElement.offsetWidth / 2;
			this.viewHalfY = this.domElement.offsetHeight / 2;

		}

	};

	this.onMouseMove = function ( event ) {

		if ( this.domElement === document ) {

			this.mouseX = event.pageX - this.viewHalfX;
			this.mouseY = event.pageY - this.viewHalfY;

		} else {

			this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
			this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

		}

	};

	this.onKeyDown = function ( event ) {

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 38: /*up*/ this.turnUp = true; break;
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/ this.turnLeft = true; break;
			case 65: /*A*/ this.moveLeft = true; break;

			case 40: /*down*/ this.turnDown = true; break;
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/ this.turnRight = true; break;
			case 68: /*D*/ this.moveRight = true; break;

			case 82: /*R*/ this.moveUp = true; break;
			case 70: /*F*/ this.moveDown = true; break;

		}

	};

	this.onKeyUp = function ( event ) {

		switch ( event.keyCode ) {

			case 38: /*up*/ this.turnUp = false; break;
			case 87: /*W*/ this.moveForward = false; break;

			case 37: /*left*/ this.turnLeft = false; break;
			case 65: /*A*/ this.moveLeft = false; break;

			case 40: /*down*/ this.turnDown = false; break;
			case 83: /*S*/ this.moveBackward = false; break;

			case 39: /*right*/ this.turnRight = false; break;
			case 68: /*D*/ this.moveRight = false; break;

			case 82: /*R*/ this.moveUp = false; break;
			case 70: /*F*/ this.moveDown = false; break;

		}

	};

	this.update = function( delta ) {

		if ( this.enabled === false ) return;

		if ( this.heightSpeed ) {

			var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
			var heightDelta = y - this.heightMin;

			this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

		} else {

			this.autoSpeedFactor = 0.0;

		}

		var actualLookSpeed = delta * this.lookSpeed;
		
		if ( this.turnUp ) this.object.rotation.x += actualLookSpeed;
		if ( this.turnDown ) this.object.rotation.x -= actualLookSpeed;

		if ( this.turnRight ) this.rotGroup.rotation.y -= actualLookSpeed;
		if ( this.turnLeft ) this.rotGroup.rotation.y += actualLookSpeed;

		var actualMoveSpeed = delta * this.movementSpeed;
		let velocity = new THREE.Vector3(0,0,0);

		if ( this.moveForward || ( this.autoForward && ! this.moveBackward ) ) velocity.z -= actualMoveSpeed;
		if ( this.moveBackward ) velocity.z += actualMoveSpeed;

		if ( this.moveLeft ) velocity.x -= actualMoveSpeed;
		if ( this.moveRight ) velocity.x += actualMoveSpeed;

		if ( this.moveUp ) this.transGroup.translateY( actualMoveSpeed );
		if ( this.moveDown ) this.transGroup.translateY( - actualMoveSpeed );

		let rv = new THREE.Vector3(velocity.x, velocity.y, velocity.z);
		rv.applyQuaternion(this.rotGroup.quaternion);
		this.transGroup.translateZ( rv.z );
		this.transGroup.translateX( rv.x );
	
	};

	function contextmenu( event ) {

		event.preventDefault();

	}

	this.dispose = function() {

		this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
		this.domElement.removeEventListener( 'mousedown', _onMouseDown, false );
		this.domElement.removeEventListener( 'mousemove', _onMouseMove, false );
		this.domElement.removeEventListener( 'mouseup', _onMouseUp, false );

		window.removeEventListener( 'keydown', _onKeyDown, false );
		window.removeEventListener( 'keyup', _onKeyUp, false );

	};

	var _onMouseMove = bind( this, this.onMouseMove );
	var _onKeyDown = bind( this, this.onKeyDown );
	var _onKeyUp = bind( this, this.onKeyUp );

	this.domElement.addEventListener( 'contextmenu', contextmenu, false );
	this.domElement.addEventListener( 'mousemove', _onMouseMove, false );


	window.addEventListener( 'keydown', _onKeyDown, false );
	window.addEventListener( 'keyup', _onKeyUp, false );

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	}

	this.handleResize();

};
