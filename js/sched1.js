/*
  Scheduling step 1
*/

var sched1 = (function() {
  var mod = {};

  var nextButton = $(".sched-step1-next");

  function rowViewOfNewParticipant(chats, profs, task, hosts, guestTbl) {
    var view = $("<div class='sched-step1-add-row'/>");

    var adder = $("<div class='add-guest-circ'>");
    var plus = $("<img id='plus'/>");
    plus.appendTo(adder);
    svg.loadImg(plus, "/assets/img/plus.svg");

    var addGuestText = $("<div/>")
    var addGuest = $("<a id='add-guest-text' class='unselectable'>Add guest</a>")
      .appendTo(addGuestText);
    var maxGuests = $("<p id='max-guests-text' class='unselectable'>No more guests can be added.</p>")
      .appendTo(addGuestText);
    updateAddGuestAbility();

    var emailInput = $("<input type='email'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Email address");
    var nameInput = $("<input type='text'/>")
      .addClass("form-control guest-input")
      .attr("placeholder", "Full name")
      .attr("disabled", true);
    var addButton = $("<button id='add-guest-btn' class='btn btn-primary disabled'/>")
      .text("Add");
    updateAddButton(hosts, guestTbl);
    var guestInputDiv = $("<div id='guest-input-div' class='hide'/>")
      .append(emailInput)
      .append(nameInput)
      .append(addButton);

    function updateAddGuestAbility() {
      var guests = collectGuests(hosts, guestTbl);
      if (guests.length == 0) {
        adder
          .unbind("click")
          .click(toggleAddGuest)
          .removeClass("add-guest-disabled");
        addGuestText.bind("click", toggleAddGuest);
        addGuest.removeClass("hide");
        maxGuests.addClass("hide");
      } else {
        adder
          .unbind("click")
          .addClass("add-guest-disabled");
        addGuestText.unbind("click", toggleAddGuest);
        addGuest.addClass("hide");
        maxGuests.removeClass("hide");
      }
    }

    function toggleAddGuest() {
      if (guestInputDiv.hasClass("hide")) {
        addGuestText.addClass("hide");
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
      })
      updateAddButton(hosts, guestTbl);
      guestInputDiv.addClass("hide");
      addGuestText.removeClass("hide");
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
            guestTbl[uid] = uid;
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

    addButton.click(function() {
      var name = nameInput.val();
      var uid = optUid;
        api.getProfile(uid)
          .then(function(prof) {
            name0 = prof.full_name;
            prof.full_name = name;
            prof.familiar_name = name;
            api.postProfile(prof);
            updateAddButton(hosts, guestTbl);
            /* need code here to add new guest to guestContainer
            and refresh table view */
          });
      clearAddGuest();
      updateAddGuestAbility();
    });

    view.append(adder)
        .append(addGuestText)
        .append(guestInputDiv);

    return view;
  }

  function rowViewOfParticipant(chats, profs, task, guestTbl, uid) {
    var view = $("<div class='sched-step1-row'>");
    var obsProf = profs[uid];
    log(obsProf);
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

    if (/*not host*/) {
      var remove = $("<img class='remove-guest'/>")
        .appendTo(view);
      svg.loadImg(remove, "/assets/img/x.svg");
      remove.click(function() {
        /* need code to remove guest task */
        view.remove();
        updateNextButton(hosts, guestTbl);
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
    var view = $("#sched-step1-table");
    $("<h3>Create the guest list.</h3>")
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

    var newGuestContainer = $("<div class='new-guest-container'>");
    rowViewOfNewParticipant(chats, profs, task, hosts, guestTbl)
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
