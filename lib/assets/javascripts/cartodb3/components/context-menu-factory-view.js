var _ = require('underscore');
var CoreView = require('backbone/core-view');
var ContextMenuView = require('./context-menu/context-menu-view');
var CustomListCollection = require('./custom-list/custom-list-collection');
var template = require('./context-menu-factory.tpl');

var REQUIRED_OPTS = [
  'menuItems'
];

module.exports = CoreView.extend({
  className: 'CDB-Shape',

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (item) {
      if (opts[item] === undefined) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);

    this.template = opts.template || template;
    this._initContextMenu(this._menuItems);

    this._bindedToggle = this._onToggleContextMenuClicked.bind(this);
  },

  render: function () {
    this.clearSubViews();
    this._unbindTrigger();
    this.$el.html(this.template({
      cid: 'context-menu-trigger-' + this.cid
    }));
    this._bindTrigger();
    return this;
  },

  _bindTrigger: function () {
    var trigger = this._getTrigger();
    trigger && trigger.on('click', this._bindedToggle);
  },

  _unbindTrigger: function () {
    var trigger = this._getTrigger();
    trigger && trigger.off('click', this._bindedToggle);
  },

  _getTrigger: function () {
    return this.$('#context-menu-trigger-' + this.cid);
  },

  _initContextMenu: function (items) {
    this._menuItems = new CustomListCollection(items);
    this._menuItems.on('change:selected', this._onContextMenuSelect, this);
    this.add_related_model(this._menuItems);
  },

  _onContextMenuSelect: function (menuItem) {
    var action = menuItem.get('action');
    action && action.call(this);
  },

  _showContextMenu: function (position) {
    var triggerElementID = 'context-menu-trigger-' + this.cid;
    var menuItems = this._menuItems;

    this._resetContextMenuItems();
    this._menuView = new ContextMenuView({
      collection: menuItems,
      triggerElementID: triggerElementID,
      position: position
    });

    this._menuView.model.on('change:visible', function (model, isContextMenuVisible) {
      if (this._hasContextMenu() && !isContextMenuVisible) {
        this._hideContextMenu();
      }
    }, this);

    this._menuView.show();
    this.addView(this._menuView);
  },

  _resetContextMenuItems: function () {
    var selected = this._menuItems.getSelectedItem();
    selected && selected.set({selected: false}, {silent: true});
  },

  _hasContextMenu: function () {
    return this._menuView != null;
  },

  _hideContextMenu: function () {
    this._menuView.remove();
    this.removeView(this._menuView);
    delete this._menuView;
  },

  _onToggleContextMenuClicked: function (event) {
    event.preventDefault();
    if (this._hasContextMenu()) {
      this._hideContextMenu();
    } else {
      this._showContextMenu({
        x: event.pageX,
        y: event.pageY
      });
    }
  },

  getContextMenu: function () {
    return this._menuView;
  },

  clean: function () {
    this._unbindTrigger();
    CoreView.prototype.clean.call(this);
  }
});
