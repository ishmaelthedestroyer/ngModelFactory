angular.module("Model", ["EventEmitter", "Endpoint", "Util"])
.service("Model", [
"$log",
"$q",
"Endpoint",
"EventEmitter",
"Util",
function($log, $q, Endpoint, EventEmitter, util) {

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
  var alias = this;

  for (var key in data) {
    alias[key] = data[key];
  }

  return alias;
};

// inherit from `EventEmitter`, setup default configuration
util.inherits(Model, EventEmitter);

/* ==========================================================================
   Class-level methods & properties
   ========================================================================== */

/**
 * used as a key / store to monitor duplicate and pending outgoing requests for the same data
 * @type {Object}
 */
Model._$throttle = {};

/**
 * performs a CRUD request
 * @param type {String} CRUD type
 * @param id {String} id of object to request
 * @param data {Object} optional data to send if PUT, POST, or DELETE request
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @param ignoreCache {Boolean} specifies that if the item is already in the cache, make another request anyways
 * @returns {$q.promise}
 */
Model._$request = function(type, id, data, options, ignoreCache) {
  var
    alias = this,
    path = alias._$config.endpoints[type].path,
    throttleKey,
    config;

  /*
   * @param page {Number} optional page, if paginating
   * @param perPage {Number} optional items to return per page, if paginating
   */

  while (path !== (path = path.replace(':id', id))) {
    // do nothing; iterate until all instances of `:id` replaced with the actual id
  }

  config = angular.extend({
    method: alias._$config.endpoints[type].method,
    path: path
  }, options);

  if (data) {
    config.data = data;
  }

  throttleKey = config.method + config.path;
  if (Model._$throttle[throttleKey]) {
    return Model._$throttle[throttleKey];
  }

  var promise = new Endpoint.Request(config).execute();
  Model._$throttle[throttleKey] = promise;
  promise.finally(function() {
    delete Model._$throttle[throttleKey];
  })

  return promise;
};

/**
 * sets up configuration for the class
 * @param config {Object} custom configuration
 * @returns {Model}
 */
Model._$init = function(config) {
  var

    alias = this,

    /**
     * default configuration for the model
     */
    configDefaults = {
      /**
       * configuration for communicating with RESTful endpoints
       */
      endpoints: {

        /**
         * optional prefix for the endpoints
         * @type {String}
         */
        prefix: '',

        /**
         * HTTP method + path for `list` requests
         */
        list: { method: 'GET', path: '/models' },

        /**
         * HTTP method + path for `find` requests
         */
        find: { method: 'GET', path: '/models/:id' },

        /**
         * HTTP method + path for `create` requests
         */
        create: { method: 'POST', path: '/models' },

        /**
         * HTTP method + path for `update` requests
         */
        update: { method: 'PUT', path: '/models/:id' },

        /**
         * HTTP method + path for `delete` requests
         */
        del: { method: 'DELETE', path: '/models/:id' }
      }
    };

  /**
   * configuration for class, merge of defaults w/ user supplied config
   * @type {Object}
   */
    // FIXME: use `util.deepExtend`
  alias._$config = util.extend(configDefaults, config);

  return alias;
};

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
    serializedModel[key] = alias[key];
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
    config = {
      data: alias.$serialize()
    };

  // (type, id, data, options, ignoreCache)
  var promise = alias.constructor._$request(
    alias._$isLocal ? 'create' : 'update', // CRUD type
    alias._id, // id of object
    alias.$serialize(), // data to send,
    options || null // extra options
  );

  promise.then(function(model) {
    // $log.debug(TAG + '$save', 'Updated model.', collection);
    if (alias._$isLocal) {
      delete alias._$isLocal;
    }

    alias.$update(model);
  });

  return promise;
};

/**
 * deletes the model on the server
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @returns {$q.promise}
 */
Model.prototype.$delete = function(options) {
  var alias = this;

  alias.emit('$delete', alias);

  // (type, id, data, options, ignoreCache)
  var promise = alias.constructor._$request(
    'del', // CRUD type
    alias._id, // id of object
    alias.$serialize(), // data to send,
    options || null // extra options
  );

  promise
    .then(function(response) {
      // ...
    })
    .catch(function(err) {
      // ...
    });

  return promise;
};

Model._$init(null);

return Model;

}
]);