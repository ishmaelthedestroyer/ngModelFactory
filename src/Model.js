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

  return serializedModel;
};

Model.prototype.$save = function() {
  // ...
};

Model.prototype.$delete = function() {
  // ...
};