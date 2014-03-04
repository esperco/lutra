/*
  Scheduling step 1
*/

var sched1 = (function() {
  var mod = {};

  var nextButton = $(".sched-step1-next");

  function getGuestOptions(guestOptions, uid) {
    var options = guestOptions[uid];
    if (! util.isNotNull(options)) {
      options = {uid:uid};
      guestOptions[uid] = options;
    }
    return options;
  }

  function editGuest(updateAddButton) {
    var edit = {};

    edit.emailInput = $("<input type='email'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Email address");
    edit.firstNameInput = $("<input type='text'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "First name")
      .attr("disabled", true);
    edit.lastNameInput = $("<input type='text'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Last name")
      .attr("disabled", true);

    edit.firstLast = function() {
      return [edit.firstNameInput.val(),
              edit.lastNameInput.val()];
    }

    edit.optUid = null;

    edit.isValid = function() {
      return isValidName(edit.firstNameInput.val())
          && isValidName(edit.lastNameInput.val())
          && util.isString(edit.optUid);
    }

    function updateNameEditability(editable) {
      if (util.isString(edit.optUid) && editable) {
        edit.firstNameInput.removeAttr("disabled");
        edit.lastNameInput.removeAttr("disabled");
      } else {
        edit.firstNameInput.attr("disabled", true);
        edit.lastNameInput.attr("disabled", true);
      }
    }

    edit.clearUid = function() {
      edit.optUid = null;
      updateNameEditability(false);
    }

    function fetchProfile() {
      var emailAddr = edit.emailInput.val();
      if (email.validate(emailAddr)) {
        api.getProfileByEmail(emailAddr)
          .then(function(prof) {
            edit.clearUid();
            var uid = prof.profile_uid;
            edit.optUid = uid;
            edit.firstNameInput.attr("id", "first-name-" + uid);
            edit.lastNameInput.attr("id", "last-name-" + uid);
            edit.emailInput.attr("id", "email-" + uid);
            // TODO Allow pseudonyms for guests?
            if (prof.first_last || ! prof.editable) {
              edit.firstNameInput.val(prof.first_last[0]);
              edit.lastNameInput.val(prof.first_last[1]);
            }
            updateNameEditability(prof.editable);
            updateAddButton();
          });
      } else {
        edit.clearUid();
        updateAddButton();
      }
    }

    util.afterTyping(edit.emailInput, 250, fetchProfile);
    util.afterTyping(edit.firstNameInput, 250, updateAddButton);
    util.afterTyping(edit.lastNameInput, 250, updateAddButton);

    return edit;
  }

  /* Form allowing the user to enter a new participant
     at the bottom of the list */
  function rowViewOfNewParticipant(profs, task, hosts, guestTbl, guestOptions,
                                   guestsContainer) {
    var view = $("<div class='sched-step1-add-row'/>");

    var hosts = sched.getHosts(task);
    var adder = $("<div class='add-guest-circ'>");
    var plus = $("<img id='plus-guest'/>");
    plus.appendTo(adder);
    svg.loadImg(plus, "/assets/img/plus.svg");

    var addGuest = $("<div id='add-guest-text' class='unselectable'/>")
      .append($("<a>Add guest</a>"));

    var eaCheck = $("<div/>");
    var checkbox = $("<img/>").appendTo(eaCheck);
    svg.loadImg(checkbox, "/assets/img/checkbox-sm.svg");
    eaCheck.append("Communicate with this guest's assistant");

    var edit, eaEdit;
    function updateAddButton() {
      if (edit.isValid()
       && (! eaCheck.hasClass("checkbox-selected")
        || eaEdit.isValid() && edit.optUid !== eaEdit.optUid))
        $("#add-guest-btn").removeClass("disabled");
      else
        $("#add-guest-btn").addClass("disabled");
    }
    edit   = editGuest(updateAddButton);
    eaEdit = editGuest(updateAddButton);

    var eaView = $("<div class='hide sched-step1-add-row'/>")
                 .append(eaEdit.emailInput)
                 .append(eaEdit.firstNameInput)
                 .append(eaEdit.lastNameInput);
    eaCheck.click(function() {
      if (eaCheck.hasClass("checkbox-selected")) {
        eaCheck.removeClass("checkbox-selected");
        eaView.addClass("hide");
      } else {
        eaCheck.addClass("checkbox-selected");
        eaView.removeClass("hide");
      }
      updateAddButton();
    });

    var addButton = $("<button id='add-guest-btn'/>")
      .addClass("btn btn-primary disabled")
      .text("Add");
    var guestInputDiv = $("<div id='guest-input-div' class='hide'/>")
      .append(edit.emailInput)
      .append(edit.firstNameInput)
      .append(edit.lastNameInput)
      .append(eaCheck)
      .append(eaView)
      .append(addButton);

    function toggleAddGuest() {
      if (guestInputDiv.hasClass("hide")) {
        addGuest.addClass("hide");
        guestInputDiv.removeClass("hide");
        edit.emailInput.focus();
        adder
          .removeClass("return-to-add")
          .addClass("cancel");
      } else {
        clearAddGuest();
      }
    }
    addGuest
      .click(toggleAddGuest);
    adder
      .click(toggleAddGuest);

    function clearAddGuest() {
      edit.clearUid();
      eaEdit.clearUid();
      $(".guest-input").val("");
      updateAddButton();
      eaCheck.removeClass("checkbox-selected");
      eaView.addClass("hide");
      guestInputDiv.addClass("hide");
      addGuest.removeClass("hide");
      adder
        .removeClass("cancel")
        .addClass("return-to-add");
    }

    addButton.click(function() {
      var firstLast = edit.firstLast();
      var eaFirstLast = eaEdit.firstLast();
      var uids = eaCheck.hasClass("checkbox-selected")
               ? [edit.optUid, eaEdit.optUid]
               : [edit.optUid];
      deferred.join(list.map(uids, api.getProfile))
      .then(function(profs) {
        profs[0].first_last = firstLast;
        if (profs.length >= 2) {
          profs[1].first_last = eaFirstLast;
        }
        deferred.join(list.filter_map(profs, function(prof) {
          return prof.editable ? api.postProfile(prof, login.getTeam().teamid)
                               : null;
        })).then(function() {
          list.iter(profs, profile.set); /* update cache */
          guestTbl[uids[0]] = uids[0];
          list.iter(uids, function(uid) {
            task.task_participants.organized_for.push(uid);
          });
          profile.profilesOfTaskParticipants(task).then(function(profs) {
            var options = getGuestOptions(guestOptions, uids[0]);
            if (uids.length < 2) {
              delete options.assisted_by;
            } else {
              options.assisted_by = uids[1];
            }
            guestsContainer.append(
              rowViewOfParticipant(profs, task, guestTbl, guestOptions,
                                   uids[0]));
            saveGuests(task, hosts, guestTbl, guestOptions);
            updateNextButton(hosts, guestTbl, guestOptions);
          });
        });
      });
      clearAddGuest();
    });

    view.append(adder)
        .append(addGuest)
        .append(guestInputDiv);

    return {
      view: view
    };
  }

  function viewOfEAProfile(profs, task, uid) {
    var view = $("<div class='sched-step1-ea-row'>");
    var prof = profs[uid].prof;
    var branch = $("<div class='relationship-branch'>");
    var chatHead = profile.viewMediumCirc(prof).addClass("list-prof-circ");
    var nameView = profile.viewMediumFullName(prof).addClass("ea-name");
    var bridgeLink = $("<a class='bridge-link'>View Bridge</a>").click(function() {
      api.getGuestAppURL(task.tid, uid).done(function (url) {
        window.open(url.url);
      });
    });
    var email = $("<div class='ea-email'>")
      .append(profile.email(prof));
    view
      .append(branch)
      .append(chatHead)
      .append((nameView)
        .append(bridgeLink))
      .append(email);
    return view;
  }

  function viewOfProfile(v, profs, task, uid, hasEA) {
    var prof = profs[uid].prof;
    var chatHead = profile.viewMediumCirc(prof).addClass("list-prof-circ");
    var nameView = profile.viewMediumFullName(prof).addClass("guest-name");
    var bridgeLink = $("<a class='bridge-link'>View Bridge</a>").click(function() {
      api.getGuestAppURL(task.tid, uid).done(function (url) {
        window.open(url.url);
      });
    });
    var email = $("<div class='guest-email'>")
      .append(profile.email(prof));

    if (hasEA) {
      chatHead.addClass("has-ea");
      nameView.addClass("has-ea");
      email.addClass("has-ea");
    }

    v.append(chatHead)
     .append((nameView)
       .append(bridgeLink))
     .append(email);
  }

  /* Read-only view of a participant */
  function rowViewOfParticipant(profs, task, guestTbl, guestOptions, uid) {
    var ea = sched.assistedBy(uid, guestOptions);
    var hasEA = util.isNotNull(ea);
    var view = $("<div class='sched-step1-row'>");

    if (sched.isGuest(uid)) {
      var edit = $("<button type='button' class='btn btn-default edit-guest-btn'>Edit</button>");
      var editProfile = $("<li class='edit-profile'><a>Edit profile</a></li>");
      var remove = $("<li><a class='remove-guest'>Remove guest</a></li>");
      var editButton = $("<div class='btn-group edit-guest'/>")
        .append(edit)
        .append($("<button type='button' class='btn btn-default dropdown-toggle' data-toggle='dropdown'/>")
          .append($("<span class='caret'/>"))
          .append($("<span class='sr-only'>Toggle Dropdown</span>")))
        .append($("<ul class='dropdown-menu pull-right edit-guest-dropdown' role='menu'/>")
          .append(editProfile)
          .append(remove))
        .appendTo(view);

      remove.click(function() {
        var hosts = sched.getHosts(task);
        view.remove();
        updateNextButton(hosts, guestTbl, guestOptions);
        removeGuest(guestTbl, uid);
        saveGuests(task, hosts, guestTbl, guestOptions);
        updateNextButton(hosts, guestTbl, guestOptions);
      });
    }

    viewOfProfile(view, profs, task, uid, hasEA);

    if (hasEA) {
      view.append(viewOfEAProfile(profs, task, ea));
    }

    return view;
  }

  function collectGuests(hosts, guestTbl, guestOptions) {
    var result = {};
    function addResult(uid, mayAttend) {
      result[uid] = uid;
      getGuestOptions(guestOptions, uid).may_attend = mayAttend;
    }

    for (var uid in guestOptions) {
      var options = guestOptions[uid];
      if (util.isNotNull(options.assisted_by)
       && util.isNotNull(guestTbl[uid])) {
        addResult(options.assisted_by, false);
      }
    }
    for (var uid in guestTbl) {
      addResult(uid, true);
    }
    list.iter(hosts, function(uid) {
      delete result[uid];
    });

    return list.ofTable(result);
  }

  function isValidName(s) {
    return profile.shortenName(s).length > 0;
  }

  function isReady(hosts, guestTbl, guestOptions) {
    var guests = collectGuests(hosts, guestTbl, guestOptions);
    return guests.length > 0;
  }

  function updateNextButton(hosts, guestTbl, guestOptions) {
    if (isReady(hosts, guestTbl, guestOptions))
      nextButton.removeClass("disabled");
    else
      nextButton.addClass("disabled");
  }

  /* remove guest */
  function removeGuest(guestTbl, uid) {
    delete guestTbl[uid];
  }

  function updateGuests(ta, hosts, guestTbl, guestOptions) {
    var guests = collectGuests(hosts, guestTbl, guestOptions);
    ta.task_participants.organized_for = list.union(hosts, guests);
    sched.getState(ta).participant_options = list.ofTable(guestOptions);
  }

  function saveGuests(ta, hosts, guestTbl, guestOptions) {
    updateGuests(ta, hosts, guestTbl, guestOptions);
    api.postTask(ta).done(observable.onTaskParticipantsChanged.notify);
  }

  function finalizeGuests(ta, hosts, guestTbl, guestOptions) {
    updateGuests(ta, hosts, guestTbl, guestOptions);
    ta.task_status.task_progress = "Coordinating";
    sched.getState(ta).scheduling_stage = "Find_availability";
    api.postTask(ta).done(function(ta) {
      sched.loadTask(ta);
      observable.onTaskParticipantsChanged.notify(ta);
    });
  }

  mod.load = function(profs, ta, view) {
    var view = $("#sched-step1-table");
    view.children().remove();
    $("<h3>Add guests to the meeting.</h3>")
      .appendTo(view);

    var hostsContainer = $("<div class='hosts-container'>");
    var newGuestContainer = $("<div class='new-guest-container'>");
    var guestsContainer = $("<div class='guests-container'/>");

    var guests = sched.getAttendingGuests(ta);
    var guestTbl = list.toTable(guests);
    var guestOptions = sched.getGuestOptions(ta);
    var addResult =
      rowViewOfNewParticipant(profs, ta, hosts, guestTbl, guestOptions,
                              guestsContainer);

    var hosts = sched.getHosts(ta);
    list.iter(hosts, function(uid) {
      rowViewOfParticipant(profs, ta, guestTbl, guestOptions, uid)
        .appendTo(hostsContainer);
    });

    list.iter(guests, function(uid) {
      rowViewOfParticipant(profs, ta, guestTbl, guestOptions, uid)
        .appendTo(guestsContainer);
    });

    var newGuestContainer = $("<div class='new-guest-container'>");
    addResult.view
      .appendTo(newGuestContainer);

    var guestListContainer = $("<div id='guest-list-container'>")
      .append(hostsContainer)
      .append(guestsContainer)
      .append(newGuestContainer);

    view.append(guestListContainer);

    nextButton
      .unbind("click")
      .click(function() {
        nextButton.addClass("disabled");
        finalizeGuests(ta, hosts, guestTbl, guestOptions);
      });

    updateNextButton(hosts, guestTbl, guestOptions);

    observable.onSchedulingStepChanging.observe("step", function() {
      saveGuests(ta, hosts, guestTbl, guestOptions);
    });
  };

  return mod;
}());
