/**
 * WindowView
 * Controls DOM window object interaction such as resizing.
 */

define(function(require, exports, module) {

	var WindowView = Backbone.View.extend({

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

	return WindowView;
});
