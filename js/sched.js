/*
  Scheduling meetings

  We're using the following definitions:

  participant = anyone that will join the meeting
                (does not include organizers, unlike the general definition
                of a task)

  guest = participant who is not part of the organizing team

  organizer = one of the organizers of the meeting
              (right now, they are assumed to be part of the organizing team)

*/

var sched = (function() {

  var mod = {};

  function getState(task) {
    return task.task_data[1];
  }

  function setState(task, state) {
    task.task_data = ["Scheduling", state];
  }

  function isGuest(uid) {
    var team = login.data.team;
    return ! list.mem(team.team_leaders, uid);
  }

  function forEachParticipant(task, f) {
    list.iter(task.task_participants.organized_for, f);
  }

  function preFillConfirmModal(tid, chats, uid, obsProf) {
    var toView = $("sched-confirm-to");
    toView.children().remove();
    profile.view.photoPlusNameMedium(obsProf)
      .appendTo(toView);

    $("sched-confirm-subject")
      .val("Confirmation"); // TODO create more informative default subject

    var esc = util.htmlEscape;
    $("sched-confirm-message")
      .html(
        "<p>Dear " + esc(prof.full_name) + ",</p>" +
          "<p>Your appointment with " + esc("") + " is confirmed."
      )
      .text("");
  }

  function markCalendarInviteSent(uid) { // TODO
  }

  function sendCalendarInvite(tid, chats, uid) {
    api.postCalendarInvite(tid, uid)
      .done(function(chat) {
        chats[uid] = chat;
        if (chat.sent_calendar_invite) /* should be true */
          markCalendarInviteSent(uid);
      });
  }

  function step3RowViewOfParticipant(tid, chats, profs, uid, guest) {
    var view = $("<span class='sched-step3-row'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;
    var name = guest ? prof.full_name : prof.familiar_name;
    profile.view.photoPlusNameMedium(obsProf)
      .appendTo(view);
    $("<button class='btn btn-default'>Confirm</button>")
      .click(function(ev) {
        preFillConfirmModal(tid, chats, uid, obsProf);
        $("#sched-confirm-modal").modal({});
      })
      .appendTo(view);
    $("<button class='btn btn-default'>Send Calendar Invite</button>")
      .click(function(ev) {
        sendCalendarInvite(tid, chats, uid);
      })
      .appendTo(view);
    return view;
  }

  /* convert list of chats into a table keyed by the participant uid */
  function chatsOfTask(task) {
    var chats = {};
    forEachParticipant(task, function(uid) {
      var chat =
        list.find(task.task_chats, function(chat) {
          return list.exists(chat.chat_participants, function(par_status) {
            return (par_status.par_uid === uid);
          });
        });
      if (chat !== null)
        chats[uid] = chat;
    });
    return chats;
  }

  /*
    fetch the profiles of everyone involved in the task
    (deferred map from uid to profile)
  */
  function profilesOfEveryone(task) {
    var par = task.task_participants;
    var everyone = par.organized_by.concat(par.organized_for);
    return profile.mget(everyone)
      .then(function(a) {
        var b = {};
        list.iter(a, function(obsProf) {
          if (obsProf !== null)
            b[obsProf.prof.profile_uid] = obsProf;
        });
        return b;
      });
  }

  var tabHighlighter =
    show.withClass("sched-tab-highlight",
                   ["sched-progress-tab1",
                    "sched-progress-tab2",
                    "sched-progress-tab3"]);

  var tabSelector = show.create(["sched-step1-tab",
                                 "sched-step2-tab",
                                 "sched-step3-tab"]);

  var step1Selector = show.create(["sched-step1-connect",
                                   "sched-step1-prefs"]);

  function promptForCalendar(obsProf, calInfo) {
    var view = $("#sched-step1-connect");
    view.children().remove();

    var prof = obsProf.prof;
    $("<div class='center-msg'/>")
      .text("Connect with " + prof.familiar_name + "'s Google Calendar")
      .appendTo(view);
    $("<div class='center-msg'/>")
      .text("to let Esper help you ﬁnd available times.")
      .appendTo(view);
    $("<a class='btn btn-default'>Connect</a>")
      .attr("href", calInfo.google_auth_url)
      .appendTo(view);

    log("show sched-step1-connect");
    step1Selector.show("sched-step1-connect");
  }

  function connectCalendar(profs, task) {
    var leaderUid = login.data.team.team_leaders[0];
    var result;
    if (! list.mem(task.task_participants.organized_for, leaderUid)) {
      result = deferred.defer();
    }
    else {
      var authLandingUrl = document.URL;
      result = api.getCalendar(leaderUid, authLandingUrl)
        .then(function(calInfo) {
          if (!calInfo.has_calendar) {
            promptForCalendar(profs[leaderUid], calInfo);
          }
        });
    }
    return result;
  }

  function loadStep1Prefs() {
    log("show sched-step1-prefs");
    step1Selector.show("sched-step1-prefs");
  }

  function loadStep1(profs, task) {
    var view = $("#sched-step1-tab");

    connectCalendar(profs, task);

    tabHighlighter.show("sched-progress-tab1");
    tabSelector.show("sched-step1-tab");
  }

  function loadStep2(profs, task) {
    var view = $("#sched-step2-tab");
    view.children().remove();
    tabHighlighter.show("sched-progress-tab2");
    tabSelector.show("sched-step2-tab");
  }

  function loadStep3(profs, task) {
    var view = $("#sched-step3-tab");
    view.children().remove();

    var tid = task.tid;
    var chats = chatsOfTask(task);
    forEachParticipant(task, function(uid) {
      if (! isGuest(uid)) {
        var rowView =
          step3RowViewOfParticipant(tid, chats, profs, uid, false)
          .appendTo(view);
      }
    });
    forEachParticipant(task, function(uid) {
      if (isGuest(uid)) {
        var rowView =
          step3RowViewOfParticipant(tid, chats, profs, uid, true)
          .appendTo(view);
      }
    });
    tabHighlighter.show("sched-progress-tab3");
    tabSelector.show("sched-step3-tab");
  }

  mod.loadTask = function(task) {
    var state = task.task_data[1];
    var progress = state.scheduling_stage;
    profilesOfEveryone(task)
      .done(function(profs) {
        switch (progress) {
        case "Find_availability":
          loadStep1(profs, task);
          break;
        case "Coordinate":
          loadStep2(profs, task, state);
          break;
        case "Confirm":
          loadStep3(profs, task, state);
          break;
        default:
          log("Unsupported task_progress: " + progress);
        }
      });
  }

  return mod;
}());
