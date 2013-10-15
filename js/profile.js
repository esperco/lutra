/*
  User profiles keyed by uid

  provides:
  - profile.Observe      : access -> observable data
  - profile.view.Author  : (model, update-view function) -> abstract view
  - (profile.control.*)  : (model, update-model function) -> abstract control
*/

var profile = (function() {
  var mod = {
    view: {},
    control: {}
  };

  /* class for creating observables with backend access */
  mod.Observe = can.Observe;

  /* cache of observable profiles */
  var accessCache = cache.create (600, 60, {
    get: function(uid) { return api.getProfile(uid); },
    wrap: function(prof) { return new can.Observe({prof:prof}); },
    update: function(obs, prof) { return obs.attr("prof", prof); },
    destroy: function(obs) { obs.removeAttr("prof"); }
  });

  /* get observable profile */
  mod.get = function(uid) {
    return accessCache.getCached(uid);
  }

  /* set profile value locally (for testing) */
  mod.set = function(uid, prof) {
    return accessCache.setCached(uid, prof);
  }

  /* display mini profile */
  mod.view.author = function(obs) {
    /* note: can.view, not can.view.render! */
    return $(can.view('assets/ejs/userAuthor.ejs', obs));
  }

  /* sample control */
  mod.control.Dummy = can.Control.extend({
    init: function(element) {
      element.text("click me!");
      element.removeClass("hide");
    },

    'click': function(button, event) {
      /* change my profile value, should be reflected in all the views */
      mod.get(login.data.uid)
        .done(function(obs) {
          /* fires a "change" event */
          obs.attr("prof.familiar_name", "new name!");
        });
    }
  });

  /* display sample control */
/*
  mod.control.dummyButton = new mod.control.Dummy("#dummy");
*/

  return mod;
}());
