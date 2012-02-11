// TODO: Nice mathematical model of how to hold historical images
// Say we hold 10, divide runtime by 10 and keep those frames. -- but 
// this needs to 'scale dynamically' somehow. ALso, consider a lopsided 
// density function putting more images at one side of the curve...

var App = Backbone.View.extend({

	// Camera Collection
	cameras: null,

	// Views
	window: null,
	overview: null,

	/**
	 * Setup the application.
	 */
	initManual: function()
	{
		// First: Load cameras. 
		//this.cameras; 
		
		// Window state observer (FIXME: Poor design)
		this.window = new WindowView();

		// Initialize overview
		this.overview = new Overview();
		this.overview.render();
		this.overview.resize();
	},

	/**
	 * Main loop controls image loading, etc.
	 * FIXME: Should be private or toggleable/only callable once. 
	 * XXX: Only called once, by constructor!
	 */
	mainLoop: function()
	{
		var that = this;
		var now = (new Date()).getTime();
		var cam = null;

		console.log('Main Loop @ ' + now);

		// Purge old items from the queue.
		// This only occurs when a successful hit is made. 
		for(var i = 0; i < this.cameras.length; i++) {
			cam = this.cameras.at(i);
			cam.queue.purgeOld();
		}

		// Perform requests. 
		// Requests are throttled by queue size and can be paused entirely.
		for(var i = 0; i < this.cameras.length; i++)
		{
			cam = this.cameras.at(i);

			if(cam.isPaused) {
				continue;
			}

			// Throttle requests by the size of the queue. 
			cam.throttle = Math.round(7000 * cam.queue.percentFull());
			if(cam.queue.newest() + cam.throttle > now) {
				continue;
			}

			cam.queue.request(cam.getImageUrl());
		}

		// that - prevents binding of 'this' to DomWindow
		//setTimeout(function() { that.mainLoop() }, 800);
		setTimeout(function() { that.mainLoop() }, 800 + 10000);
	}

});


/**
 * WindowView
 * Controls DOM window object interaction such as resizing.
 */
var WindowView = Backbone.View.extend({ // TODO rename cam.views.Window

	el: $(window),

	render: function(ev) {
	},

	events: {
		'resize': 'resized'
	},

	/**
	 * Resize the image blocks to fit the window.
	 * TODO: For gallery and single view(s). 
	 */
	resized: function(ev) {
		// TODO: To be computationally efficient, we may only want to do 
		// this for the current view. As views are switched, we may then
		// need to keep track of resize state -- if stale, resize before
		// the switch is complete. 
		window.app.overview.resize();
	}
});


/**
 * Overview
 * Shows lots of cameras at once. 
 * The main landing view
 */
var Overview = Backbone.View.extend({

	// Already present in document DOM. 
	el: '#overview',

	// Cameras per row (default)
	cams_per_row: 3,

	// Width and height 
	// Typically these are sent directly via jQuery, but these 
	// values are set and preserved in case the template needs 
	// complete rerendering. 
	width: 480,
	height: 320,

	// DOM events.
	events: {
		'change #overview_options':	'changeOpts'
	},

	/**
	 * CTOR
	 * Install callbacks, etc.
	 */
	initialize: function() {
		///$('#options').change(function(){ this.changeOptions(); });
		//$(window).resize(this.resize);
		//this.cams_per_row = 3;
	},

	/**
	 * Render
	 * Update this.el's HTML, which calls for generating an
	 * NxM table per the size option.
	 */
	render: function(ev) {
		var cams = window.app.cameras;
		var cols = this.cams_per_row;
		var rows = Math.ceil(cams.length / cols);

		// FIXME: Any way to do in one loop with jQuery?
		// 1. Construct a table.
		var t = '<table>\n';
		for(var i = 0; i < rows; i++) {
			t += '<tr>\n';
			for(var j = 0; j < cols; j++) {
				var c = (i * cols) + j;
				t += '<td id="view_col_' + c + '">'; // {id=view_col_#}
			}
			t += '</tr>';
		}
		t += '</table>';

		$('#overview_main').html(t);

		// 2. Attach rendered panes
		for(var i = 0; i < rows; i++) {
			for(var j = 0; j < cols; j++) {
				var c = (i * cols) + j;
				if(c >= cams.length) {
					continue;
				}
				var cam = cams.at(c);
				$('#view_col_' + c).append(cam.view.render().el);
			}
		}

		// Make sure the images are properly sized.
		this.resize();
		return this;
	},

	// Set the number of cams per row, and re-render. 
	setCamsPerRow: function(cols) {
		// TODO: Verify integer
		if(typeof cols != 'number' || cols < 1 || cols > 6) {
			console.log('Error: Invalid row size.');
			return;
		}
		this.cams_per_row = cols;
		return this.render();
	},

	resize: function() {
		// TODO: Need to verify resizing is 100% correct in all browsers.
		var width = $(document).width();
		var bWidth = $('#overview').innerWidth();

		width = (width < bWidth)? width : bWidth;

		var NUM = this.cams_per_row;
		var newImgWidth = Math.floor(width/NUM);
		var newImgHeight = Math.floor(newImgWidth/640 * 480);

		var resize = function() {
			this.width = newImgWidth;
			this.height = newImgHeight;
		}

		// Resize images
		// TODO: What about other views and elements?
		$('#overview img').each(resize);

		// FIXME FIXME FIXME BAD CALL.
		this.width = newImgWidth;
		this.height = newImgHeight;
	},

	// Handle option changes.
	changeOpts: function() {
		var c = parseInt($('#overview_options option:selected').attr('value'));
		this.setCamsPerRow(c);
	},

	// Show DOM
	show: function() {
		$(this.el).show();
	},

	// Hide DOM
	hide: function() {
		$(this.el).hide();
	}
});


/**
 * Overview Mode - Camera pane.
 * Each camera in the overview has an instance of this as a view.
 */
var Overview_CameraPane = Backbone.View.extend({

	// Programatically create 'el'
	tagName: 'div',
	className: 'cameraview',

	// Cache template -- TODO: Can't do yet!
	//template: _.template($('#tpl_overview_camera').html()),
	
	needsRender: true,

	// TODO: CTOR
	initialize: function() {
		// Callback when image refreshes, stats refresh...
		this.model.bind('change', this.update, this);

		// Just so I have another way to reference things.
		$(this.el).attr('id', this.cid);

		this.needsRender = true;
	},

	/**
	 * The render call updates this.el's HTML.
	 * TODO:
	 * There are two ways to accomplish this: (re)compilation of the 
	 * entire DOM template, or simply resetting the values in-place.
	 * If we used the former method exclusively, we would have 
	 * flickering images.
	 * 
	 * Also: 
	 * this.el attachment to the DOM is mediated by the Overview view.
	 */
	render: function(ev) {
		var json = this.model.toJSON();

		if(this.needsRender) {
			// Compile template with underscore.js
			// TODO: Keep these precompiled templates somewhere
			var template = _.template($('#tpl_overview_camera_pane').html());

			// Load compiled HTML into 'el'
			$(this.el).html(template({
				name:	json.name,
				url:	json.curImage,
				loadCt:	json.c_load,
				width:	window.app.overview.width, // FIXME: Globals bad?
				height:	window.app.overview.height
			}));

			this.needsRender = false;

		} else {
			$('#' + this.cid + ' img').attr('src', json.curImage);
			console.log(json.c_load);
			$('#' + this.cid + ' .count').html('Load Count: ' + json.c_load);
		}

		return this;
	},

	update: function() {

	},

	events: {
		'click':		'someFunction'
	},

	someFunction: function(ev) {
		// TODO
	}
});

