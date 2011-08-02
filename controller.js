
/**
 * Controller:
 *  - Initial setup
 *  - Control the main loop.
 *  - Switch between views.
 */
function Controller()
{
	var that = this;

	this.cameras = [];

	this.numPerRow = 2; // Images per row. TODO: Move elsewhere.
	
	var initialize = function()
	{
		// Callback to handle JSON 
		var processJson = function(json)
		{
			for(var i in json.cameras) {
				var cam = new Camera(json.cameras[i]);
				that.cameras.push(cam);
			}
			// Intitialize view and begin requesting. 
			that.viewAll();
			that.mainLoop();
		}

		// Load camera data. 
		$.getJSON('./cameras.json', processJson);
		//$.getJSON('./example.json', processJson);
		
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
	 * View: Show all cameras.
	 */
	this.viewAll = function()
	{
		var that = this;
		var defaultImage = './img/unavailable.png';

		// If SVG support, use SVG default image.
		if(document.implementation.hasFeature(
			"http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) {
				defaultImage = './img/unavailable.svg';
		}

		for(var i = 0; i < this.cameras.length; i++)
		{
			var cam = this.cameras[i];
			var data;
			var tpl1;
			var tpl2;
			var tpl3;
			var item;
			
			data = cam.stats;
			data['id'] = i;
			data['camDefaultImage'] = defaultImage;

			tpl1 = $('#multiviewTemplate').tmpl(data);
			tpl1.appendTo('#main');

			tpl2 = $('#multiviewDataTemplate').tmpl(data);
			tpl2.appendTo('#multiview_cam_' + i + ' .cam_data');

			tpl3 = $('#multiviewTitleTemplate').tmpl(data);
			tpl3.prependTo('#multiview_cam_' + i);

			domSelector1 = "#main #multiview_cam_" + i;
			domSelector2 = "#main #multiview_cam_data_" + i;
			domSelector3 = "#main #multiview_title_" + i;
			cam.setMultiviewSelector(domSelector1, domSelector2, domSelector3);
		}

		this.sizeWindow();
	}

	/**
	 * View: Show a single camera. (TODO)
	 */
	this.viewCamera = function(id) 
	{
		if(id < 0 || id >= this.cameras.length) {
			return;
		}
		/*
		// Pause all other cameras.
		for(var i = 0; i < cameras.length; i++) {
			cameras[i]->setPause(true);
		}
		cameras[id]->setPause(false);
		*/
	};

	/**
	 * TODO: Fix doc
	 * Update the source of the images: remote (internet) or local (lan).
	 * Togged by a radio form on the page. 
	 */
	this.changeOptions = function()
	{
		var val = $('#options input:checked').attr('value');
		var local = (val == 'local')? true : false;

		/*if(!(val in {'local':1, 'remote':1})) {
			return;
		}*/

		// Set cameras as local or remote. 
		for(var i = 0; i < this.cameras.length; i++) {
			if(local) {
				this.cameras[i].url.setLocal();
			}
			else {
				this.cameras[i].url.setRemote();
			}
		}

		// Change row width. 
		val = $('#options option:selected').attr('value');
		this.numPerRow = parseInt(val);

		// Adjust twice.
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
		var NUM = this.numPerRow;
		var newImgWidth = Math.floor(width/NUM);
		var newImgHeight = Math.floor(newImgWidth/640 * 480);

		var resize = function() {
			this.width = newImgWidth;
			this.height = newImgHeight;
		}

		// Resize image and outer div. 
		$('img').each(resize);
		$('.multiview_cam').width(newImgWidth);

		//$('div.cam_data').width(newImgWidth);

	}
}

/**
 * For debugging.
 */
function print(text)
{
	$('#main').prepend('<h1>' + text + '</h1>');
}
