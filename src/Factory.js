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
  util.extend(this, mixins);

  /** reference to self */
  var alias = this;

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

  // run configuration function
  alias.$init(config);

  // expose instance
  return alias;
};

util.inherits(Factory, EventEmitter);

/* ==========================================================================
   Instance-level methods
   ========================================================================== */

/**
 * converts the local cache into an array of models
 * @returns {[Model]}
 */
Factory.prototype.$dump = function() {
  var
    alias = this,
    dump = [];

  for (var key in alias.store) {
    if (alias.store.hasOwnProperty(key)) {
      dump.push(alias.store[key]);
    }
  }

  return dump;
};

/**
 * creates or updates a model instance from data
 * @param data {Object} model data
 * @returns {Model}
 */
Factory.prototype.$wrap = function(data) {
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
    // if model w/ id DOES NOT exist, create, add to cache, & register event listeners
    model = alias.Model.apply(this, arguments);

    // run configuration function
    model.$init(alias._$config);

    // register event listeners
    alias.$registerListeners(model);

    // add to cache
    alias.store[model._id] = model;

    // notify subscribers of new model
    alias.emit('$create', model);
  }

  return model;
};

/**
 * sets event listeners on a model instance
 * @param model {Model}
 * @returns {Factory}
 */
Factory.prototype.$registerListeners = function(model) {
  var alias = this;
  model.on('$update', function(newValues, oldValues) {
    $log.debug(alias._$config.TAG + 'registerEvents::$update', newValues, oldValues);

    if (newValues && newValues._id && oldValues && oldValues._id && newValues._id !== oldValues._id) {
      $log.debug(alias._$config.TAG + 'registerEvents', '_id updated.');

      delete alias.store[oldValues._id];
      alias.store[model._id] = model;
    }

    alias.emit('$update', model, oldValues);
  });

  model.on('$delete', function(model) {
    $log.debug(alias._$config.TAG + 'registerEvents::$delete', model);
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
    model = alias.$wrap.apply(this, arguments);

  // mark instance with `_$isLocal` to represent it's not saved on the server
  model._$isLocal = true;

  return model;
};

/**
 * makes an async HTTP request to find a `Model` instance;
 * @param id {String} id of `Model` to find
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @returns {$q.promise}
 */
Factory.prototype.$find = function(id, options) {
  var
    alias = this,
    deferred = $q.defer(),
    requestType = 'find',
    config = util.extend({
      method: alias._$config.endpoints[requestType].method,
      path: alias._$config.endpoints[requestType].path,
      map: { ':id': id },
      ignoreCache: false,
      throttle: true
    }, options);

  if (!config || !config.ignoreCache) {
    for (var key in alias.store) {
      if (alias.store.hasOwnProperty(key) && key === id) {
        $log.debug(alias._$config.TAG + '$find', 'Found model in cache.', alias.store[key]);
        deferred.resolve(alias.store[key]);
        return deferred.promise;
      }
    }
  }

  alias
    .$request(config)
    .then(function(data) {
      var model = alias.$wrap(data);
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
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @returns {$q.promise}
 */
Factory.prototype.$list = function(options) {
  var
    alias = this,
    deferred = $q.defer(),
    requestType = 'list',
    config = util.extend({
      method: alias._$config.endpoints[requestType].method,
      path: alias._$config.endpoints[requestType].path,
      ignoreCache: false,
      throttle: true
    }, options);

  alias
    .$request(config)
    .then(function(data) {
      var output = [];
      angular.forEach(data, function(modelData) {
        output.push(alias.$wrap(modelData));
      });

      deferred.resolve(output);
      alias.emit('$list', output);
    })
    .catch(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

/**
 * takes a list of ids, inflates them into `Model` instances
 * @param ids {String|String[]} id or list of ids to inflate
 * @param options {Object} optional extra configuration for the `Endpoint` service
 * @returns {$q.promise}
 */
Factory.prototype.$populate = function(ids, options) {
  var
    alias = this,
    deferred = $q.defer(),
    requestType = 'populate',
    config = util.extend({
      method: alias._$config.endpoints[requestType].method,
      path: alias._$config.endpoints[requestType].path,
      data: { ids: ids }, // TODO: remove duplicates from `$populate` request
      ignoreCache: false,
      throttle: true
    }, options);

  alias
    .$request(config)
    .then(function(data) {
      var output = [];
      angular.forEach(data, function(modelData) {
        output.push(alias.$wrap(modelData));
      });

      deferred.resolve(output);
      alias.emit('$populate', output);
    })
    .catch(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

/**
 * synchronous version of `Factory.$populate`;
 * assumes the data has already been loaded, as it references the cache
 * @param ids {String|String[]} id or list of ids to inflate
 * @returns {$q.promise}
 */
Factory.prototype.$populateSync = function(ids) {
  var deferred = $q.defer();

  // TODO: ...

  return deferred.promise;
};

/**
 * performs a search against the local data set of models
 * @param query {Object|Function} key / value search or function
 * @param options {Object} query options
 * @returns {[Model]}
 */
Factory.prototype.$query = function(query, options) {
  if (!query) {
    throw new Error('Must pass query to `Factory.$query()`. ' +
      'If you want the entire dataset, use `Factory.$dump().`');
  } else if (!util.isJSON(query) && !util.isFunction(query)) {
    throw new Error('Must pass object or function to `Factory.$query()`.');
  }

  // if function, iterate over dataset applying function
  if (util.isFunction(query)) {
    return this.$dump().reduce(function(queue, model) {
      if (query(model)) {
        queue.push(model);
      }

      return queue;
    }, []);
  }

  return this.$dump().reduce(function(queue, model) {
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