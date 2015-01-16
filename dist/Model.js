app.service("Model", [
"$q",
"Endpoint",
"EventEmitter",
"Util",
function($q, Endpoint, EventEmitter, util) {

var Model = function() {
  // ...
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