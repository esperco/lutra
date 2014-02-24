/*
  Scheduling step 1
*/

var sched1 = (function() {
  var mod = {};

  var nextButton = $(".sched-step1-next");

  /* Form allowing the user to enter a new participant
     at the bottom of the list */
  function rowViewOfNewParticipant(profs, task, hosts, guestTbl,
                                   guestsContainer) {
    var view = $("<div class='sched-step1-add-row'/>");

    var hosts = sched.getHosts(task);
    var adder = $("<div class='add-guest-circ'>");
    var plus = $("<img id='plus-guest'/>");
    plus.appendTo(adder);
    svg.loadImg(plus, "/assets/img/plus.svg");

    var addGuestDiv = $("<div/>");
    var addGuestText = $("<a id='add-guest-text' class='unselectable'/>")
      .text("Add guest")
      .appendTo(addGuestDiv);

    var emailInput = $("<input type='email'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Email address");
    var firstNameInput = $("<input type='text'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "First name")
      .attr("disabled", true);
    var lastNameInput = $("<input type='text'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Last name")
      .attr("disabled", true);
    var addButton = $("<button id='add-guest-btn'/>")
      .addClass("btn btn-primary disabled")
      .text("Add");
    updateAddButton(hosts, guestTbl);
    var guestInputDiv = $("<div id='guest-input-div' class='hide'/>")
      .append(emailInput)
      .append(firstNameInput)
      .append(lastNameInput)
      .append(addButton);

    function toggleAddGuest() {
      if (guestInputDiv.hasClass("hide")) {
        addGuestDiv.addClass("hide");
        guestInputDiv.removeClass("hide");
        emailInput.focus();
        adder
          .removeClass("return-to-add")
          .addClass("cancel");
      } else {
        clearAddGuest();
      }
    }
    addGuestDiv
      .click(toggleAddGuest);
    adder
      .click(toggleAddGuest);

    function clearAddGuest() {
      clearUid();
      $(".guest-input").each(function() {
        $(this).val("");
      });
      updateAddButton(hosts, guestTbl);
      guestInputDiv.addClass("hide");
      addGuestDiv.removeClass("hide");
      adder
        .removeClass("cancel")
        .addClass("return-to-add");
    }

    var optUid;

    function updateNameEditability(editable) {
      if (util.isString(optUid) && editable) {
        firstNameInput.removeAttr("disabled");
        lastNameInput.removeAttr("disabled");
      } else {
        firstNameInput.attr("disabled", true);
        lastNameInput.attr("disabled", true);
      }
    }

    function clearUid() {
      if (util.isString(optUid))
        delete guestTbl[optUid];
      optUid = null;
      updateNameEditability(false);
    }

    function fetchProfile() {
      var emailAddr = emailInput.val();
      if (email.validate(emailAddr)) {
        api.getProfileByEmail(emailAddr)
          .then(function(prof) {
            clearUid();
            var uid = prof.profile_uid;
            optUid = uid;
            firstNameInput.attr("id", "first-name-" + uid);
            lastNameInput.attr("id", "last-name-" + uid);
            emailInput.attr("id", "email-" + uid);
            // TODO Allow pseudonyms for guests?
            if (prof.first_last || ! prof.editable) {
              firstNameInput.val(prof.first_last[0]);
              lastNameInput.val(prof.first_last[1]);
            }
            updateNameEditability(prof.editable);
            updateAddButton(hosts, guestTbl);
          });
      } else {
        clearUid();
        updateAddButton(hosts, guestTbl);
      }
    }

    function updateAddButton(hosts, guestTbl) {
      var firstName = firstNameInput.val();
      var lastName = lastNameInput.val();
      if (isValidName(firstName) && isValidName(lastName)
          && util.isString(optUid))
        $("#add-guest-btn").removeClass("disabled");
      else
        $("#add-guest-btn").addClass("disabled");
    }

    util.afterTyping(emailInput, 250, function() {
      fetchProfile();
    });

    util.afterTyping(firstNameInput, 250, function() {
      updateAddButton();
    });
    util.afterTyping(lastNameInput, 250, function() {
      updateAddButton();
    });

    function addProfile(uid, prof) {
      profile.set(prof); /* update cache */
      updateAddButton(hosts, guestTbl);
      addGuest(task, guestTbl, uid)
        .then(function(profs) {
          guestsContainer
            .append(rowViewOfParticipant(profs, task, guestTbl, uid));
          saveGuests(task, hosts, guestTbl);
          updateNextButton(hosts, guestTbl);
        });
    }

    addButton.click(function() {
      var firstName = firstNameInput.val();
      var lastName = lastNameInput.val();
      var uid = optUid;
      api.getProfile(uid)
        .then(function(prof) {
          // TODO Allow pseudonym for guests?
          prof.first_last = [firstName, lastName];
          if (prof.editable) {
            api.postProfile(prof, login.getTeam().teamid)
              .then(addProfile(uid, prof));
          } else {
            // Bug fix: No need to post profile if name cannot be updated
            addProfile(uid, prof);
          }
        });
      clearAddGuest();
    });

    view.append(adder)
        .append(addGuestDiv)
        .append(guestInputDiv);

    return {
      view: view
    };
  }

  /* Read-only view of a participant */
  function rowViewOfParticipant(profs, task, guestTbl, uid) {
    var view = $("<div class='sched-step1-row'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;
    var hosts = sched.getHosts(task);
    var chatHead = profile.viewMediumCirc(prof);
    var nameView = profile.viewMediumFullName(prof);

    var bridgeButton = $("<button>bridge</button>").click(function() {
      api.getGuestAppURL(task.tid, uid).done(function (url) {
        window.location.assign(url.url);
      });
    });

    view
      .append(chatHead)
      .append(nameView)
      .append(bridgeButton);

    if (sched.isGuest(uid)) {
      var removeDiv = $("<div class='remove-guest-div'>")
        .tooltip({"title":"Remove guest"})
        .appendTo(view);
      var remove = $("<img class='remove-guest'/>")
        .appendTo(removeDiv);
      svg.loadImg(remove, "/assets/img/x.svg")
        .then(function(elt) {
          elt.click(function() {
            view.remove();
            updateNextButton(hosts, guestTbl);
            removeGuest(guestTbl, uid);
            saveGuests(task, hosts, guestTbl);
            updateNextButton(hosts, guestTbl);
          });
      });
    }

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
    return guests.length > 0;
  }

  function updateNextButton(hosts, guestTbl) {
    if (isReady(hosts, guestTbl))
      nextButton.removeClass("disabled");
    else
      nextButton.addClass("disabled");
  }

  /* add guest and return updated profile table (deferred) */
  function addGuest(ta, guestTbl, uid) {
    guestTbl[uid] = uid;
    ta.task_participants.organized_for.push(uid);
    return profile.profilesOfTaskParticipants(ta);
  }

  /* remove guest */
  function removeGuest(guestTbl, uid) {
    delete guestTbl[uid];
  }

  function updateGuests(ta, hosts, guestTbl) {
    var guests = collectGuests(hosts, guestTbl);
    ta.task_participants.organized_for = list.union(hosts, guests);
  }

  function saveGuests(ta, hosts, guestTbl) {
    updateGuests(ta, hosts, guestTbl);
    api.postTask(ta).done(observable.onTaskParticipantsChanged.notify);
  }

  function finalizeGuests(ta, hosts, guestTbl) {
    updateGuests(ta, hosts, guestTbl);
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

    var guests = sched.getGuests(ta);
    var guestTbl = list.toTable(guests);

    var addResult =
      rowViewOfNewParticipant(profs, ta, hosts, guestTbl, guestsContainer);

    var hosts = sched.getHosts(ta);
    list.iter(hosts, function(uid) {
      rowViewOfParticipant(profs, ta, guestTbl, uid)
        .appendTo(hostsContainer);
    });

    list.iter(guests, function(uid) {
      rowViewOfParticipant(profs, ta, guestTbl, uid)
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
        finalizeGuests(ta, hosts, guestTbl);
      });

    updateNextButton(hosts, guestTbl);

    observable.onSchedulingStepChanging.observe("step", function() {
      saveGuests(ta, hosts, guestTbl);
    });
  };

  return mod;
}());
