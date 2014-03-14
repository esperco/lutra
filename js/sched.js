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

  mod.getCalendarTitle = function(state) {
    var t = state.calendar_event_title;
    return util.isString(t.custom) ? t.custom : t['default'];
  };

  mod.isGuest = function(uid) {
    var team = login.getTeam();
    return ! list.mem(team.team_leaders, uid);
  };

  mod.getParticipants = function(task) {
    return task.task_participants.organized_for;
  };

  mod.getHosts = function(task) {
    var team = login.getTeam();
    return list.inter(mod.getParticipants(task), team.team_leaders);
  };

  function getGuests(task) {
    var team = login.getTeam();
    return list.diff(mod.getParticipants(task), team.team_leaders);
  }

  mod.getGuestOptions = function(task) {
    return list.toTable(sched.getState(task).participant_options,
                        function(x){return x.uid;});
  }

  mod.assistedBy = function(uid, guestOptions) {
    var options = guestOptions[uid];
    return util.isNotNull(options) ? options.assisted_by : null;
  }

  mod.guestMayAttend = function(uid, guestOptions) {
    var options = guestOptions[uid];
    return ! util.isNotNull(options)
        || false !== options.may_attend;
  }

  mod.getAttendingGuests = function(task) {
    var guestOptions = mod.getGuestOptions(task);
    return list.filter(getGuests(task), function(uid) {
      return mod.guestMayAttend(uid, guestOptions);
    });
  }

  mod.forEachParticipant = function(task, f) {
    list.iter(mod.getParticipants(task), f);
  };

  /******************************************/

  mod.locationText = function(loc) {
    if (loc.address) {
      if (loc.instructions)
        return loc.address + " (" + loc.instructions + ")";
      else
        return loc.address;
    }
    else if (loc.title)
      return loc.title;
    else if (loc.instructions)
      return loc.instructions;
    else
      return "";
  }

  mod.viewOfSuggestion = function(x, score) {
    var view = $("<div class='sug-details'/>");

    var t1 = date.ofString(x.start);
    var t2 = date.ofString(x.end);

    var row1 = $("<div class='day-text'/>")
      .text(date.weekDay(t1) + " ")
      .appendTo(view);

    if (score >= 0.75) {
      $("<span style='color:#ff0'/>")
        .addClass("glyphicon glyphicon-star")
        .appendTo(row1);
    }

    var row2 = $("<div class='date-text'/>")
      .text(date.dateOnly(t1))
      .appendTo(view);

    var fromTime = wordify(date.timeOnly(t1));
    var toTime = wordify(date.timeOnly(t2));

    var row3 = $("<div class='time-text'/>")
      .append(html.text("from "))
      .append($("<b>").text(fromTime))
      .append(html.text(" to "))
      .append($("<b>").text(toTime))
      .appendTo(view);

    var row4 = $("<div class='time-text-short hide'/>")
      .append(html.text("at "))
      .append($("<b>").text(date.timeOnly(t1)))
      .appendTo(view);

    var locText = mod.locationText(x.location);
    var locDiv = $("<div class='loc-text'/>");
    var pin = $("<img class='pin'/>");
      pin.appendTo(locDiv);
    svg.loadImg(pin, "/assets/img/pin.svg");
    if (locText) {
      locDiv.append(html.text(locText))
            .appendTo(view);
    } else {
      locDiv.append("Location TBD")
            .addClass("tbd")
            .appendTo(view);
    }

    return view;
  }

  /*
    Get meeting type for a confirmed event and perform some translation
    for display purposes.
   */
  mod.formatMeetingType = function(slot) {
    var typ = slot.meeting_type;
    switch (typ) {
    case "Call":      return "Phone Call";
    case "Nightlife": return "Night Life";
    default:          return typ;
    }
  }

  function getDirections(x) {
    return "http://maps.google.com/?daddr="
      + x.location.coord.lat + "," + x.location.coord.lon;
  }

  function viewOfLocationOnly(x) {
    var view = $("<div id='address'/>");

    var locText = chat.locationText(x.location);
    if (locText) {
      view.append(html.text(locText));
    } else {
      view.append("TBD")
          .addClass("tbd")
    }

    view.click(function() {
      // window.open(getDirections(x));
      window.open("http://www.google.com/maps/search/"
                  + encodeURIComponent(locText));
    });

    return view;
  }

  function wordify(time) {
    if (time === "12:00 am") {
      return "Midnight";
    } else if (time === "12:00 pm") {
      return "Noon";
    } else {
      return time;
    }
  }

  function describeTimeSlot(start, end, hideEndTime) {
    var fromTime = wordify(date.timeOnly(start));
    if (hideEndTime) {
      return "at " + fromTime;
    } else {
      var toTime = wordify(date.timeOnly(end));
      return fromTime + " to " + toTime;
    }
  }

  function viewOfTimeOnly(x, hideEndTime) {
    var view = $("<div/>");
    var time1 = $("<div/>")
      .appendTo(view);
    var time2 = $("<div class='start-end'/>")
      .appendTo(view);

    var t1 = date.ofString(x.start);
    var t2 = date.ofString(x.end);

    time1
      .append(date.weekDay(t1) + ", ")
      .append(date.dateOnly(t1))
    time2
      .append(describeTimeSlot(t1, t2, hideEndTime));

    return view;
  }

  mod.viewOfOption = function(option, typ, hideEndTime) {
    var view = $("<td class='option-info'/>");

    var what = $("<div class='info-row'/>")
      .appendTo(view);
    var whatLabel = $("<div class='info-label'/>")
      .text("WHAT")
      .appendTo(what);
    var meetingType = $("<div class='info'/>")
      .text(typ)
      .appendTo(what);

    var when = $("<div class='info-row'/>")
      .appendTo(view);
    var whenLabel = $("<div class='info-label'/>")
      .text("WHEN")
      .appendTo(when);
    var time = viewOfTimeOnly(option.slot, hideEndTime)
      .addClass("info")
      .appendTo(when);

    var where = $("<div class='info-row'/>")
      .appendTo(view);
    var whereLabel = $("<div class='info-label'/>")
      .text("WHERE")
      .appendTo(where);
    var loc = viewOfLocationOnly(option.slot)
      .addClass("info link")
      .appendTo(where);

    var notes = $("<div class='info-row hide'/>")
      .appendTo(view);
    var notesLabel = $("<div class='info-label'/>")
      .text("NOTES")
      .appendTo(notes);
    var notesText = $("<div class='info'/>")
      .appendTo(notes);
    if (notesText.text() != "") {
      notes.removeClass("hide");
    }

    return view;
  }

  /* convert list of chats into a table keyed by the participant uid */
  mod.chatsOfTask = function(task) {
    var chats = {};
    mod.forEachParticipant(task, function(uid) {
      var chat =
        list.find(task.task_chats, function(chat) {
          return chat.chatid !== task.task_context_chat
              && (chat.chat_with
                  ? uid === chat.chat_with
                  : uid === chat.chat_participants[0].par_uid); // a hack for the old data without chat_with field
        });
      if (chat !== null)
        chats[uid] = chat;
    });
    return chats;
  }

  var tabHighlighter =
    show.create({
      "sched-progress-tab1": {ids: ["sched-progress-tab1"]},
      "sched-progress-tab2": {ids: ["sched-progress-tab2"]},
      "sched-progress-tab3": {ids: ["sched-progress-tab3"]},
      "sched-progress-tab4": {ids: ["sched-progress-tab4"]}
    },
    { onClass: "sched-tab-highlight", offClass: "" }
    );

  var tabSelector = show.create({
    "sched-step1-tab": {ids: ["sched-step1-tab"]},
    "sched-step2-tab": {ids: ["sched-step2-tab"]},
    "sched-step3-tab": {ids: ["sched-step3-tab"]},
    "sched-step4-tab": {ids: ["sched-step4-tab"]}
  });

  function loadStep1(profs, task) {
    var view = $("#sched-step1-content");
    view.children().remove();

    sched1.load(profs, task, view);

    tabHighlighter.show("sched-progress-tab1");
    tabSelector.show("sched-step1-tab");
  };

  function loadStep2(tzList, profs, task) {
    var view = $("#sched-step2-tab");

    sched2.load(tzList, profs, task);

    tabHighlighter.show("sched-progress-tab2");
    tabSelector.show("sched-step2-tab");
  };

  function loadStep3(profs, task) {
    var view = $("#sched-step3-table");
    view.children().remove();

    sched3.load(profs, task, view);

    tabHighlighter.show("sched-progress-tab3");
    tabSelector.show("sched-step3-tab");
  };

  function loadStep4(profs, task) {
    var view = $("#sched-step4-table");
    view.children().remove();

    sched4.load(profs, task, view);

    tabHighlighter.show("sched-progress-tab4");
    tabSelector.show("sched-step4-tab");
  };

  function setup_step_buttons(tzList, ta) {
    $(".sched-go-step1")
      .unbind('click')
      .click(function() {
        observable.onSchedulingStepChanging.notify();
        profile.profilesOfTaskParticipants(ta).done(function(profs) {
          loadStep1(profs, ta);
        });
      });
    $(".sched-go-step2")
      .attr('disabled', getGuests(ta) <= 0)
      .unbind('click')
      .click(function() {
        observable.onSchedulingStepChanging.notify();
        profile.profilesOfTaskParticipants(ta).done(function(profs) {
          loadStep2(tzList, profs, ta);
        });
      });
    $(".sched-go-step3")
      .attr('disabled', mod.getState(ta).calendar_options.length <= 0)
      .unbind('click')
      .click(function() {
        observable.onSchedulingStepChanging.notify();
        profile.profilesOfTaskParticipants(ta).done(function(profs) {
          loadStep3(profs, ta);
        });
      });
    $(".sched-go-step4")
      .attr('disabled', ! mod.getState(ta).reserved)
      .unbind('click')
      .click(function() {
        observable.onSchedulingStepChanging.notify();
        profile.profilesOfTaskParticipants(ta).done(function(profs) {
          loadStep4(profs, ta);
        });
      });
  }

  mod.loadTask = function(ta) {
    var state = ta.task_data[1];
    var progress = state.scheduling_stage;
    tabSelector.hideAll();
    api.getTimezones()
      .done(function(x) {
        var tzList = x.timezones;
        setup_step_buttons(tzList, ta);
        profile.profilesOfTaskParticipants(ta)
          .done(function(profs) {
            switch (progress) {
            case "Guest_list":
              loadStep1(profs, ta);
              break;
            case "Find_availability":
              loadStep2(tzList, profs, ta);
              break;
            case "Coordinate":
              loadStep3(profs, ta);
              break;
            case "Confirm":
              loadStep4(profs, ta);
              break;
            default:
              log("Unknown scheduling stage: " + progress);
            }
            util.focus();
          });
      });
  };

  return mod;
}());
