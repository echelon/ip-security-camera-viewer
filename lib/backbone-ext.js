/**
 * Backbone inheritance, from https://gist.github.com/1271041
 * Give backbone an easier way to access super properties and methods.
 */ 
var parent = function(attribute, options)
{ 
	/**
	 * Call this inside of the child initialize method. 
	 * If it's a view, this will extend events also. 
	 * this.parent('inherit', this.options); -- a view's params get set to
	 * this.options.
	 */
	if(attribute == 'inherit') {
		this.parent('initialize', options);

		// Extend child events 
		if(this.events) {
			$.extend(this.events, this.parent('events'));
			this.delegateEvents();
		}
		return;
	}

	/**
	 * Call other parent methods and attributes anywhere else.
	 * this.parent('parentMethodOrOverriddenMethod', params)
	 * this.parent('parentOrOverridenAttribute')
	 */
	return (_.isFunction(this.constructor.__super__[attribute])) ? 
		this.constructor.__super__[attribute].apply(this, _.rest(arguments)) :
		this.constructor.__super__[attribute];
};

Backbone.View.prototype.parent = parent;
Backbone.Model.prototype.parent = parent;
Backbone.Collection.prototype.parent = parent;


