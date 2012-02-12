
define(function(require, exports, module) {

	var WindowView = require('views/window');
	var Overview = require('views/overview_main');

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

	return App;
});
