/*
  Scheduling step 1
*/

var sched1 = (function() {
  var mod = {};

  var nextButton = $(".sched-step1-next");

  function rowViewOfNewParticipant(chats, profs, task, hosts, guestTbl) {
    var view = $("<div class='sched-step1-row'/>");
    var initials = $("<div class='prof-circ'/>");
    var emailInput = $("<input type='email'/>")
      .addClass("form-control")
      .attr("placeholder", "guest's email");
    var nameInput = $("<input type='text'/>")
      .addClass("form-control")
      .attr("placeholder", "guest's full name")
      .attr("disabled", true);
    var removeButton = $("<button class='btn btn-default'/>")
      .text("Remove");
    var optUid;

    function updateNameEditability(editable) {
      if (util.isString(optUid) && editable)
        nameInput.removeAttr("disabled");
      else
        nameInput.attr("disabled", true);
    }

    function clearUid() {
      if (util.isString(optUid))
        delete guestTbl[optUid];
      optUid = null;
      updateNameEditability(false);
    }

    function updateInitials() {
      var s = profile.shortenName(nameInput.val());
      initials
        .text(profile.shortenName(nameInput.val()));
    }

    function fetchProfile() {
      var emailAddr = emailInput.val();
      if (email.validate(emailAddr)) {
        api.getProfileByEmail(emailAddr)
          .then(function(prof) {
            clearUid();
            var uid = prof.profile_uid;
            optUid = uid;
            guestTbl[uid] = uid;
            nameInput.attr("id", "name-" + uid);
            emailInput.attr("id", "email-" + uid);
            if (prof.full_name !== emailAddr || ! prof.editable)
              nameInput.val(prof.full_name);
            updateNameEditability(prof.editable);
            updateInitials();
            updateNextButton(hosts, guestTbl);
          });
      } else {
        clearUid();
        updateNextButton(hosts, guestTbl);
      }
    }

    function saveName() {
      var name = nameInput.val();
      updateInitials();
      if (isValidName(name) && util.isString(optUid)) {
        var uid = optUid;
        api.getProfile(uid)
          .then(function(prof) {
            name0 = prof.full_name;
            prof.full_name = name;
            prof.familiar_name = name;
            api.postProfile(prof);
            updateNextButton(hosts, guestTbl);
          });
      } else {
        updateNextButton(hosts, guestTbl);
      }
    }

    util.afterTyping(emailInput, 500, function() {
      fetchProfile();
    });

    util.afterTyping(nameInput, 500, function() {
      saveName();
    });

    removeButton
      .click(function() {
        clearUid();
        view.remove();
        updateNextButton(hosts, guestTbl);
      });

    view
      .append(initials)
      .append(emailInput)
      .append(nameInput)
      .append(removeButton);

    return view;
  }

  function rowViewOfParticipant(chats, profs, task, guestTbl, uid) {
    var view = $("<div class='sched-step1-row'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;
    var name = prof.full_name;
    var initials = $("<div class='prof-circ'>")
      .text(profile.veryShortNameOfProfile(prof));

    var nameView = $("<p class='guest-name'>" + name + "</p>");

    view
      .append(initials)
      .append(nameView);

    return view;
  }

  function collectGuests(hosts, guestTbl) {
    return list.diff(list.ofTable(guestTbl), hosts);
  }

  function isValidName(s) {
    return profile.shortenName(s).length > 0;
  }

  function isReady(hosts, guestTbl) {
    var guests = collectGuests(hosts, guestTbl);
    var missingName = list.exists(guests, function(uid) {
      return ! isValidName($("#name-" + uid).val());
    });
    return guests.length > 0 && !missingName;
  }

  function updateNextButton(hosts, guestTbl) {
    if (isReady(hosts, guestTbl))
      nextButton.removeClass("disabled");
    else
      nextButton.addClass("disabled");
  }

  function finalizeGuests(ta, hosts, guestTbl) {
    var guests = collectGuests(hosts, guestTbl);
    ta.task_participants.organized_for = list.union(hosts, guests);
    ta.task_status.task_progress = "Coordinating";
    sched.getState(ta).scheduling_stage = "Find_availability";
    task.dont_change_task_type();
    api.postTask(ta)
      .done(sched.loadTask);
  }

  mod.load = function(profs, task, view) {
    $("<h3>Confirm the guest list.</h3>")
      .appendTo(view);

    var chats = sched.chatsOfTask(task);

    var hostsContainer = $("<div class='hosts-container'>");
    var hosts = sched.getHosts(task);
    list.iter(hosts, function(uid) {
      rowViewOfParticipant(chats, profs, task, guestTbl, uid)
        .appendTo(hostsContainer);
    });

    var guestsContainer = $("<div class='guests-container'>");
    var guests = sched.getGuests(task);
    var guestTbl = list.toTable(guests);
    list.iter(guests, function(uid) {
      rowViewOfParticipant(chats, profs, task, guestTbl, uid)
        .appendTo(guestsContainer);
    });

    var adder = $("<button class='btn btn-default'/>")
      .text("Add guest")
      .click(function() {
        rowViewOfNewParticipant(chats, profs, task, hosts, guestTbl)
          .appendTo(guestsContainer);
      });

    view
      .append(hostsContainer)
      .append(guestsContainer)
      .append(adder);

    nextButton
      .unbind('click')
      .click(function() {
        nextButton.addClass("disabled");
        finalizeGuests(task, hosts, guestTbl);
      });

    updateNextButton(hosts, guestTbl);
  };

  return mod;
}());
