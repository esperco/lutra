/*
  Scheduling step 1
*/

var sched1 = (function() {
  var mod = {};

  var nextButton = $(".sched-step1-next");

  function editGuest(updateAddButton) {
    var edit = {};

    function updateUI() {
      updateAddButton(edit);
    }

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
            updateUI();
          });
      } else {
        edit.clearUid();
        updateUI();
      }
    }

    util.afterTyping(edit.emailInput, 250, fetchProfile);
    util.afterTyping(edit.firstNameInput, 250, updateUI);
    util.afterTyping(edit.lastNameInput, 250, updateUI);

    return edit;
  }

  /* Form allowing the user to enter a new participant
     at the bottom of the list */
  function rowViewOfNewParticipant(profs, task, hosts, guestTbl, guestOptions,
                                   guestsContainer) {
'''
<div #view
     class="add-guest-row click-mode">
  <div #addClick
       class="add-guest-click clearfix">
    <div #adder
         class="add-guest-circ">
      <div #plus
           class="plus-guest"/>
    </div>
    <div #addGuest
         class="add-guest-text unselectable">
      Add guest
    </div>
  </div>
  <div #guestInputDiv
       class="guest-input-div hide">
    <div class="edit-guest-title">NEW GUEST</div>
  </div>
</div>
'''
    var hosts = sched.getHosts(task);
    var plusIcon = $("<img/>")
      .appendTo(plus);
    svg.loadImg(plusIcon, "/assets/img/plus.svg");

    var addButton = $("<button class='add-guest-btn btn btn-primary disabled'/>")
      .text("Add guest");

    function updateAddButton(edit) {
      if (edit.isValid())
        addButton.removeClass("disabled");
      else
        addButton.addClass("disabled");
    }
    var edit = editGuest(updateAddButton);

    guestInputDiv
      .append(edit.emailInput)
      .append(edit.firstNameInput)
      .append(edit.lastNameInput)
      .append(addButton);

    function toggleAddGuest() {
      if (guestInputDiv.hasClass("hide")) {
        view.removeClass("click-mode");
        addClick.addClass("cancel-mode");
        addGuest.addClass("hide");
        guestInputDiv.removeClass("hide");
        edit.emailInput.focus();
        adder
          .removeClass("return-to-add")
          .addClass("cancel");
        plus
          .removeClass("return-to-add")
          .addClass("cancel");
      } else {
        clearAddGuest();
      }
    }
    addClick.click(function() {
      toggleAddGuest();
    })

    function clearAddGuest() {
      edit.clearUid();
      $(".guest-input").val("");
      updateAddButton(edit);
      guestInputDiv.addClass("hide");
      addClick.removeClass("cancel-mode");
      addGuest.removeClass("hide");
      adder
        .removeClass("cancel")
        .addClass("return-to-add");
      plus
        .removeClass("cancel")
        .addClass("return-to-add");
      view.addClass("click-mode");
    }

    addButton.click(function() {
      var firstLast = edit.firstLast();
      var uid = edit.optUid;
      api.getProfile(uid).then(function(prof) {
        // TODO Allow pseudonym for guests?
        prof.first_last = firstLast;
        if (prof.editable) {
          api.postProfile(prof, login.getTeam().teamid);
        }
        profile.set(prof); /* update cache */

        guestTbl[uid] = uid;
        task.task_participants.organized_for.push(uid);

        profile.profilesOfTaskParticipants(task).then(function(profs) {
          delete sched.optionsForGuest(guestOptions, uid).assisted_by;
          rowViewOfParticipant(profs, task, hosts, guestTbl, guestOptions, uid)
            .appendTo(guestsContainer);
          saveGuests(task, hosts, guestTbl, guestOptions);
          updateNextButton(hosts, guestTbl, guestOptions);
        });
      });
      clearAddGuest();
    });

    return {
      view: view
    };
  }

  function viewOfEAProfile(profs, task, uid, removeEA) {
    var v = $("<div class='sched-step1-ea-row'>");

    var prof = profs[uid].prof;

    var edit = $("<button type='button' class='btn btn-default edit-guest-btn'>Edit</button>");
    var editProfile = $("<li class='edit-profile'><a>Edit profile</a></li>");
    var remove = $("<li><a class='remove-guest'>Remove assistant</a></li>");
    var editButton = $("<div class='btn-group edit-guest'/>")
      .append(edit)
      .append($("<button type='button' class='btn btn-default dropdown-toggle' data-toggle='dropdown'/>")
        .append($("<span class='caret'/>"))
        .append($("<span class='sr-only'>Toggle Dropdown</span>")))
      .append($("<ul class='dropdown-menu pull-right' role='menu'/>")
        .append(editProfile)
        .append(remove))
      .appendTo(v);
    remove.click(function() {
      removeEA();
    });

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

    v.append(branch)
     .append(chatHead)
     .append((nameView)
       .append(bridgeLink))
     .append(email);

    return v;
  }

  function viewOfProfile(v, profs, task, uid) {
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

    v.append(chatHead)
     .append((nameView)
       .append(bridgeLink))
     .append(email);
  }

  function viewOfEAInput(x, profs, task, guestUid, eaCheck,
                         hosts, guestTbl, guestOptions, makeViewOfEA) {
    var v = $("<div class='sched-step1-ea-row'/>");

    function updateAddButton(edit) {
      if (edit.isValid() && edit.optUid !== guestUid)
        $("#add-guest-ea-btn").removeClass("disabled");
      else
        $("#add-guest-ea-btn").addClass("disabled");
    }
    var edit = editGuest(updateAddButton);

    var branch = $("<div class='relationship-branch'>");
    var cancelCirc = $("<div class='add-guest-circ cancel'>");
    var cancelIcon = $("<img/>");
    var cancel = $("<div class='plus-guest cancel'/>")
      .append(cancelIcon)
      .appendTo(cancelCirc);
    svg.loadImg(cancelIcon, "/assets/img/plus.svg");
    var newEA = $("<div class='ea-input-div'/>")
                 .append($("<div class='edit-guest-title'>NEW ASSISTANT</div>"))
                 .append(edit.emailInput)
                 .append(edit.firstNameInput)
                 .append(edit.lastNameInput);
    var addButton = $("<button id='add-guest-ea-btn'/>")
      .addClass("btn btn-primary disabled")
      .text("Add assistant");
    newEA.append(addButton);

    addButton.click(function() {
      var firstLast = edit.firstLast();
      var uid = edit.optUid;
      api.getProfile(uid).then(function(prof) {
        // TODO Allow pseudonym for guests?
        prof.first_last = firstLast;
        if (prof.editable) {
          api.postProfile(prof, login.getTeam().teamid);
        }
        profile.set(prof); /* update cache */

        task.task_participants.organized_for.push(uid);

        profile.profilesOfTaskParticipants(task).then(function(profs) {
          sched.optionsForGuest(guestOptions, guestUid).assisted_by = uid;
          v.replaceWith(makeViewOfEA(profs, uid));
          saveGuests(task, hosts, guestTbl, guestOptions);
        });
      });
    });

    cancelCirc.click(function() {
      delete sched.optionsForGuest(guestOptions, guestUid).assisted_by;
      saveGuests(task, hosts, guestTbl, guestOptions);

      v.remove();
      x.removeClass("has-ea");
      eaCheck.removeClass("checkbox-selected");
    })

    v.append(branch)
     .append(cancelCirc)
     .append(newEA);

    return v;
  }

  /* Read-only view of a participant */
  function rowViewOfParticipant(profs, task, hosts, guestTbl, guestOptions,
                                uid) {
    var ea = sched.assistedBy(uid, guestOptions);
    var hasEA = util.isNotNull(ea);
    var view = $("<div class='sched-step1-row'>");
    var guestView = $("<div class='sched-step1-guest-row'>")
      .appendTo(view);

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
        .appendTo(guestView);

      remove.click(function() {
        var hosts = sched.getHosts(task);
        view.remove();
        updateNextButton(hosts, guestTbl, guestOptions);
        removeGuest(guestTbl, uid);
        saveGuests(task, hosts, guestTbl, guestOptions);
        updateNextButton(hosts, guestTbl, guestOptions);
      });

      viewOfProfile(guestView, profs, task, uid);

      var eaCheck = $("<div class='communicate-ea'/>");
      var checkbox = $("<img class='ea-checkbox'/>").appendTo(eaCheck);
      svg.loadImg(checkbox, "/assets/img/checkbox-sm.svg");
      eaCheck.append($("<div class='communicate-ea-text'/>")
        .text("Communicate with this guest's assistant"));

      var eaView = $("<div/>");
      view.append(eaCheck)
          .append(eaView);

      function removeEA() {
        delete sched.optionsForGuest(guestOptions, uid).assisted_by;
        saveGuests(task, hosts, guestTbl, guestOptions);

        eaView.children().remove();
        eaCheck.removeClass("checkbox-selected");
        guestView.removeClass("has-ea");
      }
      function viewOfEA(profs, ea) {
        return viewOfEAProfile(profs, task, ea, removeEA);
      }

      eaCheck.click(function() {
        if (eaCheck.hasClass("checkbox-selected")) {
          removeEA();
        } else {
          eaCheck.addClass("checkbox-selected");
          guestView.addClass("has-ea");
          eaView.append(viewOfEAInput(guestView, profs, task, uid, eaCheck,
                                      hosts, guestTbl, guestOptions, viewOfEA));
        }
      });

      if (hasEA) {
        eaCheck.addClass("checkbox-selected");
        guestView.addClass("has-ea");
        eaView.append(viewOfEA(profs, ea));
      }
    } else {
      viewOfProfile(guestView, profs, task, uid);
    }

    return view;
  }

  function collectGuests(hosts, guestTbl, guestOptions) {
    var result = {};
    function addResult(uid, mayAttend) {
      result[uid] = uid;
      sched.optionsForGuest(guestOptions, uid).may_attend = mayAttend;
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
    if (ta.task_status.task_progress !== "Confirmed") {
      ta.task_status.task_progress = "Coordinating";
      sched.getState(ta).scheduling_stage = "Coordinate";
    }
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
      rowViewOfParticipant(profs, ta, hosts, guestTbl, guestOptions, uid)
        .appendTo(hostsContainer);
    });

    list.iter(guests, function(uid) {
      rowViewOfParticipant(profs, ta, hosts, guestTbl, guestOptions, uid)
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
