var Factory = function(Model, config) {
  /**
   * default configuration for the factory
   */
  var configDefaults = {
    /**
     * configuration for commumicating with RESTful endpoints
     */
    endpoints: {

      /**
       * optional prefix for the endpoints
       * @type {String}
       */
      prefix: '',

      /**
       * number of items to request for paginated `list` requests
       * @type {Number}
       */
      perPage: 20,

      /**
       * HTTP method + path for `list` requests
       */
      list: { method: 'GET', path: '' },

      /**
       * HTTP method + path for `find` requests
       */
      find: { method: 'GET', path: '' },

      /**
       * HTTP method + path for `create` requests
       */
      create: { method: 'POST', path: '' },

      /**
       * HTTP method + path for `update` requests
       */
      update: { method: 'PUT', path: '' },

      /**
       * HTTP method + path for `delete` requests
       */
      del: { method: 'DEL', path: '' }
    }
  };

  /**
   * configuration for factory, merge of defaults w/ user supplied
   * @type {Object}
   */
    // FIXME: use `util.deepExtend`
  this.config = util.extend(configDefaults, config);

  /**
   * cache of instantiated models, the keys being the ids of each instance
   * @type {Object}
   */
  this.store = {};

  /**
   * used to throttle outgoing requests for the same data
   * @type {Object}
   */
  this.throttle = {};

  /**
   * reference to model for later instantiations
   * @type {Model}
   */
  this.Model = Model;

  // expose instance
  return this;
};

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
 * performs a CRUD request
 * @param type {String} CRUD type
 * @param id {String} id of object to request
 * @param page {Number} optional page, if paginating
 * @param perPage {Number} optional items to return per page, if paginating
 * @returns {$q.promise}
 */
Factory.prototype._$request = function(type, id, page, perPage) {
  var alias = this;
  return new Endpoint.Request({
    method: alias.config.endpoints[type].method,
    path: alias.config.endpoints[type].path
  }).execute();
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

  alias
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

  alias
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