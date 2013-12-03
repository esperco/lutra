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

  /***** Scheduling-related utilities *****/

  mod.getState = function(task) {
    return task.task_data[1];
  };

  mod.setState = function(task, state) {
    task.task_data = ["Scheduling", state];
  };

  mod.isGuest = function(uid) {
    var team = login.data.team;
    return ! list.mem(team.team_leaders, uid);
  };

  mod.forEachParticipant = function forEachParticipant(task, f) {
    list.iter(task.task_participants.organized_for, f);
  };

  /******************************************/

  mod.viewOfSuggestion = function(x) {
    var view = $("<div class='sug-details'/>");

    var t1 = date.ofString(x.start);
    var t2 = date.ofString(x.end);

    var row1 = $("<div/>")
      .text(date.weekDay(t1))
      .appendTo(view);

    var row2 = $("<div/>")
      .text(date.dateOnly(t1))
      .appendTo(view);

    var row3 = $("<div/>")
      .append(html.text("from "))
      .append($("<b>").text(date.timeOnly(t1)))
      .append(html.text(" to "))
      .append($("<b>").text(date.timeOnly(t2)))
      .appendTo(view);

    return view;
  }

  /* convert list of chats into a table keyed by the participant uid */
  mod.chatsOfTask = function(task) {
    var chats = {};
    mod.forEachParticipant(task, function(uid) {
      var chat =
        list.find(task.task_chats, function(chat) {
          return uid === chat.chat_data[1].chat_with;
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

  mod.loadStep1 = function(tzList, profs, task) {
    var view = $("#sched-step1-tab");

    sched1.load(tzList, profs, task);

    tabHighlighter.show("sched-progress-tab1");
    tabSelector.show("sched-step1-tab");
  }

  mod.loadStep2 = function(profs, task) {
    var view = $("#sched-step2-tab");
    view.children().remove();

    sched2.load(profs, task, view);

    tabHighlighter.show("sched-progress-tab2");
    tabSelector.show("sched-step2-tab");
  }

  mod.loadStep3 = function(profs, task) {
    var view = $("#sched-step3-table");
    view.children().remove();

    sched3.load(profs, task, view);

    tabHighlighter.show("sched-progress-tab3");
    tabSelector.show("sched-step3-tab");
  }

  mod.loadTask = function(task) {
    var state = task.task_data[1];
    var progress = state.scheduling_stage;
    api.getTimezones()
      .done(function(x) {
        var tzList = x.timezones;
        profilesOfEveryone(task)
          .done(function(profs) {
            switch (progress) {
            case "Find_availability":
              mod.loadStep1(tzList, profs, task);
              break;
            case "Coordinate":
              mod.loadStep2(profs, task, state);
              break;
            case "Confirm":
              mod.loadStep3(profs, task, state);
              break;
            default:
              log("Unknown scheduling stage: " + progress);
            }
          });
      });
  }

  return mod;
}());
