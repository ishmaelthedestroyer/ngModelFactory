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
   * used to throttle outgoing requests for the same data
   * @type {Object}
   */
  alias.throttle = {};

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
  Model._$init(config);

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
    for (var key in data) {
      alias.store[data._id][key] = data[key];
    }
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
  });

  return alias;
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

/**
 * takes a list of ids, inflates them into `Model` instances
 * @param ids {String|String[]} id or list of ids to inflate
 * @param ignoreCache {Boolean} if any of the models are stored, this flag specifies to ignore the cache
 * @returns {$q.promise}
 */
Factory.prototype.$map = function(ids, ignoreCache) {
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