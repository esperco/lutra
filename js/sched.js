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
        "<p>Dear " + esc(obsProf.full_name) + ",</p>" +
          "<p>Your appointment with " + esc("") + " is confirmed."
      )
      .text("");
  }

  function editEventDetails(tid, chats, uid) {
    api.postCalendarInvite(tid, uid)
       .done(function(chat) {
        chats[uid] = chat;
        if (chat.sent_calendar_invite) /* should be true */
          markCalendarInviteSent(uid);
      });
  }
      /*The above function doesn't do anything right now, but it should be a function accessed on click (or automatically popped).
      It should accomplish the following:
      1. Auto-filling event details
      2. Allowing editing of event details */

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
    var view = $("<div class='sched-step3-row'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;
    
    /* var name = guest ? prof.full_name : prof.familiar_name;
    profile.view.photoPlusNameMedium(obsProf)
      .appendTo(view); */

    /* Commented out the above because button actions will cause global actions
    to all participants */
    

    $("<button class='btn btn-default'>Edit event details</button>")
      .click(function(ev) {
        editEventDetails(tid, chats, uid, obsProf);
        $("#sched-confirm-modal").modal({});
      })
      .appendTo(view);
    
    /*Don't which modal above to call*/

    $("<button class='btn btn-default'>Send a confirmation message</button>")
      .click(function(ev) {
        preFillConfirmModal(tid, chats, uid, obsProf);

        $("#sched-confirm-modal").modal({});
      })
      .appendTo(view);

    $("<button class='btn btn-default'>Send a Calendar Invite</button>")
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
            loadStep1Prefs(tzList, profs, task);
        });
    }
    return result;
  }

  function viewOfSuggestion(x) {
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

  function refreshSuggestions(profs, task, x) {
    var view = $("#sched-step1-suggestions");
    view.addClass("hide");
    view.children().remove();

    var contMsg =
      $("<div>Select up to 3 options to present to participants.</div>")
      .appendTo(view);

    /* maintain a list of at most 3 selected items, first in first out */
    var selected = [];

    var contButton = $("<button class='btn btn-default' disabled/>")
      .text("Continue")
      .click(function() {
        var slots = list.map(selected, function(v) { return v[1].slot; });
        selectCalendarSlots(profs, task, slots);
      })
      .appendTo(contMsg);

    function updateContButton() {
      if (selected.length > 0) {
        contButton.attr('disabled', false);
      }
      else {
        contButton.addClass("esper-btn-disabled");
        contButton.attr('disabled', true);
      }
    }

    function remove(k) {
      delete selected[k];
      var a = [];
      for (var i in selected)
        a.push(selected[i]);
      selected = a;
    }

    function unselect(kv, i) {
      if (util.isArray(kv)) {
        kv[1].untick();
        remove(i);
      }
      updateContButton();
    }

    function select(k, v) {
      if (selected.length === 3)
        unselect(selected[2], 2);
      selected.push([k, v]);
      updateContButton();
    }

    list.iter(x.suggestions, function(slot, k) {
      var slotView = $("<div/>");
      var circle = $("<div class='circ'></div>");
      var sugDetails = viewOfSuggestion(slot);
      slotView.click(function() {
        var index;
        var kv = list.find(selected, function(kv, i) {
          index = i;
          return util.isArray(kv) && kv[0] === k;
        });
        if (kv !== null)
          unselect(kv, index);
        else {
          var v = {
            slot: slot,
            untick: function() { circle.removeClass("circ-selected")},
          };
          circle.addClass("circ-selected");
          select(k, v);
        }
      });

      circle.appendTo(slotView);
      sugDetails.appendTo(slotView);
      slotView.appendTo(view);
    });

    view.removeClass("hide");
  }

  function loadSuggestions(profs, task, meetingParam) {
    task.task_meeting_request = meetingParam;
    api.getSuggestions(meetingParam)
      .done(function(x) { refreshSuggestions(profs, task, x); });
  }

  function locationOfTimezone(tz) {
    return {
      title: "",
      address: "",
      instructions: "",
      timezone: tz
    };
  }

  function initMeetingParam(task) {
    return {
      participants: task.task_participants.organized_for,
      location: [locationOfTimezone("US/Pacific")],
      on_site: true
    };
    /* uninitialized but required:
         how_soon, duration, buffer_time */
    /* uninitialized and optional:
         meeting_type, time_of_day_type, time_of_day */
  }

  function loadSuggestionsIfReady(profs, task, meetingParam) {
    /* check for possibly missing fields
       to make a valid suggest_meeting_request */
    if (util.isDefined(meetingParam.how_soon)
        && util.isDefined(meetingParam.duration)
        && util.isDefined(meetingParam.buffer_time))
      loadSuggestions(profs, task, meetingParam);
  }

  function loadStep1Prefs(tzList, profs, task) {
    var view = $("#sched-step1-prefs");
    view.children().remove();

    /* all times and durations given in minutes, converted into seconds */
    function initTimes(x,
                       lengthMinutes, bufferMinutes,
                       optEarliest, optLatest) {
      x.duration = 60 * lengthMinutes;
      x.buffer_time = 60 * bufferMinutes;
      if (util.isDefined(optEarliest) && util.isDefined(optLatest))
        x.time_of_day = {
          start: timeonly.ofMinutes(optEarliest),
          length: 60 * (optLatest - optEarliest)
        };
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

    function equalMeetingParam(a, b) {
      /* this will return false if the field order differs */
      return JSON.stringify(a) === JSON.stringify(b);
    }

    var breakfast =
      initTimes({ meeting_type: "Breakfast" },
                75, 15, hour(8), hour(10,30));

    var lunch =
      initTimes({ meeting_type: "Lunch" },
                75, 15, hour(11,30), hour(13,30));

    var dinner =
      initTimes({ meeting_type: "Dinner" },
                90, 30, hour(18,00), hour(20,30));

    var nightlife =
      initTimes({ meeting_type: "Nightlife" },
                120, 30, hour(19), hour(22));

    var coffee =
      initTimes({ meeting_type: "Coffee" },
                30, 15);

    var call =
      initTimes({ meeting_type: "Call" },
                25, 5, hour(7), hour(20));

    var meeting =
      initTimes({}, 45, 15);

    var morning =
      initTimes({ time_of_day_type: "Morning" },
                45, 15, hour(8), hour(11));

    var afternoon =
      initTimes({ time_of_day_type: "Afternoon"},
                45, 15, hour(13), hour(18));

    var late_night =
      initTimes({ time_of_day_type: "Late_night" },
                45, 15, hour(19), hour(22));

    /* inter-dependent dropdowns for setting scheduling constraints */
    var sel1, sel2, sel3, sel4;

    /* value holding the current scheduling constraints;
       an event is fired each time it changes */
    var meetingParam = initMeetingParam(task);

    /* read values from selectors 1-4 and update the meetingParam */
    function mergeSelections() {
      var old = meetingParam;
      var x = initMeetingParam(task);
      util.addFields(x, sel1.get());
      x.location[0].timezone = sel2.get();
      util.addFields(x, sel3.get());
      x.how_soon = sel4.get();
      meetingParam = x;
      log(x);
      if (! equalMeetingParam(old, meetingParam))
        loadSuggestionsIfReady(profs, task, meetingParam);
    }

    /* try to match the duration selected as part of the meeting type (sel1)
       with the duration selector (sel3) */
    function action1(x) {
      if (util.isDefined(x)) {
        var k = ((x.duration + x.buffer_time) / 60).toString();
        log("sel3 key: " + k);
        sel3.set(k);
        mergeSelections();
      }
    }

    function action2(x) {
      mergeSelections();
    }

    function action3(x) {
      mergeSelections();
    }

    function action4(x) {
      mergeSelections();
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
      defaultAction: action2,
      options: tzOptions
    });

    /* duration and buffer time specified in minutes, converted to seconds */
    function dur(dur,buf) {
      return { duration: 60 * dur,
               buffer_time: 60 * buf };
    }
    var sel3 = select.create({
      defaultAction: action3,
      options: [
        { label: "60 min", key: "60", value: dur(45,15) },
        { label: "45 min", key: "45", value: dur(30,15) },
        { label: "30 min", key: "30", value: dur(25,5) },
        { label: "15 min", key: "15", value: dur(10,5) },
        { label: "1 hour 15 min",  key: "75", value: dur(60,15) },
        { label: "1 hour 30 min",  key: "90", value: dur(75,15) },
        { label: "2 hours",        key: "120", value: dur(105,15) },
        { label: "2 hours 30 min", key: "150", value: dur(120,30) }
      ]
    });

    /* urgency */
    var sel4 = select.create({
      defaultAction: action4,
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

  function labelSlots(slots) {
    return list.map(slots, function(x) {
      return {
        label: util.randomString(),
        slot: x
      };
    });
  }

  /* Record the options for the meeting selected by the user
     and move on to step 2. */
  function selectCalendarSlots(profs, task, slots) {
    var x = task.task_data[1];
    x.scheduling_stage = "Coordinate";
    /* TODO: reserve calendar slots for leader of organizing team,
             unreserve previously-reserved calendar slots */
    x.calendar_options = labelSlots(slots);

    /* reset further fields */
    delete x.availabilities;
    delete x.reserved;

    api.postTask(task)
      .done(function(task) { loadStep2(profs, task); });
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
    /* view.children().remove(); */

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
