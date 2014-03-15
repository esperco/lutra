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
  mod.Observe = can.Map;

  /* cache of observable profiles */
  var accessCache = cache.create (600, 60, {
    get: function(uid) { return api.getProfile(uid); },
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

  mod.email = function(s) {
    return "Email address goes here.";
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

  mod.fullName = function(prof) {
    if (prof.first_last) {
      if (prof.pseudonym && !email.validate(prof.pseudonym)) {
        return prof.pseudonym;
      } else {
        return prof.first_last[0] + " " + prof.first_last[1];
      }
    } else {
      return prof.pseudonym;
    }
  }

  mod.firstName = function(prof) {
    if (prof.first_last) {
      return prof.first_last[0];
    } else {
      return prof.pseudonym;
    }
  }

  /* extract all user IDs contained in the task; this is used to
     pre-fetch all the profiles. */
  function extractTaskUids(ta) {
    var acc = [];

    var taskPar = ta.task_participants;
    acc = list.union(acc, taskPar.organized_by);
    acc = list.union(acc, taskPar.organized_for);

    list.iter(ta.task_chats, function(chat) {
      var uids = list.map(chat.chat_participants, function(x) {
        return x.par_uid;
      });
      acc = list.union(acc, uids);
    });

    return acc;
  }

  /*
    fetch the profiles of everyone involved in the task
    (deferred map from uid to profile)
  */
  mod.profilesOfTaskParticipants = function(ta) {
    var par = ta.task_participants;
    var everyone = extractTaskUids(ta);
    return mod.mget(everyone)
      .then(function(a) {
        var b = {};
        list.iter(a, function(obsProf) {
          if (obsProf !== null) {
            b[obsProf.prof.profile_uid] = obsProf;
          }
        });
        return b;
      });
  };

  return mod;
}());
