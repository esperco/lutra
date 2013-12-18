/*
  Scheduling step 1
*/

var sched1 = (function() {
  var mod = {};

  function finalizeGuests() {
    task.task_status.task_progress = "Coordinating";
    sched.getState(task).scheduling_stage = "Find_availability";
    api.postTask(task)
      .done(function(task) { sched.loadStep2(profs, task); });
  }

  function rowViewOfNewParticipant(chats, profs, task, guestTbl) {
    var view = $("<div class='sched-step1-row'/>");
    var nameInput = $("<input/>");
    var emailInput = $("<input/>");

    function fetchProfile() {
      var emailAddr = emailInput.val();
      if (email.validate(emailAddr)) {
        api.getProfileByEmail(emailAddr)
          .then(function(prof) {
            var uid = prof.profile_uid;
            guestTbl[uid] = true;
            nameInput.attr("id", "name-" + uid);
            emailInput.attr("id", "email-" + uid);
            var name0 = nameInput.val();
            if (name0 === "" && ! email.validate(prof.full_name))
              nameInput.val(prof.full_name);
        });
      }
    }

    util.afterTyping(emailInput, 500, function() {
      fetchProfile();
    });

    var name = prof.full_name;
    var initials = $("<p class='initials'>")
      .text(profile.veryShortNameOfProfile(prof));

    $("<p class='guest-name'>" + name + "</p>")
      .appendTo(view);
    return view;
  }

  function rowViewOfParticipant(chats, profs, task, guestTbl, uid) {
    var view = $("<div class='sched-step1-row'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;
    var name = prof.full_name;
    var initials = $("<p class='initials'>")
      .text(profile.veryShortNameOfProfile(prof));

    $("<p class='guest-name'>" + name + "</p>")
      .appendTo(view);
    return view;
  }

  function tableOfArray(a) {
    var tbl = {};
    list.iter(a, function(k) {
      tbl[k] = true;
    });
    return tbl;
  }

  mod.load = function(profs, task, view) {
    $("<h3>Confirm the guest list.</h3>")
      .appendTo(view);

    var chats = sched.chatsOfTask(task);
    var next = $(".sched-step1-next");

    var hostsContainer = $("<div class='hosts-container'>");
    var hosts = sched.getHosts(task);
    list.iter(hosts, function(uid) {
      rowViewOfParticipant(chats, profs, task, guestTbl, uid)
        .appendTo(hostsContainer);
    });

    var guestsContainer = $("<div class='guests-container'>");
    var guests = sched.getGuests(task);
    var guestTbl = tableOfArray(guests);
    list.iter(guests, function(uid) {
      rowViewOfParticipant(chats, profs, task, guestTbl, uid)
        .appendTo(guestsContainer);
    });

    var adder = $("<div>")
      .text("Add guest")
      .click(function() {
        rowViewOfNewParticipant(chats, profs, task, guestTbl)
          .appendTo(guestsContainer);
      });

    view
      .append(hostsContainer)
      .append(guestsContainer)
      .append(adder);

    next
      .unbind('click')
      .click(function() {
        finalizeGuests(profs, task, selected);
      });
  };

  return mod;
}());
