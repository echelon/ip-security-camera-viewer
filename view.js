
/**
 * Represents the page view.
 */
function View(controller)
{
	// Object references.
	this.controller = typeof(controller) != 'undefined' ? controller : null;
	this.cameras = typeof(controller) != 'undefined'? controller.cameras : [];

	// Default view values
	this.multiviewImagesPerRow = 2;

	// Selector prototypes. Append 'id' to select individual cams.
	this.MULTIVIEW_IMAGE_SELECTOR = '#main #multiview_cam_';
	this.MULTIVIEW_TITLE_SELECTOR = '#main #multiview_title_';
	this.SINGLEVIEW_IMAGE_SELECTOR = '#main #singleview_cam_';
	this.SINGLEVIEW_TITLE_SELECTOR = 'TODO';
	this.SINGLEVIEW_STATS_SELECTOR = 'TODO';

	/**
	 * Setup the DOM for the cameras.
	 * Necessary to perform once cameras are loaded, and once again if
	 * a new set is loaded. 
	 */
	this.initCameraDom = function()
	{
		var that = this;
		var defaultImage = './img/unavailable.png';

		// Load cameras. (TODO: Not best)
		this.cameras = this.controller.cameras;

		// If SVG support, use SVG default image.
		if(document.implementation.hasFeature(
			"http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) {
				defaultImage = './img/unavailable.svg';
		}

		// Create templates for each camera
		for(var i = 0; i < this.cameras.length; i++)
		{
			var cam = this.cameras[i];
			var camSelector = this.MULTIVIEW_IMAGE_SELECTOR + i;
			var data;
			var tpl;
			var item;
		
			// FIXME: Assign camera id during load.
			cam.id = i;

			// FIXME: this isn't right...
			data = cam.stats;
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

			// Install callbacks.
			$(".singleview_cam").click(function(){ that.multiview(); });
			$(camSelector).click((function(cam) {
				return function() { that.singleview(cam); };
			})(cam));
		}
	}

	/**
	 * Called by a refreshing camera
	 * Update image, statistics, etc.
	 */
	this.updateCameraView = function(cam)
	{
		var node;
		var img;
		var tpl;
		var mSelector = this.MULTIVIEW_IMAGE_SELECTOR + cam.id;
		var sSelector = this.SINGLEVIEW_IMAGE_SELECTOR + cam.id;

		// Title formatted times. 
		var getTime = function(time) 
		{
			var d = new Date(time);
			var s = "";

			if(!time) {
				return " &mdash; ";
			}

			s += d.getHours() + ":";
			s += (d.getMinutes() < 10)? "0" + d.getMinutes() : d.getMinutes(); 

			delete d;
			return s;
		}

		// Update image
		if(cam.stats.image.src) {
			$(mSelector + ' img').attr('src', cam.stats.image.src);
			$(sSelector + ' img').attr('src', cam.stats.image.src);
		}

		// Update image titlebar (name, a few stats, ...)
		node = $(this.MULTIVIEW_TITLE_SELECTOR + cam.id);

		/*if(node.length == 0) {
			return;
		}*/

		tpl = node.tmplItem();
		tpl.data['cameraName'] = cam.location;
		tpl.data['timeLastLoaded'] = getTime(cam.stats.dateLastLoaded);
		tpl.data['loadCount'] = cam.stats.loadCount;
		var percent = cam.queue? cam.queue.percentFull()*100 : 0;
		tpl.data['queuePercent'] = percent.toFixed(1);

		var fps = ((new Date()).getTime() - 
				cam.stats.dateFirstRequested) / 1000;
		tpl.data['fps'] = (cam.stats.loadCount / fps).toFixed(3);
		tpl.update();
	}

	/**
	 * Switch to the all-cameras view.
	 */
	this.multiview = function()
	{
		$(".singleview_cam").hide();
		$(".multiview_cam").show();

		for(var i = 0; i < this.cameras.length; i++) {
			this.cameras[i].setPause(false);
		}
	}

	/**
	 * Switch to the single camera view.
	 */
	this.singleview = function(cam)
	{
		$(".multiview_cam").hide();
		$(this.SINGLEVIEW_IMAGE_SELECTOR + cam.id).show();

		for(var i = 0; i < this.cameras.length; i++) {
			if(cam.id == i) {
				continue;
			}
			this.cameras[i].setPause(true);
		}
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
