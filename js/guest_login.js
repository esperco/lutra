var login = function () {
  var mod = {};

  var uid;

  mod.load = function(task) {
    uid = task.guest_uid;
  }

  mod.me = function() {
    return uid;
  }

  return mod;
}();
