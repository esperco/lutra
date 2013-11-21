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

  /* Get multiple profiles from an array of uids.
     Positions in the array are preserved.
     Nulls exist where a failure occurred. */
  mod.mget = function(uidList) {
    var deferreds = list.map(uidList, function(uid) {
      return mod.get(uid);
    });
    return deferred.join(deferreds);
  }

  /* set profile value locally (for testing) */
  mod.set = function(uid, prof) {
    return accessCache.setCached(uid, prof);
  }

  /* display mini profile */
  mod.view.author = function(obs) {
    /* note: can.view, not can.view.render! */
    return $(can.view("assets/ejs/userAuthor.ejs", obs));
  }

  function initials(s) {
    var re = /(^|[^A-Za-z]+)([A-Za-z])/g;
    var m;
    var result = "";
    do {
      m = re.exec(s);
      if (m)
        result += m[2];
    } while (m);
    return result;
  }

  function firstTwoLetters(s) {
    var re = /(^|[^A-Za-z]+)([A-Za-z][A-Za-z]?)/g;
    var result = "";
    do {
      m = re.exec(s);
      if (m)
        result += m[2];
    } while (m);
    return result.substring(0,2);
  }

  function shortenName(s) {
    /* discard the domain in case it's an email address */
    var name = email.localpart(s);

    var result = initials(name);
    if (result.length <= 1)
      result = firstTwoLetters(name);
    if (result === "")
      result = name.substring(0,2);
    return result;
  }

  function veryShortNameOfProfile(prof) {
    var result = shortenName(prof.full_name);
    if (result === "")
      result = shortenName(prof.familiar_name);
    return result;
  }

  function viewOfPhotoMedium(imageUrl) {
    var view = $("<span class='user-photo-container'/>");
    var img = $("<img class='user-photo-medium'/>")
      .attr("src", imageUrl)
      .appendTo(view);
    return view;
  }

  function viewOfInitialsMedium(prof) {
    var view = $("<span class='user-photo-container'/>");
    var text = $("<span class='user-initials-medium'/>")
      .text(veryShortNameOfProfile(prof))
      .appendTo(view);
    return view;
  }

  /* display photo if possible, initials otherwise */
  mod.view.photoMedium = function(obsProf) {
    var prof = obsProf.prof;
    var imgUrl = prof.photo_url;
    if (imgUrl)
      return viewOfPhotoMedium(imgUrl);
    else
      return viewOfInitialsMedium(prof);
  }

  mod.view.photoPlusNameMedium = function(obs) {
    var view = $("<span>");
    mod.view.photoMedium(obs)
      .appendTo(view);
    $("<span class='name-medium'>")
      .text(name)
      .appendTo(view);
    return view;
  }

  mod.view.respondent = function(obs_by, obs_for, confirmed) {
    var prof_by = obs_by.prof;
    var prof_for = obs_for.prof;
    var view = $("<span class='mini-author'/>");

    function nameView(prof) {
      return $("<span/>")
        .text(prof.familiar_name)
        .attr("title", prof.full_name);
    }

    var by = nameView(prof_by);

    if (prof_by.profile_uid === prof_for.profile_uid) {
      view
        .append(nameView(prof_by));
    }
    else {
      view
        .append(nameView(prof_for))
        .append(document.createTextNode(" (via "))
        .append(nameView(prof_by));
      if (!confirmed)
        view.append(document.createTextNode(", unconfirmed"));
      view.append(document.createTextNode(")"));
    }
    view.append(document.createTextNode(":"));
    return view;
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
