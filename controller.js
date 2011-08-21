/**
 * Controller class
 *
 * Responsible for: 
 *  - Initial setup and configuration
 *  - The main loop (fetching/processing images)
 *  - Handling user input, switch between views
 *
 * TODO: Move all traces of DOM access to view.js. 
 */
function Controller()
{
	var that = this;

	// Objects
	this.view = new View(this);
	this.cameras = [];
	
	var initialize = function()
	{
		// Callback to handle JSON 
		var processJson = function(json)
		{
			for(var i in json.cameras) {
				var cam = new Camera(json.cameras[i]);
				cam.id = i;
				cam.controller = that; // FIXME: Doesn't need controller!
				that.cameras.push(cam);
			}
			// Intitialize view and begin requesting. 
			that.view.initCameraDom();
			that.view.sizeWindow();
			that.mainLoop();
		}

		// Load camera data. 
		$.getJSON('./mycameras.json', processJson);
		//$.getJSON('./example.json', processJson);
		
		// Install callbacks. 
		$(that.view.OPTIONS_SELECTOR).change(function(){ 
			that.changeOptions(); });
		$(window).resize(function() { that.resizeWindowCb(); });
	}

	initialize();

	/**
	 * Main loop controls image loading, etc.
	 * FIXME: Should be private or toggleable/only callable once. 
	 * XXX: Only called once, by constructor!
	 */
	this.mainLoop = function()
	{
		var that = this;
		var now = (new Date()).getTime();
		var cam = null;

		//print(navigator.userAgent);

		// Purge old items from the queue.
		// This only occurs when a successful hit is made. 
		for(var i = 0; i < this.cameras.length; i++) {
			cam = this.cameras[i];
			cam.queue.purgeOld();
		}

		// Perform requests. 
		// Requests are throttled by queue size and can be paused entirely.
		for(var i = 0; i < this.cameras.length; i++)
		{
			cam = this.cameras[i];

			if(cam.isPaused) {
				continue;
			}

			// Throttle requests by the size of the queue. 
			cam.throttle = Math.round(7000 * cam.queue.percentFull());
			if(cam.queue.newest() + cam.throttle > now) {
				continue;
			}

			cam.queue.request(cam.url.getImageUrl());
		}

		setTimeout(function() { that.mainLoop(); }, 800);
	}

	/**
	 * Update state to match user preference. (A callback)
	 * 
	 * User toggles options on form, and this callback updates all 
	 * parameters: (1) source of the images as either remote/internet or
	 * local/lan, (2) number or images displayed per row in the UI.
	 */
	this.changeOptions = function()
	{
		var local;

		// Set cameras as local or remote. 
		local = (this.view.getOptionServer() == 'local')? true : false;
		for(var i = 0; i < this.cameras.length; i++) {
			if(local) {
				this.cameras[i].url.setLocal();
			}
			else {
				this.cameras[i].url.setRemote();
			}
		}

		// Change row width. 
		this.view.multiviewImagesPerRow = this.view.getOptionRowWidth();

		// Adjust images to window width.  
		// XXX: Do twice to ensure it sets. (Sometimes glitches out.)
		this.view.sizeWindow();
		this.view.sizeWindow();
	}

	/**
	 * Callback to switch view mode to singleview or to pause camera.
	 */
	this.clickMultiviewCam = function(cam, ev)
	{
		switch(ev.which) {
			case 1: // Right click
				this.view.singleview(cam);
				break;
			case 3: // Left click
				cam.togglePause();
				break;
		}
	}

	/**
	 * Callback to switch view mode to multiview.
	 * Must supply camera in callback installation.
	 */
	this.clickSingleviewCam = function(cam, ev)
	{
		switch(ev.which) {
			case 1: // Right click
				this.view.multiview();
				break;
			case 3: // Left click
				cam.togglePause();
				break;
		}
	}

	/**
	 * Window was resized (callback). 
	 * Pass the information along to view.
	 */
	this.resizeWindow = function()
	{
		this.view.sizeWindow($(window).width(), $(window).height());
	}
}

