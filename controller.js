
/**
 * Controller:
 *  - Initial setup
 *  - Control the main loop.
 *  - Switch between views.
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
				cam.controller = that; // TODO: Not good. 
				that.cameras.push(cam);
			}
			// Intitialize view and begin requesting. 
			that.view.initCameraDom();
			that.sizeWindow();
			that.mainLoop();
		}

		// Load camera data. 
		//$.getJSON('./cameras.json', processJson);
		$.getJSON('./example.json', processJson);
		
		// Install callbacks. 
		$('#options').change(function(){ that.changeOptions(); });
		$(window).resize(function() { that.sizeWindow(); });
	}

	initialize();

	/**
	 * Main loop controls image loading, etc.
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
			cam.stats.throttle = Math.round(7000 * cam.queue.percentFull());
			if(cam.queue.newest() + cam.stats.throttle > now) {
				continue;
			}

			cam.queue.request(cam.url.getImageUrl());
		}

		setTimeout(function() { that.mainLoop(); }, 800);
	}

	/**
	 * TODO: Fix doc
	 * Update the source of the images: remote (internet) or local (lan).
	 * Togged by a radio form on the page. 
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
		this.sizeWindow();
		this.sizeWindow();
	}

	/**
	 * Resize the image blocks to fit the window.
	 * Fits multiple images per row, as configured. 
	 */
	this.sizeWindow = function()
	{
		var width = $(window).width();
		var NUM = this.view.multiviewImagesPerRow;
		var newImgWidth = Math.floor(width/NUM);
		var newImgHeight = Math.floor(newImgWidth/640 * 480);

		var resize = function() {
			this.width = newImgWidth;
			this.height = newImgHeight;
		}

		// Resize image and outer div. 
		$('img').each(resize);
		$('.multiview_cam').width(newImgWidth);

		// Resize singleview images.
		//$('.singleview_cam').width(width);
		//$('.singleview_cam img').width(width);
	}
}

/**
 * For debugging.
 */
function print(text)
{
	$('#main').prepend('<h1>' + text + '</h1>');
}
