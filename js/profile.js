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
    wrap: function(deferredProf) {
      return deferredProf.then(function(prof) {
        return util.isDefined(prof) ? new can.Observe({prof:prof}) : null;
      });
    },
    update: function(deferredObs, deferredProf) {
      return deferredObs.then(function(obs) {
        return deferredProf.then(function(prof) {
          return obs.attr("prof", prof);
        });
      });
    },
    destroy: function(deferredObs) {
      deferredObs.then(function(obs) {
        obs.removeAttr("prof");
      });
    }
  });

  /* get observable profile */
  mod.get = function(uid) {
    return accessCache.getCached(uid);
  };

  /* Get multiple profiles from an array of uids.
     Positions in the array are preserved.
     Nulls exist where a failure occurred. */
  mod.mget = function(uidList) {
    var deferreds = list.map(uidList, function(uid) {
      return mod.get(uid);
    });
    return deferred.join(deferreds);
  };

  /* set profile value locally */
  mod.set = function(prof) {
    function defer(prof) {
      return (new $.Deferred()).resolve(prof);
    }
    return accessCache.setCached(prof.profile_uid, defer(prof));
  };

  /* display mini profile */
  mod.view.author = function(obs) {
    /* note: can.view, not can.view.render! */
    return $(can.view("assets/ejs/userAuthor.ejs", obs));
  };

  function initials(s) {
    var re = /(^|[^A-Za-z]+)([A-Za-z])/g;
    var m;
    var result = "";
    do {
      m = re.exec(s);
      if (m)
        result += m[2];
    } while (m);
    result = result.toUpperCase();
    return result;
  }

  mod.shortenName = function(s) {
    /* discard the domain in case it's an email address */
    var name = email.localpart(s);

    var result = initials(name);
    if (result.length < 2)
      result = name.substring(0,1).toUpperCase();
    return result;
  };

  mod.veryShortNameOfProfile = function(prof) {
    var result = mod.shortenName(prof.full_name);
    if (result === "")
      result = mod.shortenName(prof.familiar_name);
    return result;
  };

  /* Make circle containing user's initials */
  mod.viewMediumCirc = function(prof, withTooltip) {

    var view = $("<div class='list-prof-circ pref-prof-circ'>");

    if (withTooltip)
      view.tooltip({
        title: prof.full_name,
        placement: "bottom"
      });

    $("<p class='initials unselectable'/>")
      .text(mod.veryShortNameOfProfile(prof))
      .appendTo(view);
    return view;
  };

  mod.viewMediumFullName = function(prof) {
    var view = $("<p class='guest-name'/>")
      .text(prof.full_name);
    return view;
  };

  return mod;
}());
