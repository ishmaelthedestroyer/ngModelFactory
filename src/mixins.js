var mixins = {};

/**
 * performs a CRUD request
 * @param options {Object} configuration for the `Endpoint` service
 * @returns {$q.promise}
 */
mixins.$request = function(options) {
  return new Endpoint.Request(options).execute();
};

/**
 * sets up configuration for the class
 * @param options {Object} custom configuration
 * @returns {Factory|Model}
 */
mixins.$init = function(options) {
  var

    /** reference to self */
    alias = this,

    /**
     * default configuration for the model
     */
    defaults = {

      /**
       * log identifier
       * @type {String}
       */
      TAG: 'ngModelFactory::',

      /**
       * configuration for communicating with RESTful endpoints
       */
      endpoints: {

        /**
         * optional prefix for the endpoints
         * @type {String}
         */
        prefix: '/api',

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

  // FIXME: use `util.deepExtend`
  alias._$config = util.extend(defaults, options);

  return alias;
};