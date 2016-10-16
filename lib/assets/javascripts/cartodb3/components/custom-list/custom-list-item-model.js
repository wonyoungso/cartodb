var Backbone = require('backbone');
var _ = require('underscore');

/*
 *  List item model
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    selected: false
  },

  getName: function () {
    var label =  (this.get('label') == null) ? this.getValue() : this.get('label'); // eslint-disable-line
    return _.isFunction(label) ? label() : label;
  },

  getValue: function () {
    return this.get('val');
  }

});
