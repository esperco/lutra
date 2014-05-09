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

  function makeKey(uid, tid) {
    return uid + " " + tid;
  }

  function splitKey(key) {
    return key.split(" ");
  }

  /* class for creating observables with backend access */
  mod.Observe = can.Map;

  /* cache of observable profiles */
  var accessCache = cache.create (600, 60, {
    get: function(key) {
      var k = splitKey(key);
      return k.length > 1
           ? api.getTaskProfile(k[0], k[1])
           : api.getProfile(key);
    },
    wrap: function(deferredProf) {
      return deferredProf.then(function(prof) {
        return util.isDefined(prof) ? new can.Map({prof:prof}) : null;
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

  mod.getWithTask = function(uid, tid) {
    return accessCache.getCached(makeKey(uid, tid));
  };

  /* Get multiple profiles from an array of uids.
     Positions in the array are preserved.
     Nulls exist where a failure occurred. */
  mod.mget = function(uidList, tid) {
    var getter = util.isNotNull(tid)
               ? function(uid) { return mod.getWithTask(uid, tid); }
               : mod.get;
    var deferreds = list.map(uidList, getter);
    return deferred.join(deferreds);
  };

  /* set profile value locally */
  mod.set = function(prof) {
    function defer(prof) {
      return (new $.Deferred()).resolve(prof);
    }
    return accessCache.setCached(prof.profile_uid, defer(prof));
  };

  mod.setWithTask = function(prof, ta) {
    ta.task_profiles.push(prof); // profilesOfTaskParticipants will dedup.

    function defer(prof) {
      return (new $.Deferred()).resolve(prof);
    }
    return accessCache.setCached(makeKey(prof.profile_uid, ta.tid),
                                 defer(prof));
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

  mod.email = function(prof) {
    if (util.isNotNull(prof.emails) && prof.emails.length > 0) {
      return prof.emails[0].email;
    } else {
      return "Missing email";
    }
  };

  mod.phone = function(prof) {
    if (util.isNotNull(prof.phones) && prof.phones.length > 0) {
      return prof.phones[0].number;
    } else {
      return "Missing phone";
    }
  };

  mod.shortenName = function(s) {
    /* discard the domain in case it's an email address */
    var name = email.localpart(s);

    var result = initials(name);
    if (result.length < 2)
      result = name.substring(0,1).toUpperCase();
    return result;
  };

  mod.veryShortNameOfProfile = function(prof) {
    var result = mod.shortenName(mod.fullName(prof));
    return result;
  };

  /* Make circle containing user's initials */
  mod.viewMediumCirc = function(prof, withTooltip) {

    var view = $("<div class='unselectable'/>");

    if (withTooltip)
      view.tooltip({
        title: mod.fullName(prof),
        placement: "bottom"
      });

    view
      .text(mod.veryShortNameOfProfile(prof))

    return view;
  };

  mod.viewMediumFullName = function(prof) {
    var view = $("<div/>")
      .text(mod.fullName(prof));
    return view;
  };

  mod.maybeFullName = function(prof) {
    if (util.isNotNull(prof.first_last_name)) {
      if (util.isNotNull(prof.pseudonym) && !email.validate(prof.pseudonym)) {
        return prof.pseudonym;
      } else {
        return prof.first_last_name.first + " " + prof.first_last_name.last;
      }
    } else if (util.isNotNull(prof.pseudonym)) {
      return prof.pseudonym;
    } else {
      return null;
    }
  };

  mod.fullName = function(prof) {
    var name = mod.maybeFullName(prof);
    return util.isNotNull(name) ? name : "Missing Name";
  };

  mod.fullNameOrEmail = function(prof) {
    var name = mod.maybeFullName(prof);
    return util.isNotNull(name) ? name : mod.email(prof);
  };

  mod.firstName = function(prof) {
    if (util.isNotNull(prof.first_last_name)) {
      return prof.first_last_name.first;
    } else if (util.isNotNull(prof.pseudonym)) {
      return prof.pseudonym;
    } else {
      return "Missing Name";
    }
  };

  /*
    fetch the profiles of everyone involved in the task
    (deferred map from uid to profile)
  */
  mod.profilesOfTaskParticipants = function(ta) {
    var profiles = {};
    list.iter(ta.task_profiles, function(prof) {
      profiles[prof.profile_uid] = {prof:prof};
    });
    return profiles;
  };

  return mod;
}());
