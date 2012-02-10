/**
 * RequestQueue2
 *
 * XXX/NOTE: This is a work-in-progress port of the old RequestQueue
 * I'm not even sure that a per-camera queue is a good design decision--
 * perhaps a global queue would be better.
 *
 * Request images from the camera server, and keep a recent history.
 * Allows us to throttle camera requests, drop old frames, etc.
 */
function RequestQueue2()
{
	this.queue = []; // A queue of {url, date, image}
	this.maxLength = 4;

	// References to other objects.
	this.camera = null;

	/**
	 * Make a request to the image server.
	 * Has internal callbacks that handle state information.
	 */
	this.request = function(url) 
	{
		var that = this;
		var d = new Date();
		var now = d.getTime();
		var entry = {};

		// Success Cb
		var onLoad = function(url, requestDate)
		{
			var time = (new Date()).getTime();

			that.camera.counts.load++;

			// Don't update image if it's older than the current one.
			if(that.camera.times.lastLoaded_requestDate >= requestDate) {
				return;
			}

			// Update image.
			that.camera.curFrame.src = url;

			// TODO/FIXME [android-webkit-bug]
			// XXX: Stupid Android Webkit (only) bug?
			// onLoad() fires, but image is not complete!
			if(!that.camera.curFrame.complete) {
				console.log('Image load incomplete: ' + url);
				that.camera.counts.load--;
				return;
			}

			that.camera.times.lastLoaded = time;
			that.camera.times.lastLoaded_requestDate = requestDate;
			if(!that.camera.times.firstLoaded) {
				that.camera.times.firstLoaded = time;
			}

			// FIXME: There has to be a better way of doing this
			that.camera.updateView();
		}

		// Fail Cb
		var onFail = function() {
			that.camera.times.lastFailed = (new Date()).getTime();
			that.camera.counts.fail++;
			that.camera.controller.view.updateCameraView(that.camera);
			// FIXME: There has to be a better way of doing this
			that.camera.updateView();
		}

		// Abort Cb
		var onAbort = function() {
			that.camera.times.lastAborted = (new Date()).getTime();
			that.camera.counts.abort++;
			// FIXME: There has to be a better way of doing this
			that.camera.updateView();
		}

		// If queue is full, make room. 
		while(this.queue.length >= this.maxLength) {
			var data = this.queue.shift();
			data.image.src = null;
		}

		// Perform request
		entry['url'] = url;
		entry['date'] = now;

		entry['image'] = new Image();
		entry['image'].onload = function() { onLoad(url, now); };
		entry['image'].onerror = function() { onFail(); };
		entry['image'].onabort = function() { onAbort(); };
		entry['image'].src = url;

		this.queue.push(entry);

		// TODO: Set Stats -- 
		this.camera.counts.request++;
		this.camera.times.lastRequested = now;
		if(!this.camera.times.firstRequested) {
			this.camera.times.firstRequested = now;
		}

		// FIXME: There has to be a better way of doing this
		that.camera.updateView();
	}

	/**
	 * Queue capacity exhausted?
	 */
	this.isFull = function()
	{
		return this.queue.length >= this.maxLength;
	}

	/**
	 * Percentage of queue used.
	 */
	this.percentFull = function()
	{
		return this.queue.length / this.maxLength;
	}

	/**
	 * Age of the last queue item.
	 */
	this.newest = function()
	{
		if(this.queue.length == 0) {
			return null;
		}
		return this.queue[this.queue.length-1].date;
	}

	/**
	 * Age of the first queue item.
	 */
	this.oldest = function()
	{
		if(this.queue.length == 0) {
			return null;
		}
		return this.queue[0].date;
	}

	/**
	 * Purge all queue items from before (and including) last met 
	 * request date.
	 */
	this.purgeOld = function()
	{
		var found = 0;
		var obj = null;

		for(var i = 0; i < this.queue.length; i++) {
			if(this.queue[i].date > this.camera.times.lastLoaded_requestDate) {
				break;
			}
			found++;
		}

		if(!found) {
			return;
		}

		this.camera.counts.cachePurge += found-1;

		while(found > 0) {
			obj = this.queue.shift();
			delete obj.image;
			found--;
		}
	}
}
