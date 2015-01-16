function getParamNames(func) {
  var
    STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
    ARGUMENT_NAMES = /([^\s,]+)/g,
    fnStr = func.toString().replace(STRIP_COMMENTS, ''),
    result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);

  if(result === null) {
     result = [];
   }

  return result;
}

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

Factory.prototype.$listSync = function(page, offset, perPage) {
  // ...
};

Factory.prototype.$map = function(idList) {
  // ...
};

Factory.prototype.$mapSync = function(idList) {
  // ...
};