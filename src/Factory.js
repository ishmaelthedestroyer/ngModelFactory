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
  var alias = this;

  if (alias.store[data._id]) {
    var
      oldValues = {},
      copy;

    for (var key in data) {
      oldValues[key] = angular.copy(alias[key]);
      alias.store[data._id][key] = data[key];
    }

    copy = angular.copy(alias.store[data._id]);
    alias.emit('$update', copy, oldValues);
    alias.store[data._id].emit('$update', copy, oldValues);
  } else {
    alias.store[data._id] = new alias.Model(data);
    alias._$registerListeners(alias.store[data._id]);
  }

  return alias.store[data._id];
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
      delete alias.store[model._id];
      alias.store[model._id] = model;
    }
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
 * @param ignoreCache {Boolean} specifies that if the item is already in the cache, make another request anyways
 * @param params {Object} optional key / value store of get parameters to send with the request
 * @returns {$q.promise}
 */
Factory.prototype.$find = function(id, ignoreCache, params) {
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
    ._$request('find', id, null, null, ignoreCache, params || null)
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
 * @param ignoreCache {Boolean} specifies that if the item is already in the cache, make another request anyways
 * @param params {Object} optional key / value store of get parameters to send with the request
 * @returns {$q.promise}
 */
Factory.prototype.$list = function(page, perPage, ignoreCache, params) {
  var
    alias = this,
    deferred = $q.defer();

  alias.Model
    ._$request('list', null, page, perPage, ignoreCache, params || null)
    .then(function(data) {
      var output = [];
      angular.forEach(data, function(modelData) {
        output.push(alias._$wrap(modelData));
      });

      deferred.resolve(output);
      alias.emit('$list', output, page, perPage, params);
    })
    .catch(function(err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

/**
 * takes a list of ids, inflates them into `Model` instances
 * @param ids {String|String[]} id or list of ids to inflate
 * @param ignoreCache {Boolean} if any of the models are stored, this flag specifies to ignore the cache
 * @param params {Object} optional key / value store of get parameters to send with the request
 * @returns {$q.promise}
 */
Factory.prototype.$map = function(ids, ignoreCache, params) {
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