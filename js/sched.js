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

  function promptForCalendar() {
    var view = $("#sched-step1-connect");
    var text1 = $("<div class='center-msg'/>")
      .text("Connect with " + prof.familiar_name + "'s Google Calendar"
            + "to let Esper help you ﬁnd available times.")
      .appendTo(view);
    var butt = $("<button>Connect</button>")
      /* make it a link to Google Auth */
      .appendTo(view);

    var continueAnyway = ...
      .appendTo(view);

    step1Selector.show("sched-step1-connect");
  }

  function connectCalendar(task) {
    var leaderUid = login.data.team.team_leaders[0];
    var result;
    if (! list.mem(task.task_participants.organized_for, leaderUid)) {
      result = deferred.defer();
    }
    else {
      result = api.getCalendar(leaderUid)
        .then(function(x) {
          if (!x.has_calendar) {
            promptForCalendar();
          }
        });
    }
    return result;
  }

  function loadStep1Prefs() {
    step1Selector.show("sched-step1-prefs");
  }

  function loadStep1(task) {
    var view = $("#sched-step1-tab");
    view.children().remove();

    connectCalendar(task)
      .done(function() {
        loadStep1Prefs();
      });

    tabHighlighter.show("sched-progress-tab1");
    tabSelector.show("sched-step1-tab");
  }

  function loadStep2(task) {
    var view = $("#sched-step2-tab");
    view.children().remove();
    tabHighlighter.show("sched-progress-tab2");
    tabSelector.show("sched-step2-tab");
  }

  function loadStep3(task) {
    var view = $("#sched-step3-tab");
    view.children().remove();

    var tid = task.tid;
    var chats = chatsOfTask(task);
    profilesOfEveryone(task)
      .done(function(profs) {

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
      });
  }

  mod.loadTask = function(task) {
    var state = task.task_data[1];
    var progress = state.scheduling_stage;
    switch (progress) {
    case "Find_availability":
      loadStep1(task);
      break;
    case "Coordinate":
      loadStep2(task, state);
      break;
    case "Confirm":
      loadStep3(task, state);
      break;
    default:
      log("Unsupported task_progress: " + progress);
    }
  }

  return mod;
}());
