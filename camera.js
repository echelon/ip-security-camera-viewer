/**
 * Camera represents a single IP camera.
 *
 * Maintains the camera location, access times and statistics, current
 * frame, and so forth. Primarily acts as a dictionary for camera state
 * information. The controller actually performs core functionality. 
 *
 * Camera:
 * 		setPause()
 * 		togglePause()
 * 		url.setLocal()
 * 		url.setRemote()
 * 		url.getImageUrl()
 */
function Camera(json)
{
	// Id, assigned externally.
	var id = -1;

	// Object refs (TODO: Shouldn't need to talk to controller!)
	// XXX: Queue uses this to call UI update on image load. 
	var controller;

	// CameraUrl object. Supports source URL manipulation to support
	// multiple hosts and camera image quality features. 
	this.url = null;

	// RequestQueue object. Responsible for loading images, managing
	// callbacks, etc.
	this.queue = null;

	// Camera model, vendor, location labels.
	this.model = "";
	this.vendor = "";
	this.location = "";

	// Load time statistics
	this.times = {
		firstRequested: null,
		firstLoaded: null,
		lastRequested: null,
		lastLoaded: null,
		lastLoaded_requestTime: null, // Request time of last loaded frame
		lastFailed: null,
		lastAborted: null
	};

	// Load counts
	this.counts = {
		request: 0,
		load: 0,
		fail: 0,
		abort: 0,
		cachePurge: 0 // Purged from queue before loaded
	};

	// Pause, throttle, etc.
	this.isPaused = false;
	this.throttle = 0; // Throttle to apply (in ms). Dynamically updated.

	// Current frame. Updated by RequestQueue.
	this.curFrame = new Image();

	///////// CONSTRUCT ////////
	
	this.queue = new RequestQueue();
	this.queue.camera = this;

	if(json) {
		this.url = new CameraUrl(json);
		this.location = json['location'];
		this.vendor = json['vendor'];
		this.model = json['type'];
	};

	/**
	 * Set the pause state.
	 * Without argument, treated as setPause(true). 
	 */
	this.setPause = function(pause)
	{
		if(typeof pause == 'undefined') {
			this.isPaused = true;
		}
		else {
			this.isPaused = Boolean(pause);
		}
	};

	/**
	 * Toggle pause state.
	 */
	this.togglePause = function()
	{
		this.isPaused = !this.isPaused;
	}
};

/**
 * Camera image/video URL manipulation.
 *
 * Automatically adds the required browser cache breaking timestamp
 * to each URL. This ultimately makes the loader work.
 *
 * TODO: Add ability to support camera features, such as quality and
 * size parameters. Not all cameras have these, but it would be nice
 * for those that do. 
 */
function CameraUrl(json)
{
	// IP Camera Location
	this.remoteHost = "";  // Over Internet
	this.localHost = "";   // Local network (if available)
	this.currentHost = ""; // The host we're using now.
	this.imagePath = "";
	this.videoPath = "";

	// TODO: Support for camera quality, etc. params.
	this.params = null;

	if(json) {
		this.remoteHost = json['remote-host'];
		this.localHost = json['local-host'];
		this.imagePath = json['image'];
		this.videoPath = json['video'];
		this.params = json['image-params'];

		// Default to using remote host if both are specified. 
		this.currentHost = this.remoteHost ? this.remoteHost : this.localHost;
	}

	/**
	 * Request a new timestamped URL.
	 * A timestamp is appended that breaks the browser cache.
	 */
	this.getImageUrl = function()
	{
		var timestamp;
		var url;

		url = "http://" + this.currentHost + this.imagePath;

		// Build query string
		timestamp = new Date().getTime().toString();
		url += "?t=" + timestamp;

		// FIXME: proper quality, size parameter handling.
		// This is just to support Linksys cameras. Won't work elsewhere.
		if(this.params) {
			url += "&size=2&quality=3";
		}
	
		return url;
	}

	/**
	 * Set source server as local if exists.
	 */
	this.setLocal = function()
	{
		this.currentHost = this.localHost ? this.localHost : this.remoteHost;
	}

	/**
	 * Set source server as remote if exists.
	 */
	this.setRemote = function()
	{
		this.currentHost = this.remoteHost ? this.remoteHost : this.localHost;
	}
};
