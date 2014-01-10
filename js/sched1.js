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
    var plus = $("<img id='plus'/>");
    plus.appendTo(adder);
    svg.loadImg(plus, "/assets/img/plus.svg");

    var addGuestDiv = $("<div/>");
    var addGuestText = $("<a id='add-guest-text' class='unselectable'/>")
      .text("Add guest")
      .appendTo(addGuestDiv);
    var maxGuests = $("<p id='max-guests-text' class='unselectable'/>")
      .text("No more guests can be added.")
      .appendTo(addGuestDiv);

    var emailInput = $("<input type='email'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Email address");
    var nameInput = $("<input type='text'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Full name")
      .attr("disabled", true);
    var addButton = $("<button id='add-guest-btn'/>")
      .addClass("btn btn-primary disabled")
      .text("Add");
    updateAddButton(hosts, guestTbl);
    var guestInputDiv = $("<div id='guest-input-div' class='hide'/>")
      .append(emailInput)
      .append(nameInput)
      .append(addButton);

    function updateAddGuestAbility() {
      var guests = collectGuests(hosts, guestTbl);
      if (guests.length === 0) {
        adder
          .unbind("click")
          .click(toggleAddGuest)
          .removeClass("add-guest-disabled");
        addGuestDiv.bind("click", toggleAddGuest);
        addGuestText.removeClass("hide");
        maxGuests.addClass("hide");
      } else {
        adder
          .unbind("click")
          .addClass("add-guest-disabled");
        addGuestDiv.unbind("click");
        addGuestText.addClass("hide");
        maxGuests.removeClass("hide");
      }
    }

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

    function fetchProfile() {
      var emailAddr = emailInput.val();
      if (email.validate(emailAddr)) {
        api.getProfileByEmail(emailAddr)
          .then(function(prof) {
            clearUid();
            var uid = prof.profile_uid;
            optUid = uid;
            nameInput.attr("id", "name-" + uid);
            emailInput.attr("id", "email-" + uid);
            if (prof.full_name !== emailAddr || ! prof.editable)
              nameInput.val(prof.full_name);
            updateNameEditability(prof.editable);
            updateAddButton(hosts, guestTbl);
          });
      } else {
        clearUid();
        updateAddButton(hosts, guestTbl);
      }
    }

    function updateAddButton(hosts, guestTbl) {
      var name = nameInput.val();
      if (isValidName(name) && util.isString(optUid))
        $("#add-guest-btn").removeClass("disabled");
      else
        $("#add-guest-btn").addClass("disabled");
    }

    util.afterTyping(emailInput, 500, function() {
      fetchProfile();
    });

    util.afterTyping(nameInput, 500, function() {
      updateAddButton();
    });

    function addProfile(uid, prof) {
      profile.set(prof); /* update cache */
      updateAddButton(hosts, guestTbl);
      addGuest(task, guestTbl, uid)
        .then(function(profs) {
          guestsContainer
            .append(rowViewOfParticipant(profs, task, guestTbl, uid,
                                         updateAddGuestAbility));
          updateAddGuestAbility();
          saveGuests(task, hosts, guestTbl);
          updateNextButton(hosts, guestTbl);
        });
    }

    addButton.click(function() {
      var name = nameInput.val();
      var uid = optUid;
      api.getProfile(uid)
        .then(function(prof) {
          prof.full_name = name;
          prof.familiar_name = name;
          if (prof.editable) {
            api.postProfile(prof).then(addProfile(uid, prof));
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
      view: view,
      updateAddGuestAbility: updateAddGuestAbility
    };
  }

  /* Read-only view of a participant */
  function rowViewOfParticipant(profs, task, guestTbl, uid,
                                updateAddGuestAbility) {
    var view = $("<div class='sched-step1-row'>");
    var hosts = sched.getHosts(task);
    var obsProf = profs[uid];
    var prof = obsProf.prof;
    var name = prof.full_name;
    var chatHead = $("<div class='list-prof-circ'>");
    var initials = $("<div class='initials unselectable'>")
      .text(profile.veryShortNameOfProfile(prof))
      .appendTo(chatHead);

    var nameView = $("<p class='guest-name'>" + name + "</p>");

    view
      .append(chatHead)
      .append(nameView);

    if (sched.isGuest(uid)) {
      var remove = $("<img class='remove-guest'/>")
        .appendTo(view);
      svg.loadImg(remove, "/assets/img/x.svg")
        .then(function(elt) {
          elt.click(function() {
            view.remove();
            updateNextButton(hosts, guestTbl);
            removeGuest(guestTbl, uid);
            updateAddGuestAbility();
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
    return task.profilesOfEveryone(ta);
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
    api.postTask(ta).done(task.onTaskParticipantsChanged.notify);
  }

  function finalizeGuests(ta, hosts, guestTbl) {
    updateGuests(ta, hosts, guestTbl);
    ta.task_status.task_progress = "Coordinating";
    sched.getState(ta).scheduling_stage = "Find_availability";
    api.postTask(ta).done(function(ta) {
      sched.loadTask(ta);
      task.onTaskParticipantsChanged.notify(ta);
    });
  }

  mod.load = function(profs, task, view) {
    var view = $("#sched-step1-table");
    view.children().remove();
    $("<h3>Create the guest list.</h3>")
      .appendTo(view);

    var hostsContainer = $("<div class='hosts-container'>");
    var newGuestContainer = $("<div class='new-guest-container'>");
    var guestsContainer = $("<div class='guests-container'/>");

    var guests = sched.getGuests(task);
    var guestTbl = list.toTable(guests);

    var addResult =
      rowViewOfNewParticipant(profs, task, hosts, guestTbl, guestsContainer);

    var hosts = sched.getHosts(task);
    list.iter(hosts, function(uid) {
      rowViewOfParticipant(profs, task, guestTbl, uid,
                           addResult.updateAddGuestAbility)
        .appendTo(hostsContainer);
    });

    list.iter(guests, function(uid) {
      rowViewOfParticipant(profs, task, guestTbl, uid,
                           addResult.updateAddGuestAbility)
        .appendTo(guestsContainer);
    });
    addResult.updateAddGuestAbility();

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
        finalizeGuests(task, hosts, guestTbl);
      });

    updateNextButton(hosts, guestTbl);
  };

  return mod;
}());
