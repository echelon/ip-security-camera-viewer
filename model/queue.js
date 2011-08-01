/**
 * RequestQueue
 * Request images from the camera server, and keep a recent history.
 * Allows us to throttle camera requests, drop old frames, etc.
 */
function RequestQueue()
{
	this.queue = []; // A queue of {url, date, image}
	this.maxLength = 4;

	// References to other objects.
	this.stats = null;
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

			that.stats.loadCount++;

			// Don't update image if it's older than the current one.
			if(that.stats.dateLastLoaded_requestDate >= requestDate) {
				return;
			}

			// Update image.
			that.stats.image.src = url;
			that.camera.updateMultiviewImage();

			that.stats.dateLastLoaded = time;
			that.stats.dateLastLoaded_requestDate = requestDate;
			if(!that.stats.dateFirstLoaded) {
				that.stats.dateFirstLoaded = time;
			}

			that.camera.updateMultiviewStats();
		}

		// Fail Cb
		var onFail = function() {
			that.stats.dateLastFailed = (new Date()).getTime();
			that.stats.failCount++;
			that.camera.updateMultiviewStats();
		}

		// Abort Cb
		var onAbort = function() {
			that.stats.dateLastAborted = (new Date()).getTime();
			that.stats.abortCount++;
			that.camera.updateMultiviewStats();
		}

		// If queue is full, make room. 
		while(this.queue.length >= this.maxLength) {
			var data = this.queue.shift();
			data.image.src = "";
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

		this.stats.requestCount++;
		this.stats.dateLastRequested = now;
		if(!this.stats.dateFirstRequested) {
			this.stats.dateFirstRequested = now;
		}

		this.camera.updateMultiviewStats();
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
			if(this.queue[i].date > this.stats.dateLastLoaded_requestDate) {
				break;
			}
			found++;
		}

		if(!found) {
			return;
		}

		this.stats.cachePurgeCount += found-1;

		while(found > 0) {
			obj = this.queue.shift();
			delete obj.image;
			found--;
		}
	}
}
