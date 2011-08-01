/**
 * TODO: Rename this.
 */

function Data()
{
	// Load times 
	this.dateFirstRequested = null;
	this.dateFirstLoaded = null;
	this.dateLastRequested = null;
	this.dateLastLoaded = null;
	this.dateLastLoaded_requestDate = null; // Request date of last loaded
	this.dateLastFailed = null;
	this.dateLastAborted = null;

	// Counts
	this.requestCount = 0;
	this.loadCount = 0;
	this.failCount = 0;
	this.abortCount= 0;
	this.cachePurgeCount = 0; // Purged from cache before loaded.

	// Throttle
	this.throttle = 0; // Dynamically updated; in ms

	// Current frame.
	this.image = new Image();
}
