app.service("Factory", [
"$q",
"Endpoint",
"Util",
function($q, Endpoint, util) {

var Factory = function(Model, config) {
  var configDefaults = {
    endpoints: {
      prefix: '',
      perPage: 20,
      list: { method: 'GET', path: '' },
      find: { method: 'GET', path: '' },
      create: { method: 'POST', path: '' },
      update: { method: 'PUT', path: '' },
      del: { method: 'DEL', path: '' }
    }
  };

  // ...
};

Factory.prototype._$dump = function() {
  // ...
};

Factory.prototype._$registerListeners = function(model) {
  // ...
};

Factory.prototype.$create = function() {
  // ...
};

Factory.prototype.$find = function(id) {
  // ...
};

Factory.prototype.$findSync = function(id) {
  // ...
};

Factory.prototype.$list = function(page, perPage) {
  // ...
};

Factory.prototype.$listSync = function(page, perPage) {
  // ...
};

Factory.prototype.$map = function(ids) {
  // ...
};

Factory.prototype.$mapSync = function(ids) {
  // ...
};

return Factory;

}
]);