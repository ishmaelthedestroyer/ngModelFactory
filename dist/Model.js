angular.module("Model", ["EventEmitter", "Endpoint", "Util"])
.service("Model", [
"$q",
"Endpoint",
"EventEmitter",
"Util",
function($q, Endpoint, EventEmitter, util) {

/**
 * generic Model
 * @param data {Object} data for model
 * @returns {Model}
 * @constructor
 */
var Model = function(data) {
  var alias = this;

  for (var key in data) {
    alias[key] = data[key];
  }

  return alias;
};

Model.prototype.$serialize = function() {
  // ...
};

Model.prototype.$save = function() {
  // ...
};

Model.prototype.$delete = function() {
  // ...
};

return Model;

}
]);