var login = function () {
  var mod = {};

  var uid;

  mod.load = function(task) {
    uid = task.guest_uid;
    if (flags.isProduction) {
      mixpanel.register({uid: uid}); // Sent with every track()
      mixpanel.track("Guest view bridge");
    }
  }

  mod.me = function() {
    return uid;
  }

  return mod;
}();
