// FIXME: Uses globals!

/**
 * Overview Mode - Camera pane.
 * Each camera in the overview has an instance of this as a view.
 */

define(function(require, exports, module) {

	var Pane = Backbone.View.extend({

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

	return Pane;
});
