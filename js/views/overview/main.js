/**
 * Overview
 * Shows lots of cameras at once. 
 * The main landing view
 */
define(function(require, exports, module) {

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
			var c = parseInt($('#overview_options option:selected')
								.attr('value'));
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

	return Overview;
});
