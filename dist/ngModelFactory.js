angular.module("Factory", ["EventEmitter", "Endpoint", "Util"])
.service("Factory", [
"$log",
"$q",
"Model",
"Endpoint",
"EventEmitter",
"Util",
function($log, $q, Model, Endpoint, EventEmitter, util) {

/* ==========================================================================
   Constructors
   ========================================================================== */

/**
 * generic Factory model
 * @param Model {Model} model to manage
 * @param config {Object} configuration for factory
 * @returns {Factory}
 * @constructor
 */
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
     * log identifier
     * @type {String}
     */
    TAG: 'Factory::',

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
   * cache of instantiated models, the keys being the ids of each instance
   * @type {Object}
   */
  alias.store = {};

  /**
   * reference to model for later instantiations
   * @type {Model}
   */
  alias.Model = Model;

  /**
   * configuration for factory, merge of defaults w/ user supplied
   * @type {Object}
   */
    // FIXME: use `util.deepExtend`
  alias.config = util.extend(configDefaults, config);
  alias.Model._$init(config);

  // expose instance
  return alias;
};

util.inherits(Factory, EventEmitter);

/* ==========================================================================
   Class-level methods
   ========================================================================== */

// ...

/* ==========================================================================
   Instance-level methods
   ========================================================================== */

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
  var
    alias = this,
    model;

  if (data._id && alias.store[data._id]) {
    var oldValues = {};
    model = alias.store[data._id];

    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        oldValues[key] = angular.copy(alias[key]);
        model[key] = data[key];
      }
    }

    alias.emit('$update', model, oldValues);
    alias.store[data._id].emit('$update', model, oldValues);
  } else {
    model = alias.Model.apply(this, arguments);
    alias._$registerListeners(model);
    alias.store[model._id] = model;
  }

  return model;
};

/**
 * sets listeners on a model instance
 * @param model {Model}
 * @returns {Factory}
 */
Factory.prototype._$registerListeners = function(model) {
  var alias = this;
  model.on('$update', function(newValues, oldValues) {
    $log.debug(alias.config.TAG + 'registerEvents', newValues, oldValues);

    if (newValues._id !== oldValues._id) {
      $log.debug(alias.config.TAG + 'registerEvents', '_id updated.');

      delete alias.store[oldValues._id];
      alias.store[model._id] = model;
    }

    alias.emit('$update', model, oldValues);
  });

  model.on('$delete', function(model) {
    $log.debug(alias.config.TAG + 'registerEvents', 'Model deleted.', model);
    delete alias.store[model._id];
    alias.emit('$delete', model);
  });

  return alias;
};

/**
 * creates an instance of `Model`
 * @returns {Model}
 */
Factory.prototype.$create = function() {
  var
    alias = this,
    model = alias.Model.apply(this, arguments);

  // mark instance with `_$isLocal` to represent it's not saved on the server
  model._$isLocal = true;

  // add to cache
  alias.store[model._id] = model;

  // register event listeners
  alias._$registerListeners(alias.store[model._id]);

  // notify subscribers of new model
  alias.emit('$create', model);

  return model;
};

/**
 * makes an async HTTP request to find a `Model` instance;
 * @param id {String} id of `Model` to find
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @param ignoreCache {Boolean} specifies that if the item is already in the cache, make another request anyways
 * @returns {$q.promise}
 */
Factory.prototype.$find = function(id, options, ignoreCache) {
  var
    alias = this,
    deferred = $q.defer();

  if (!ignoreCache) {
    for (var key in alias.store) {
      if (key === id) {
        deferred.resolve(alias.store[key]);
        return deferred.promise;
      }
    }
  }

  alias.Model
    ._$request('find', id, null, null, options || null, ignoreCache)
    .then(function(data) {
      var model = alias._$wrap(data);
      deferred.resolve(model);
      alias.emit('$find', model);
    })
    .catch(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

/**
 * makes an async HTTP request for a `list` CRUD operation
 * @param page {Number} optional page, defaults to 1
 * @param perPage {Number} optional per page, defaults to config
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @param ignoreCache {Boolean} specifies that if the item is already in the cache, make another request anyways
 * @returns {$q.promise}
 */
Factory.prototype.$list = function(page, perPage, options, ignoreCache) {
  var
    alias = this,
    deferred = $q.defer();

  alias.Model
    // (type, id, data, options, ignoreCache)
    ._$request('list', null, null, options || null, ignoreCache)
    .then(function(data) {
      var output = [];
      angular.forEach(data, function(modelData) {
        output.push(alias._$wrap(modelData));
      });

      deferred.resolve(output);
      alias.emit('$list', output, page, perPage, options);
    })
    .catch(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

/**
 * performs a search against the models
 * @param query {Object} key / value search
 * @param options {Object} query options
 */
Factory.prototype.$query = function(query, options) {
  var deferred = $q.defer();

  // TODO: ...

  return deferred.promise;
};

/**
 * performs a synchronous search against the local data set
 * @param query {Object} key / value search
 * @param options {Object} query options
 * @returns {[Model]}
 */
Factory.prototype.$querySync = function(query, options) {
  if (!query || !Object.keys(query).length) {
    return this._$dump();
  }

  return this._$dump().reduce(function(queue, model) {
    for (var key in query) {
      if (!query.hasOwnProperty(key)) {
        continue;
      }

      switch (typeof query[key]) {
        case 'function':
          // if function, pass value and model to function
          if (!query[key](model[key], model)) return queue;
          break;
        case 'boolean':
          // if boolean, check for exact value
          if (query[key] !== model[key]) return queue;
          break;
        case 'string':
          // if string, check for exact value
          if (query[key] !== model[key]) return queue;
          break;
        case 'object':
          // if object, check for exact value
          if (query[key] !== model[key]) return queue;
          break;
        default:
          // if couldn't determine, don't add
          return queue;
      }
    }

    queue.push(model);
    return queue;
  }, []);
};

/**
 * takes a list of ids, inflates them into `Model` instances
 * @param ids {String|String[]} id or list of ids to inflate
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @param ignoreCache {Boolean} if any of the models are stored, this flag specifies to ignore the cache
 * @returns {$q.promise}
 */
Factory.prototype.$map = function(ids, options, ignoreCache) {
  var deferred = $q.defer();

  // TODO: ...

  return deferred.promise;
};

/**
 * synchronous version of `Factory.$map`; assumes the data has already been loaded, as it references the cache
 * @param ids {String|String[]} id or list of ids to inflate
 * @returns {$q.promise}
 */
Factory.prototype.$mapSync = function(ids) {
  var deferred = $q.defer();

  // TODO: ...

  return deferred.promise;
};

return Factory;

}
]);

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
 * makes a request to the server to load any updates
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @returns {$q.promise}
 */
Model.prototype.$reload = function(options) {
  var alias = this;

  alias.emit('$reload', alias);

  // (type, id, data, options, ignoreCache)
  var promise = alias.constructor._$request(
    'find', // CRUD type
    alias._id, // id of object
    null, // data to send,
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

angular.module("ngModelFactory", [
"Factory",
"Model"
]);