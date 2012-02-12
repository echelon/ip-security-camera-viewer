/**
 * This is the main file that bootstraps the entire application. 
 */
require(['views/app', 'models/camera', 'models/collection'], 
		function(App, Camera, CameraCollection) {

    $(function() {

		window.app = new App();

		window.app.cameras = new CameraCollection([
			{name: 'A', 
				fullUrl: 'http://kpcwebkamerasekinai359.plala.jp/' +
						 'SnapshotJPEG?Resolution=320x240&Quality=Low'},
			{name: 'B',
				fullUrl: 'http://173.12.209.42/jpg/image.jpg'},
			{name: 'C',
				fullUrl: 'http://webmarin.com/images/wc/Camera.jpg'},
			{name: 'D',
				fullUrl: 'http://www.fishcam.com/liveimage_640.jpg?camera=0'}
		]);

		console.log(window.app.cameras);

		window.app.initManual();
		window.app.mainLoop();

    });
});
