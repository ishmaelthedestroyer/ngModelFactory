angular.module("Factory", ["EventEmitter", "Endpoint", "Util"])
.service("Factory", [
"$q",
"Model",
"Endpoint",
"EventEmitter",
"Util",
function($q, Model, Endpoint, EventEmitter, util) {

var Factory = function(Model, config) {
  if (!(this instanceof Factory)) {
    return new Factory(Model, config);
  }

  EventEmitter.call(this);
  var alias = this;

  /**
   * default configuration for the factory
   */
  var configDefaults = {
    /**
     * configuration for communicating with RESTful endpoints
     */
    endpoints: {

      /**
       * number of items to request for paginated `list` requests
       * @type {Number}
       */
      perPage: 20
    }
  };

  /**
   * configuration for factory, merge of defaults w/ user supplied
   * @type {Object}
   */
    // FIXME: use `util.deepExtend`
  alias.config = util.extend(configDefaults, config);

  /**
   * cache of instantiated models, the keys being the ids of each instance
   * @type {Object}
   */
  alias.store = {};

  /**
   * used to throttle outgoing requests for the same data
   * @type {Object}
   */
  alias.throttle = {};

  /**
   * reference to model for later instantiations
   * @type {Model}
   */
  alias.Model = Model;

  // expose instance
  return alias;
};

util.inherits(Factory, EventEmitter);

/**
 * converts the local cache into an array of models
 * @returns {Array}
 */
Factory.prototype._$dump = function() {
  var
    alias = this,
    dump = [];

  for (var key in alias.store) {
    dump.push(alias.store[key]);
  }

  return dump;
};

/**
 * creates or updates a model instance from data
 * @param data {Object} model data
 * @returns {Model}
 */
Factory.prototype._$wrap = function(data) {
  var alias = this;

  if (alias.store[data._id]) {
    for (var key in data) {
      alias.store[data._id][key] = data[key];
    }
  } else {
    alias.store[data._id] = new alias.Model(data);
    alias._$registerListeners(alias.store[data._id]);
  }

  return alias.store[data._id];
};

Factory.prototype._$registerListeners = function(model) {
  // ...
};

/**
 * creates an instance of `Model` with the data given
 * @param data {Object} data to create the `Model` instance from
 * @returns {Model}
 */
Factory.prototype.$create = function(data) {
  var
    alias = this,
    model = new alias.Model(data);

  // mark instance with `_$isLocal` to represent it's not saved on the server
  model._$isLocal = true;

  // add to cache
  alias.store[model._id] = model;

  // register event listeners
  alias._$registerListeners(alias.store[model._id]);

  return model;
};

/**
 * makes an async HTTP request to find a `Model` instance;
 * @param id {String} id of `Model` to find
 * @param ignoreCache {Boolean} specifies that if the item is already in the cache, make another request anyways
 * @returns {$q.promise}
 */
Factory.prototype.$find = function(id, ignoreCache) {
  var
    alias = this,
    deferred = $q.defer();

  alias.Model
    ._$request('find', id, null, null, ignoreCache)
    .then(function(data) {
      deferred.resolve(alias._$wrap(data));
    })
    .catch(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

Factory.prototype.$findSync = function(id) {
  // ...
};

/**
 * makes an async HTTP request for a `list` CRUD operation
 * @param page {Number} optional page, defaults to 1
 * @param perPage {Number} optional per page, defaults to config
 * @param ignoreCache {Boolean} specifies that if the item is already in the cache, make another request anyways
 * @returns {$q.promise}
 */
Factory.prototype.$list = function(page, perPage, ignoreCache) {
  var
    alias = this,
    deferred = $q.defer();

  alias.Model
    ._$request('list', null, page, perPage, ignoreCache)
    .then(function(data) {
      var output = [];
      angular.forEach(data, function(modelData) {
        output.push(alias._$wrap(modelData));
      });

      // delete throttle[throttleKey];
      deferred.resolve(output);
      // deferred.resolve(alias._$wrap(data));
    })
    .catch(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

Factory.prototype.$listSync = function(page, perPage) {
  // ...
};

Factory.prototype.$map = function(ids, ignoreCache) {
  // ...
};

Factory.prototype.$mapSync = function(ids) {
  // ...
};

return Factory;

}
]);

angular.module("Model", ["EventEmitter", "Endpoint", "Util"])
.service("Model", [
"$q",
"Endpoint",
"EventEmitter",
"Util",
function($q, Endpoint, EventEmitter, util) {

/* ==========================================================================
   Constructors
   ========================================================================== */

/**
 * generic Model
 * @param data {Object} data for model
 * @returns {Model}
 * @constructor
 */
var Model = function(data, config) {
  if (!(this instanceof Model)) {
    return new Model(data, config);
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
   Class-level methods
   ========================================================================== */

/**
 * performs a CRUD request
 * @param type {String} CRUD type
 * @param id {String} id of object to request
 * @param page {Number} optional page, if paginating
 * @param perPage {Number} optional items to return per page, if paginating
 * @param data {Object} optional data to send if PUT, POST, or DELETE request
 * @returns {$q.promise}
 */
Model._$request = function(type, id, page, perPage, data) {
  var
    alias = this,
    path = Model._$config.endpoints[type].path,
    config;

  while (path !== (path = path.replace(':id', id))) {
    // do nothing; iterate until all instances of `:id` replaced with the actual id
  }

  config = {
    method: Model._$config.endpoints[type].method,
    path: path
  };

  if (data) {
    config.data = data;
  }

  return new Endpoint.Request(config).execute();
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
        del: { method: 'DEL', path: '/models/:id' }
      }
    };

  /**
   * configuration for class, merge of defaults w/ user supplied config
   * @type {Object}
   */
    // FIXME: use `util.deepExtend`
  Model._$config = util.extend(configDefaults, config);

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

  // key inherited from EventEmitter
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
    oldValues[key] = angular.copy(alias[key]);
    alias[key] = data[key];
  }

  alias.emit('$update', angular.copy(alias), oldValues);
  return alias;
};

/**
 * updates (or creates if not saved) the model on the server
 * @returns {$q.promise}
 */
Model.prototype.$save = function() {
  var
    alias = this,
    config = {
      data: alias.$serialize()
    };

  if (alias._$isLocal) {
    config.method = 'POST';
    config.path = '/v1/collections';
  } else {
    config.method = 'PUT';
    config.path = '/v1/collections/' + alias._id;
  }

  var promise = Model._$request(
    alias._$isLocal ? 'create' : 'update', // CRUD type
    alias._id, // id of object
    null, // page (pagination)
    null, // per page (pagination)
    alias.$serialize() // data to send
  );

  promise.then(function(model) {
    // $log.debug(TAG + '$save', 'Updated model.', collection);
    alias.$update(model);

    if (alias._$isLocal) {
      delete alias._$isLocal;
    }
  });

  return promise;
};

/**
 * deletes the model on the server
 * @returns {$q.promise}
 */
Model.prototype.$delete = function() {
  var deferred = $q.defer();

  // TODO: ...

  return deferred.promise;
};

Model._$init(null);

return Model;

}
]);

angular.module("ngModelFactory", [
"Factory",
"Model"
]);