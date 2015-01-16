app.service("Model", [
"$q",
"Endpoint",
"Util",
function($q, Endpoint, util) {

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