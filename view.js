/**
 * View class
 * Manipulates the page DOM under instructions from the Controller.
 * Responsible for initial setup and DOM state changes.
 */
function View(controller)
{
	// Canvases
	this.canvases = [];

	// Object references.
	this.controller = typeof(controller) != 'undefined' ? controller : null;
	this.cameras = typeof(controller) != 'undefined'? controller.cameras : [];

	// Default view values
	this.multiviewImagesPerRow = 2;

	// Selector prototypes. Append 'id' to select individual cams.
	this.MULTIVIEW_IMAGE_SELECTOR = '#main #multiview_cam_';
	this.MULTIVIEW_TITLE_SELECTOR = '#main #multiview_title_';
	this.SINGLEVIEW_IMAGE_SELECTOR = '#main #singleview_cam_';
	this.SINGLEVIEW_STATS_SELECTOR = '#main #singleview_stats_';

	// Absolute selectors.
	this.OPTIONS_SELECTOR = '#options';

	/**
	 * Setup the DOM for the cameras.
	 * Necessary to perform once camera JSON is loaded, and once again
	 * if a new set of cameras is to replace them. 
	 */
	this.initCameraDom = function()
	{
		var that = this;
		var defaultImage = './img/unavailable.png';

		// Load cameras. (FIXME: Poor form)
		this.cameras = this.controller.cameras;

		// If SVG support, use SVG default image.
		if(document.implementation.hasFeature(
			"http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) {
				defaultImage = './img/unavailable.svg';
		}

		// Mobile firefox doesn't resize SVG correctly.
		// FIXME: Pathetic fix. 
		if(navigator.userAgent.search('Mozilla.*Android') > -1) {
			defaultImage = './img/unavailable.png';
		}

		// Prevent "page loading..." icon from persisting indefinitely.
		// XXX: Be careful! If any other media remains to load, it won't!
		// XXX/NOTE: Does not seem to be the cause of Android's browser
		// weird behavior wrt images. Firefox mobile works fine. 
		var temp = new Image();
		temp.onload = function(){ window.stop(); };
		temp.src = defaultImage;

		// Create templates for each camera
		for(var i = 0; i < this.cameras.length; i++)
		{
			var cam = this.cameras[i];
			var camSelector = this.MULTIVIEW_IMAGE_SELECTOR + i;
			var singleSelector = this.SINGLEVIEW_IMAGE_SELECTOR + i;
			var data = {};
			var tpl;
			var item;
			var canvas;
	
			// Lazy copy the camera keys. 
			for(var k in cam) {
				data[k] = cam[k];
			}
			data['id'] = i;
			data['camDefaultImage'] = defaultImage;

			// Attach image
			tpl = $('#multiviewTemplate').tmpl(data);
			tpl.appendTo('#main');

			// Prepend image titlebar
			tpl = $('#multiviewTitleTemplate').tmpl(data);
			tpl.prependTo(camSelector);

			// Singleview templates.
			tpl = $('#singleviewTemplate').tmpl(data);
			tpl.appendTo('#main');
			tpl.hide();

			// Prepend singleview stats. 
			tpl = $('#singleviewStatsTemplate').tmpl(data);
			tpl.prependTo(singleSelector);
			tpl.hide();

			// Create singleview canvas.
			canvas = new CameraCanvas(camSelector + ' canvas');
			canvas.camera = cam;
			canvas.defaultImage = temp;
			this.canvases.push(canvas);
	
			// Disable right click menu on multiview camera images
			$(camSelector).bind('contextmenu', function(){ return false; });
			$(".singleview_cam").bind('contextmenu', function(){ 
				return false; });

			// Install callbacks.
			$(".singleview_cam").mousedown((function(cam) {
				return function(ev) { 
					that.controller.clickSingleviewCam(cam, ev); };
			})(cam));

			$(camSelector).mousedown((function(cam) {
				return function(ev) { 
					that.controller.clickMultiviewCam(cam, ev); };
			})(cam));
		}
	}

	/**
	 * Callback used by a refreshing camera after the latest frame
	 * loads in order to update its image, statistics, etc.
	 * Input: Camera object. 
	 * FIXME: Terrible, unorganized mess. 
	 */
	this.updateCameraView = function(cam)
	{
		var node;
		var tpl;
		var mSelector = this.MULTIVIEW_IMAGE_SELECTOR + cam.id;
		var sSelector = this.SINGLEVIEW_IMAGE_SELECTOR + cam.id;
		var canvas = this.canvases[cam.id]; // FIXME: Bad way to reference

		// Title formatted times. 
		var getTime = function(time, seconds) 
		{
			var d = new Date(time);
			var s = "";

			if(!time) {
				return " &mdash; ";
			}

			s += d.getHours() + ":";
			s += (d.getMinutes() < 10)? "0" + d.getMinutes() : d.getMinutes(); 

			if(seconds) {
				s+= ":";
				s+= (d.getSeconds()<10)? "0" + d.getSeconds() : d.getSeconds();
			}

			delete d;
			return s;
		}

		// Update fallback image
		if(cam.curFrame.src) {
			$(mSelector + ' img').attr('src', cam.curFrame.src);
			$(sSelector + ' img').attr('src', cam.curFrame.src);
		}

		// Update canvas
		// TODO: Check for canvas support: if(canvas.getContext) {...}
		if(cam.curFrame.src) {
			canvas.draw();
			/*var canvas = $(mSelector + ' canvas')[0];
			var ctx = canvas.getContext('2d');
			ctx.fillStyle = "rgb(200,0,0)";
			ctx.fillRect(0, 0, 600, 450);*/

		}

		// Update image titlebar (name, a few stats, ...)
		node = $(this.MULTIVIEW_TITLE_SELECTOR + cam.id);

		tpl = node.tmplItem();
		tpl.data['cameraName'] = cam.location;
		tpl.data['timeLastLoaded'] = getTime(cam.times.lastLoaded);
		var percent = cam.queue? cam.queue.percentFull()*100 : 0;
		tpl.data['queuePercent'] = percent.toFixed(1);

		var fps = ((new Date()).getTime() - 
				cam.times.firstRequested) / 1000;
		tpl.data['fps'] = (cam.counts.load / fps).toFixed(3);
		tpl.update();

		// Update singleview stats
		node = $(this.SINGLEVIEW_STATS_SELECTOR + cam.id);

		tpl = node.tmplItem();

		// Lazy copy dictionary
		for(var k in cam) {
			tpl.data[k] = cam[k];
		}

		// TODO: Report queue stats, FPS, delta times, etc. Also include title.
		tpl.data['timeFirstRequested'] = 
			getTime(cam.times.firstRequested, 1);
		tpl.data['timeFirstLoaded'] = getTime(cam.times.firstLoaded, 1);
		tpl.data['timeLastRequested'] = getTime(cam.times.lastRequested, 1);
		tpl.data['timeLastLoadedRequested'] = 
			getTime(cam.times.lastLoaded_requestDate, 1);
		tpl.data['timeLastLoaded'] = getTime(cam.times.lastLoaded, 1);
		tpl.data['timeLastFailed'] = getTime(cam.times.lastFailed, 1);
		tpl.data['timeLastAborted'] = getTime(cam.times.lastAborted, 1);
		tpl.update();

		// XXX: calling update() on templates overwrites sizeWindow(), 
		// so we must call it again to maintain proper sizing. 
		this.sizeWindow();
	}

	/**
	 * Switch to the all-cameras view.
	 */
	this.multiview = function()
	{
		$(".singleview_cam").hide();
		$(".singleview_stats").hide();
		$(".multiview_cam").show();

		for(var i = 0; i < this.cameras.length; i++) {
			this.cameras[i].setPause(false);
		}

		// Heuristic fix for UI 'glitching' out (incorrect col size)
		this.sizeWindow();
	}

	/**
	 * Switch to the single camera view.
	 * Input: Camera object of the camera we wish to display. 
	 */
	// TODO: Stats, including: URL, queue size, wait time, etc.
	this.singleview = function(cam)
	{
		var select = this.SINGLEVIEW_IMAGE_SELECTOR + cam.id;

		$(".multiview_cam").hide();
		$(select).show();
		$(select + " .singleview_stats").show();

		for(var i = 0; i < this.cameras.length; i++) {
			if(cam.id == i) {
				continue;
			}
			this.cameras[i].setPause(true);
		}

		// Heuristic fix for UI 'glitching' out (incorrect col size)
		this.sizeWindow();
	}

	/**
	 * Resize the image blocks to fit the window. Fits multiple images 
	 * per row, as configured.
	 */
	this.sizeWindow = function(width, height)
	{
		var NUM, newImgWidth, newImgHeight, resize;

		// If called without params, get current window dimensions
		width = (typeof(width) != 'undefined')? width : $(window).width();
		height = (typeof(height) != 'undefined')? height : $(window).height();

		NUM = this.multiviewImagesPerRow;
		newImgWidth = Math.floor(width/NUM);
		newImgHeight = Math.floor(newImgWidth/640 * 480);

		resize = function() {
			this.width = newImgWidth;
			this.height = newImgHeight;
		}

		// Resize multiview image and outer div. 
		$('img').each(resize);
		$('.multiview_cam').width(newImgWidth);

		// Resize multiview canvas
		for(var i = 0; i < this.canvases.length; i++) {
			this.canvases[i].resize(newImgWidth, newImgHeight);
		}

		// Resize singleview images.
		var SINGLE_SCALE = 0.60;
		$('.singleview_cam img').width(Math.floor(width * SINGLE_SCALE));
		$('.singleview_cam img').height(
				Math.floor((width * SINGLE_SCALE)/640 * 480));

		$('div.singleview_stats').width(
				Math.floor(width * (1.0 - SINGLE_SCALE)));
	}

	/**
	 * Get the selected row width from the options form.
	 */
	this.getOptionRowWidth = function()
	{
		var val = parseInt($('#options option:selected').attr('value'));
		return (val > 0 && val < 7)? val : 1;
	}

	/**
	 * Get the selected server (local or remote) from the options form.
	 */
	this.getOptionServer = function() 
	{
		var val = $('#options input:checked').attr('value');
		return (val == 'local')? 'local' : 'remote';
	}
}

/**
 * For debugging.
 */
function print(text)
{
	$('#main').prepend('<h1>' + text + '</h1>');
}
