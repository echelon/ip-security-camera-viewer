/**
 * Camera image/video URL manipulation.
 * Switches between hosts and url parameters. (TODO)
 * Also adds browser cache breaking timestamp.
 */
function CameraUrl(json)
{
	this.remoteHost = "";  // Over Internet
	this.localHost = "";   // Local network 
	this.currentHost = ""; // The host we're using now.

	this.imagePath = "";
	this.videoPath = "";

	// Params: TODO
	this.params = null;

	if(json) {
		this.remoteHost = json['remote-host'];
		this.localHost = json['local-host'];
		this.imagePath = json['image'];
		this.videoPath = json['video'];
		this.params = json['image-params'];

		//this.currentHost = this.localHost; // TODO: Method to switch.
		this.currentHost = this.remoteHost; // TODO: Method to switch.

		// XXX: Hack to support above. Need real switch.
		if(!this.currentHost) {
			this.currentHost = this.localHost? 
				this.localHost : this.remoteHost;
		}
	}

	/**
	 * Request a new timestamped URL.
	 * Using a timestamp breaks the browser cache. 
	 */
	this.getImageUrl = function()
	{
		var timestamp;
		var url;

		url = "http://" + this.currentHost + this.imagePath;

		// Build query string
		timestamp = new Date().getTime().toString();
		url += "?t=" + timestamp;

		// TODO: proper quality, size parameter handling.
		if(this.params) {
			url += "&size=2&quality=3";
		}
	
		return url;
	}

	/**
	 * Set source as local if exists.
	 */
	this.setLocal = function()
	{
		this.currentHost = this.localHost ? this.localHost : this.remoteHost;
	}

	/**
	 * Set source as remote if exists.
	 */
	this.setRemote = function()
	{
		this.currentHost = this.remoteHost ? this.remoteHost : this.localHost;
	}

};

/**
 * TODO: Image loader class to perform loading.
 * Load tasks will be switched in and out based on per-camera performance, lag,
 * etc. 
 */
function Camera(json)
{
	var that = this;

	// Id, assigned externally.
	var id = -1;

	// Object refs (TODO: No good.)
	var controller;

	// Name, etc.
	this.name = "";
	this.location = "";
	this.vendor = "";
	this.model = "";

	// URL Object. 
	this.url = null;

	// Image frames
	this.lastFrame = null;

	// Mandatory wait time between load requests
	// XXX: Disabled for now. 
	this.waitBetweenLoad = 500; // in ms.

	// If loading is temporarily disabled.
	this.isPaused = false;

	// HTML entities
	this.image = new Image();

	// XXX ///////////////////////////////////////
	this.queue = new RequestQueue();
	this.stats = new Data();
	this.queue.stats = this.stats;
	this.queue.camera = this;
	this.abandonLoadAfter = 900; // in ms

	if(json) {
		this.url = new CameraUrl(json);
		this.model = json['type'];
		this.vendor = json['vendor'];
		this.location = json['location'];
		this.name = json['name'];
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

	this.updateMultiviewTitle = function()
	{
		}

	// TODO: This functionality doesn't belong here
	// TODO: It *really* doesn't belong here. 
	this.updateMultiviewStats = function()
	{
		var node = $(this.multiviewDataSelector);
		var tpl = null;
		
		this.updateMultiviewTitle();

		if(node.length == 0) {
			return;
		}
		
		tpl = $(this.multiviewDataSelector).tmplItem();

		var getTime = function(time) 
		{
			var d = new Date(time);
			var s = "";

			if(!time) {
				return "Pending...";
			}

			s += d.getHours()? d.getHours() : "00";
			s += ":"; 
			s += (d.getMinutes() < 10)? "0" + d.getMinutes() : d.getMinutes(); 
			s += ":"; 
			s += (d.getSeconds() < 10)? "0" + d.getSeconds() : d.getSeconds();
			//s += '.';
			//s += d.getMilliseconds();

			delete d;
			return s;
		}

		// Derived figures, formatted, etc.
		tpl.data['cameraName'] = this.model + " / " + this.location;
		tpl.data['queueSize'] = this.queue? this.queue.queue.length : null;
		var percent = this.queue? this.queue.percentFull()*100 : 0;
		tpl.data['queuePercent'] = percent.toFixed(1);
		tpl.data['deltaTComplete'] = (this.stats.dateLastLoaded - 
			this.stats.dateLastLoaded_requestDate) / 1000;
		tpl.data['deltaTWait'] = ((new Date()).getTime() -
			this.stats.dateLastRequested) / 1000;
		var seconds = ((new Date()).getTime() - 
				this.stats.dateFirstRequested) / 1000;
		var seconds = ((new Date()).getTime() - 
				this.stats.dateFirstRequested) / 1000;
		tpl.data['fpsAvg'] = (this.stats.loadCount / seconds).toFixed(4);
		seconds = this.stats.dateLastLoaded ?
			((new Date()).getTime() - this.stats.dateLastLoaded) / 1000 :
			0;
		tpl.data['fpsInst'] = seconds.toFixed(4);

		// Times, etc. 
		tpl.data['timeLastLoadedRequested'] = 
			getTime(this.stats.dateLastLoaded_requestDate);
		tpl.data['timeLastLoaded'] = getTime(this.stats.dateLastLoaded);
		tpl.data['timeFirstRequested'] = 
			getTime(this.stats.dateFirstRequested);
		tpl.data['timeLastRequested'] = getTime(this.stats.dateLastRequested);

		// Directly Copied
		tpl.data['throttle'] = this.stats.throttle;
		tpl.data['requestCount'] = this.stats.requestCount;
		tpl.data['loadCount'] = this.stats.loadCount;
		tpl.data['failCount'] = this.stats.failCount;
		tpl.data['abortCount'] = this.stats.abortCount;
		tpl.data['waitCount'] = this.stats.waitCount;
		tpl.data['cachePurgeCount'] = this.stats.cachePurgeCount;
		tpl.data['timeLastFailed'] = this.stats.dateLastFailed;
		tpl.data['timeLastAborted'] = this.stats.dateLastAborted;
		tpl.update();

	}
};
