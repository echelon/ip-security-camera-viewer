// TODO 1 -- Port to backbone
// TODO 2 -- any number of hosts to cycle through
// TODO 3 -- better views for mobile (hide stats on close up. make that a
// 			 separate view)


/**
 * BasicCamera
 * TODO/TEMP.
 * A temporarily intermediate in the backbone port, serves as the only
 * model in this stage. It doesn't support quality parameters, different
 * servers, etc. This will be replaced once the views are done with a 
 * much more robust model.
 */
var Camera = Backbone.Model.extend({

	defaults: {
		fullUrl: '', // TEMPORARY

		// Descriptive attributes
		name: '',
		location: '',
		timezone: '',
		description: '',

		// FPS may allow the camera to auto-adjust in the future.
		fps_predefined: '',
		fps_estimated: '',

		// XXX: TEMPORARY -- I implemented these better in the old code
		loadcount: 0,
		failcount: 0,
		loadtime: 0,
		curImage: './img/unavailable.png'
	},

	// XXX/FIXME: 
	// Temporary intermediate values for the RequestQueue port / bootstrap
	// Once the queue is working, I'll build a newer/improved design and
	// be rid of these.
	queue: null,
	curFrame: new Image(), // XXX: Used by the queue
	isPaused: false,
	throttle: 0,
	times: {
		firstRequested: null,
		firstLoaded: null,
		lastRequested: null,
		lastLoaded: null,
		lastLoaded_requestTime: null, // Request time of last loaded frame
		lastFailed: null,
		lastAborted: null
	},
	counts: {
		request: 0,
		load: 0,
		fail: 0,
		abort: 0,
		cachePurge: 0 // Purged from queue before loaded
	},

	initialize: function() {

		// TODO/TEMP
		this.queue = new RequestQueue2();
		this.queue.camera = this;

		// FIXME: Should I declare here?
		if(!this.view) {
			// TODO: More views...
			this.view = new Overview_CameraPane({model:this});
			this.curView = this.view;
		}

		//this.bind('change', this.updateView());
	},

	getImageUrl: function() {
		var url = this.get('fullUrl');
		var timestamp;

		// Build query string
		timestamp = new Date().getTime().toString();

		// FIXME: Ensure proper query string is built.
		// TODO: Advanced parameterization
		if(url.search("/\\?/") == -1) {
			url += "?t=" + timestamp; 
		}
		else {
			url += "&t=" + timestamp;
		}
		return url;
	},

	updateView: function() {
		// FIXME FIXME FIXME: Signal triggers an infinite loop?

		this.set('curImage', this.curFrame.src); // XXX XXX XXX XXX XXX XXX
		this.curView.render()
	}

});

var CameraCollection = Backbone.Collection.extend({
    model: Camera 
});


