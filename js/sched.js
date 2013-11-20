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

  function isGuest(uid) {
    var team = login.data.team;
    return ! list.mem(team.team_leaders, uid);
  }

  function forEachParticipant(task, f) {
    util.iter (task.task_participants.organized_for, function(uid) {
      f(uid);
    });
  }

  function preFillConfirmModal(tid, chats, uid, prof) {
    var toView = $("sched-confirm-to");
    toView.children().remove();
    profile.view.photoPlusNameMedium
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
    var name = guest ? prof.full_name : prof.familiar_name;
    profile.view.photoPlusNameMedium(prof)
      .appendTo(view);
    $("<button class='btn btn-default'>Confirm</button>")
      .click(function(ev) {
        preFillConfirmModal(tid, chats, uid, prof);
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
        util.find(task.task_chats, function(chat) {
          return util.exists(chat.chat_participants, function(par_status) {
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
        list.iter(a, function(prof) {
          if (prof !== null)
            b[prof.profile_uid] = prof;
        });
        return b;
      });
  }

  function loadStep3(task) {
    var view = $("#sched-step3-table");
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
      });
  }

  mod.loadTask = function(task) {
    var progress = task.task_status.task_progress;
    switch (progress) {
    case "Unread_by_organizer":
      loadStep1(task);
      break;
    case "Coordinating":
      loadStep2(task);
      break;
    case "Confirmed";
      loadStep3(task);
      break;
    case "Closed":
      loadStep4(task);
      break;
    default:
      log("Unsupported task_progress: " + progress);
    }
  }

  return mod;
}());
