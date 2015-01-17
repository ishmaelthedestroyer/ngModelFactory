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