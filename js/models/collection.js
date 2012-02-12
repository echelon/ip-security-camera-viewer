
define(function(require, exports, module) {

	var Camera = require('./camera');
	
	var CameraCollection = Backbone.Collection.extend({
		model: Camera 
	});

	return CameraCollection;

});
