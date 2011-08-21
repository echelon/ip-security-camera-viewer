/**
 * Draw frames to canvas.
 */
function CameraCanvas(selector)
{
	// Canvas DOM and context
	this.canvas = null;
	this.context = null;

	// Camera object
	this.camera = null;

	// Default image
	this.defaultImage = null;

	// Canvas size 
	this._width = 0;
	this._height = 0;

	if(typeof(selector) != null) {
		this.canvas = $(selector)[0];
		this.context = this.canvas.getContext('2d');
	}

	this.resize = function(width, height)
	{
		this._width = width;
		this._height = height;

		this.canvas.width = width;
		this.canvas.height = height;

		this.draw();
	}

	this.draw = function()
	{
		var ctx = this.canvas.getContext('2d');
		var source = this.defaultImage;

		// TODO: 'needs redraw' flag

		if(this.camera.curFrame && this.camera.curFrame.src) {
			source = this.camera.curFrame;
		}

		try {
			ctx.drawImage(source, 0, 0, this._width, this._height);
		}
		catch(e) {
			// pass
		}

		if(this.camera.isPaused) {
			// Pause bars
			var barW = this._width / 8;
			var barH = this._height / 1.5;

			var hx = this._width / 2;
			var hy = this._height / 2;
			var sepW = barW / 1.5;

			var sx1 = hx - barW - sepW/2;
			var sx2 = hx + sepW/2;
			var sy = hy - barH/2;

			ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
			ctx.fillRect(sx1, sy, barW, barH);

			ctx.fillStyle = "rgba(205, 255, 255, 0.7)";
			ctx.fillRect(sx2, sy, barW, barH);
		}
	}
};

