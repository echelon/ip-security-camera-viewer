
var init = function()
{

	window.app = new App();

	window.app.cameras = new CameraCollection([
		{name: 'A', 
			fullUrl: 'http://kpcwebkamerasekinai359.plala.jp/' +
					 'SnapshotJPEG?Resolution=320x240&Quality=Low'},
			/*'http://www.cfht.hawaii.edu/' + 
					 'webcams/cfhtdome/cfhtdome.jpg'},*/
		{name: 'B',
			fullUrl: 'http://173.12.209.42/jpg/image.jpg'},
		{name: 'C',
			fullUrl: 'http://webmarin.com/images/wc/Camera.jpg'},
		{name: 'D',
			fullUrl: 'http://www.fishcam.com/liveimage_640.jpg?camera=0'}
	]);

	window.app.initManual();
	window.app.mainLoop();

	/*
	for(var i = 0; i < window.cameras.length; i++) {
		var cam = window.cameras.at(i);
		cam.view.attach();
	}*/

	/*
	// Nothing yet...
	var cv = new Overview_Camera();
	cv.attach();

	var bs = new BasicCamera();
	bs.view.attach();

	var cv2 = new Overview_Camera();
	cv2.attach();*/
}
