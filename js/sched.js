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

  /* hitting "Connect" takes the user to Google, then back here with
     a full reload */
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

  function connectCalendar(tzList, profs, task) {
    var leaderUid = login.data.team.team_leaders[0];
    var result;
    if (! list.mem(task.task_participants.organized_for, leaderUid)) {
      result = deferred.defer();
    }
    else {
      var authLandingUrl = document.URL;
      result = api.getCalendar(leaderUid, authLandingUrl)
        .then(function(calInfo) {
          if (!calInfo.has_calendar)
            promptForCalendar(profs[leaderUid], calInfo);
          else
            loadStep1Prefs(tzList);
        });
    }
    return result;
  }

  function loadStep1Prefs(tzList) {
    var view = $("#sched-step1-prefs");
    view.children().remove();

    /* all times and durations given in minutes, converted into seconds */
    function timeOfDay(lengthMinutes, bufferMinutes,
                       optEarliest, optLatest) {
      var x = {};
      x.duration = 60 * lengthMinutes;
      x.buffer_time = 60 * bufferMinutes;
      if (util.isString(optEarliest))
        x.earliest = 60 * optEarliest;
      if (util.isString(optLatest))
        x.latest = 60 * optLatest;
      return x;
    }

    /* time only, in minutes from midnight */
    function hour(h,m) {
      var x = 0;
      x = x + 60 * h;
      if (m > 0)
        x = x + m;
      return x;
    }

    var breakfast = {
      meeting_type: "Breakfast",
      time_of_day: timeOfDay(75, 15, hour(8), hour(10,30))
    };

    var lunch = {
      meeting_type: "Lunch",
      time_of_day: timeOfDay(75, 15, hour(11,30), hour(13,30))
    };

    var dinner = {
      meeting_type: "Dinner",
      time_of_day: timeOfDay(90, 30, hour(18,00), hour(20,30))
    };

    var nightlife = {
      meeting_type: "Nightlife",
      time_of_day: timeOfDay(120, 30, hour(19), hour(22))
    };

    var coffee = {
      meeting_type: "Coffee",
      time_of_day: timeOfDay(30, 15)
    };

    var call = {
      meeting_type: "Call",
      time_of_day: timeOfDay(25, 5, hour(7), hour(20))
    };

    var meeting = {
      time_of_day: timeOfDay(45, 15)
    };

    var morning = {
      time_of_day_type: "Morning",
      time_of_day: timeOfDay(45, 15, hour(8), hour(11))
    };

    var afternoon = {
      time_of_day_type: "Afternoon",
      time_of_day: timeOfDay(45, 15, hour(13), hour(18))
    };

    var late_night = {
      time_of_day_type: "Late_night",
      time_of_day: timeOfDay(45, 15, hour(19), hour(22))
    };

    var sel1, sel2, sel3, sel4;

    /* try to match the duration selected as part of the meeting type (sel1)
       with the duration selector (sel3) */
    function action1(x) {
      var tod = x.time_of_day;
      if (util.isDefined(tod)) {
        var k = ((tod.duration + tod.buffer_time) / 60).toString();
        sel3.set(k);
      }
    }

    /* type of meeting */
    function opt(label, key, value, action) {
      return { label: label, key: key, value: value, action: action };
    }
    var sel1 = select.create({
      options: [
        opt("Select one"),
        opt("Breakfast", "breakfast", breakfast, action1),
        opt("Lunch", "lunch", lunch, action1),
        opt("Dinner", "dinner", dinner, action1),
        opt("Night life", "nightlife", nightlife, action1),
        opt("Coffee", "coffee", coffee, action1),
        opt("Phone call", "call", call, action1),
        opt("Meeting (Any time)", "meeting", meeting, action1),
        opt("Meeting (Morning)", "morning", morning, action1),
        opt("Meeting (Afternoon)", "afternoon", afternoon, action1),
        opt("Meeting (Evening)", "late_night", late_night, action1)
      ]
    });

    /* time zone */
    var tzOptions =
      list.map(tzList, function(tz) { return { label: tz, value: tz }; });
    var sel2 = select.create({
      options: tzOptions
    });

    /* duration and buffer time specified in minutes, converted to seconds */
    function dur(dur,buf) {
      return { duration: 60 * dur,
               buffer_time: 60 * buf };
    }
    var sel3 = select.create({
      options: [
        { label: "60 min", key: "60", value: dur(45,15) },
        { label: "45 min", key: "45", value: dur(30,15) },
        { label: "30 min", key: "30", value: dur(25,5) },
        { label: "15 min", key: "15", value: dur(10,5) },
        { label: "1 hour 15 min",  key: "75", value: dur(60,15) },
        { label: "1 hour 30 min",  key: "90", value: dur(75,30) },
        { label: "2 hours",        key: "120", value: dur(105,15) },
        { label: "2 hours 30 min", key: "150", value: dur(120,30) }
      ]
    });

    /* urgency */
    var sel4 = select.create({
      options: [
        { label: "Within 2 weeks", key: "2weeks", value: 14 * 86400 },
        { label: "Within 1 week", key: "1week", value: 7 * 86400 },
        { label: "Within 2 days", key: "2days", value: 2 * 86400 },
        { label: "Today", key: "12hours", value: 12 * 3600 },
      ]
    });

    var grid = $("<div class='row'/>")
      .appendTo(view);

    var col1 = $("<div class='col-md-6'/>")
      .appendTo(grid);

    var col2 = $("<div class='col-md-6'/>")
      .appendTo(grid);

    var cell1 = $("<div>Type </div>")
      .appendTo(col1);
    var cell2 = $("<div>Time Zone </div>")
      .appendTo(col2);
    var cell3 = $("<div>Duration </div>")
      .appendTo(col1);
    var cell4 = $("<div>Urgency </div>")
      .appendTo(col2);

    sel1.view.appendTo(cell1);
    sel2.view.appendTo(cell2);
    sel3.view.appendTo(cell3);
    sel4.view.appendTo(cell4);

    step1Selector.show("sched-step1-prefs");
  }

  function loadStep1(tzList, profs, task) {
    var view = $("#sched-step1-tab");

    connectCalendar(tzList, profs, task);

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
    api.getTimezones()
      .done(function(x) {
        var tzList = x.timezones;
        profilesOfEveryone(task)
          .done(function(profs) {
            switch (progress) {
            case "Find_availability":
              loadStep1(tzList, profs, task);
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
      });
  }

  return mod;
}());
