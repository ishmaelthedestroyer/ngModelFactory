/* ==========================================================================
   Constructors
   ========================================================================== */

/**
 * generic Model
 * @param data {Object} data for model
 * @returns {Model}
 * @constructor
 */
var Model = function(data) {
  if (!(this instanceof Model)) {
    return new Model(data);
  }

  EventEmitter.call(this);
  util.extend(this, mixins);

  /** reference to self */
  var alias = this;

  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      alias[key] = data[key];
    }
  }

  return alias;
};

util.inherits(Model, EventEmitter);

/* ==========================================================================
   Instance-level methods
   ========================================================================== */

/**
 * extracts the keys from the model instance, serializes into a JSON object
 * @returns {Object}
 */
Model.prototype.$serialize = function() {
  var
    alias = this,
    serializedModel = {};

  for (var key in alias) {
    if (alias.hasOwnProperty(key) && typeof alias[key] !== 'function') {
      serializedModel[key] = alias[key];
    }
  }

  // remove keys from Factory, Model, and EventEmitter
  delete serializedModel._$isLocal;
  delete serializedModel._events;

  return serializedModel;
};

/**
 * updates the local properties of a model instance
 * @param data {Object} new properties to update
 * @returns {Model}
 */
Model.prototype.$update = function(data) {
  var
    alias = this,
    oldValues = {};

  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      oldValues[key] = angular.copy(alias[key]);
      alias[key] = data[key];
    }
  }

  alias.emit('$update', alias, oldValues);
  return alias;
};

/**
 * updates (or creates if not saved) the model on the server
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @returns {$q.promise}
 */
Model.prototype.$save = function(options) {
  var
    alias = this,
    requestType = alias._$isLocal ? 'create' : 'update',
    config = util.extend({
      method: alias._$config.endpoints[requestType].method,
      path: alias._$config.endpoints[requestType].path,
      data: alias.$serialize(),
      map: { ':id': alias._id },
      ignoreCache: true,
      throttle: false
    }, options),
    promise = alias.$request(config);

  promise.then(function(model) {
    if (alias._$isLocal) {
      delete alias._$isLocal;
    }

    alias.$update(model);
  });

  return promise;
};

/**
 * makes a request to the server to load any updates
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @returns {$q.promise}
 */
Model.prototype.$reload = function(options) {
  var
    alias = this,
    requestType = 'find',
    config = util.extend({
      method: alias._$config.endpoints[requestType].method,
      path: alias._$config.endpoints[requestType].path,
      map: { ':id': alias._id },
      ignoreCache: true,
      throttle: false
    }, options),
    promise = alias.$request(config);

  promise.then(function(response) {
    alias.$update(response);
  });

  return promise;
};

/**
 * deletes the model on the server
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @returns {$q.promise}
 */
Model.prototype.$delete = function(options) {
  var
    alias = this,
    requestType = 'del',
    config = util.extend({
      method: alias._$config.endpoints[requestType].method,
      path: alias._$config.endpoints[requestType].path,
      map: { ':id': alias._id },
      ignoreCache: true,
      throttle: true
    }, options);

  alias.emit('$delete', alias);
  return alias.$request(config);
};