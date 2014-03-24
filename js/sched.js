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

  mod.optionsForGuest = function(guestOptions, guestUid) {
    var options = guestOptions[guestUid];
    if (! util.isNotNull(options)) {
      options = {uid:guestUid};
      guestOptions[guestUid] = options;
    }
    return options;
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

  mod.sentEmail = function(ta, uid, chatKind) {
    return list.exists(ta.task_chat_items, function(x) {
      return list.mem(x.to, uid)
          && variant.cons(x.chat_item_data) === chatKind;
    });
  };

  /******************************************/

  function viewOfNotes(slot) {
'''
<div #view>
  <div #publicNotes/>
  <div #privateNotes/>
</div>
'''
    publicNotes.text(slot.notes.public_notes);
    privateNotes.text(slot.notes.private_notes);
    if (publicNotes.text() === "" && privateNotes.text() === "") {
      return "";
    } else {
      return view;
    }
  }

  function getDirections(x) {
    return "http://maps.google.com/?daddr="
      + x.location.coord.lat + "," + x.location.coord.lon;
  }

  mod.locationText = function(loc) {
    var instrSuffix = util.isNonEmptyString(loc.instructions) ?
      " (" + loc.instructions + ")" : "";

    if (util.isNonEmptyString(loc.address))
      return loc.address + instrSuffix;
    else if (util.isNonEmptyString(loc.title))
      return loc.title + instrSuffix;
    else if (util.isNonEmptyString(loc.timezone))
      return "Time Zone: " + timezone.format(loc.timezone) + instrSuffix;
    else if (util.isNonEmptyString(loc.instructions))
      return instructions;
    else
      return "";
  }

  function viewOfAddress(x) {
    var locText = chat.locationText(x.location);
    if (locText) {
      return $("<span>" + locText + "</span>")
        .click(function() {
          // window.open(getDirections(x));
          window.open("http://www.google.com/maps/search/"
                      + encodeURIComponent(locText));
        })
    } else {
      return $("<div class='tbd'>TBD</div>");
    }
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

  function formatDates(x) {
    return sched.viewOfDates(date.ofString(x.start),
                             date.ofString(x.end));
  }

  /* Render a range of two javascript Dates as text */
  mod.viewOfDates = function(date1, date2) {
'''
<div #view>
  <div #time1/>
  <div #time2>
    <span #at
          class="time-at hide"> at </span>
    <span #start
          class="bold"/>
    <span #to
          class="time-to"> to </span>
    <span #end
          class="time-end bold"/>
  </div>
</div>
'''
    time1
      .append(date.weekDay(date1).substring(0,3) + ", ")
      .append(date.dateOnlyWithoutYear(date1));

    start.text(wordify(date.timeOnly(date1)));
    if (util.isNotNull(date2)) {
      end.text(wordify(date.timeOnly(date2)));
    } else {
      at.removeClass("hide");
      to.addClass("hide");
    }

    return view;
  };

  mod.formatMeetingType = function(slot) {
    var typ = slot.meeting_type;
    switch (typ) {
    case "Call":      return "Phone Call";
    case "Nightlife": return "Night Life";
    default:          return typ;
    }
  }

  mod.summaryOfOption = function(slot, showLoc) {
'''
<div #view>
  <div class="info-row">
    <div #what
         class="summary-type"/>
  </div>
  <div class="info-row">
    <div #when/>
  </div>
  <div #whereRow
       class="info-row">
    <div #pinContainer/>
    <div #whereName
         class="bold hide"/>
    <div #whereAddress
         class="link"/>
  </div>
</div>
'''
    what.text(mod.formatMeetingType(slot).toUpperCase());
    when.append(formatDates(slot));
    if (showLoc) {
      var pin = $("<img class='pin'/>");
        pin.appendTo(pinContainer);
      svg.loadImg(pin, "/assets/img/pin.svg");
      whereName.text(slot.location.title);
      if (whereName !== "")
        whereName.removeClass("hide");
      whereAddress.append(viewOfAddress(slot));
    } else {
      whereRow.addClass("hide");
    }

    return _view;
  }

  mod.viewOfOption = function(slot) {
'''
<td #view
    class="option-info">
  <div class="info-row">
    <div class="info-label">WHAT</div>
    <div #what
         class="info"/>
  </div>
  <div class="info-row">
    <div class="info-label">WHEN</div>
    <div #when
         class="info"/>
  </div>
  <div class="info-row">
    <div class="info-label">WHERE</div>
    <div #where
         class="info">
      <div #whereName
           class="bold hide"/>
      <div #whereAddress
           class="link"/>
    </div>
  </div>
  <div #notesRow
       class="info-row hide">
    <div class="info-label">NOTES</div>
    <div #notes
         class="info"/>
  </div>
</td>
'''
    what.text(mod.formatMeetingType(slot));
    when.append(formatDates(slot));
    whereName.text(slot.location.title);
    if (whereName.text() !== "")
      whereName.removeClass("hide");
    whereAddress.append(viewOfAddress(slot));
    notes.append(viewOfNotes(slot));
    if (notes.text() !== "")
      notesRow.removeClass("hide");

    return _view;
  }

  var tabHighlighter =
    show.create({
      "sched-progress-tab1": {ids: ["sched-progress-tab1"]},
      "sched-progress-tab2": {ids: ["sched-progress-tab2"]},
      "sched-progress-tab4": {ids: ["sched-progress-tab4"]}
    },
    { onClass: "sched-tab-highlight", offClass: "" }
    );

  var tabSelector = show.create({
    "sched-step1-tab": {ids: ["sched-step1-tab"]},
    "sched-step2-tab": {ids: ["sched-step2-tab"]},
    "sched-step4-tab": {ids: ["sched-step4-tab"]}
  });

  function loadStep1(profs, task) {
    var view = $("#sched-step1-table");
    view.children().remove();

    sched1.load(profs, task, view);

    tabHighlighter.show("sched-progress-tab1");
    tabSelector.show("sched-step1-tab");
  };

  function loadStep2(tzList, profs, task) {
    var view = $("#sched-step2-table");

    sched2.load(tzList, profs, task, view);

    tabHighlighter.show("sched-progress-tab2");
    tabSelector.show("sched-step2-tab");
  };

  function loadStep4(profs, task) {
    var view = $("#sched-step4-table");
    view.children().remove();

    sched4.load(profs, task, view);

    tabHighlighter.show("sched-progress-tab4");
    tabSelector.show("sched-step4-tab");
  };

  function setup_step_buttons(tzList, ta, prog) {
    $(".sched-go-step1")
      .unbind('click')
      .click(function() {
        observable.onSchedulingStepChanging.notify();
        profile.profilesOfTaskParticipants(ta).done(function(profs) {
          loadStep1(profs, ta);
        });
      });
    $(".sched-go-step2")
      .attr('disabled', prog !== "Find_availability" && prog !== "Coordinate")
      .unbind('click')
      .click(function() {
        observable.onSchedulingStepChanging.notify();
        profile.profilesOfTaskParticipants(ta).done(function(profs) {
          loadStep2(tzList, profs, ta);
        });
      });

    $(".sched-go-step4")
      .attr('disabled', prog !== "Confirm")
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
        setup_step_buttons(tzList, ta, progress);
        profile.profilesOfTaskParticipants(ta)
          .done(function(profs) {
            switch (progress) {
            case "Guest_list":
              loadStep1(profs, ta);
              break;
            case "Find_availability":
              // Interpreted as Coordinate until case is removed from type
              loadStep2(tzList, profs, ta);
              break;
            case "Coordinate":
              loadStep2(tzList, profs, ta);
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
