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
	this.cameraid = 0; // TODO TEMP

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
		var json = that.camera.toJSON();

		/**
		 * Success Callback
		 */
		var onLoad = function(url, requestDate)
		{
			var time = (new Date()).getTime();

			var temp = new Image();
			temp.src = url;
			
			// This is the object we'll be sending to our backbone Model
			var json = that.camera.toJSON();

			json.c_load++;

			// Don't update image if it's older than the current one.
			if(json.c_lastLoaded_requestDate >= requestDate) {
				that.camera.set(json);
				return;
			}

			// TODO/FIXME [android-webkit-bug]
			// XXX: Stupid Android Webkit (only) bug?
			// onLoad() fires, but image is not complete!
			//if(!that.camera.curFrame.complete) {
			if(!temp.complete) {
				//console.log('Image load incomplete: ' + url);
				json.c_load--;
				that.camera.set(json);
				return;
			}

			// Update image.
			json.curImage = url;

			json.t_lastLoaded = time;
			json.t_lastLoaded_requestDate = requestDate;

			if(!json.t_firstLoaded) {
				json.t_firstLoaded = time;
			}

			that.camera.set(json);
		}

		// Fail Cb
		var onFail = function() {
			var json = that.camera.toJSON();
			json.t_lastFailed = (new Date()).getTime();
			json.c_fail++;
			that.camera.set(json);
		}

		// Abort Cb
		var onAbort = function() {
			var json = that.camera.toJSON();
			json.t_lastAborted = (new Date()).getTime();
			json.c_abort++;
			that.camera.set(json);
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

		// Set Stats -- 
		json.c_request++;
		json.t_lastRequested = now;

		if(!json.t_firstRequested) {
			json.t_firstRequested = now;
		}

		that.camera.set(json);
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
