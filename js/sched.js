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
    return list.toTable(mod.getState(task).participant_options,
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

  mod.getTimezone = function(slot) {
    var tz = slot.timezone;
    if (! util.isNonEmptyString(tz) && util.isDefined(slot.location))
      tz = slot.location.timezone;
    return tz;
  };

  mod.getMeetingType = function(ta) {
    var state = mod.getState(ta);
    var reserved = state.reserved;
    if (util.isNotNull(reserved)) // Finalized meeting
      return reserved.slot.meeting_type;
    else { // Not yet finalized
      var options = state.calendar_options;
      if (util.isNotNull(options) && options.length > 0) {
        // If all options have the same meeting_type, use it
        var sharedType = options[0].slot.meeting_type;
        for (var i = 1; i < options.length; i++) {
          if (options[i].slot.meeting_type !== sharedType) {
            sharedType = "Meeting";
            break;
          }
        }
        return sharedType;
      } else // No options selected yet
        return "Meeting";
    }
  }

  mod.getMeetingTitle = function(profs, ta) {
    var guests = sched.getAttendingGuests(ta);
    if (guests.length === 0) return "New Meeting Request";
    var names = [];
    list.iter(guests, function(guest) {
      names.push(profile.fullNameOrEmail(profs[guest].prof));
    });
    return mod.getMeetingType(ta) + " with " + names.join(" + ");
  }

  mod.taskStatus = function(ta) {
    var time = date.ofString(ta.task_status_text.status_timestamp);
    var statusEvent = mod.eaStatus(ta);
    var statusTimeAgo = date.viewTimeAgo(time);
    var statusTime = date.utcToLocalTimeOnly(time);
    return {
      event: statusEvent,
      timeAgo: statusTimeAgo,
      time: statusTime
    };
  }


  /******************************************/

  function viewOfNotes(slot) {
'''
<div #view>
  <div #publicNotes/>
  <div #privateNotes/>
</div>
'''
    var notes = util.isDefined(slot.notes) ?
      slot.notes
      : { public_notes: "", private_notes: "" };
    publicNotes.text(notes.public_notes);
    privateNotes.text(notes.private_notes);
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
    return mod.viewOfDates(date.ofString(x.start),
                           date.ofString(x.end),
                           mod.getTimezone(x));
  }

  /* Render a range of two javascript Dates as text */
  mod.viewOfDates = function(date1, date2, tz) {
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
    <div #timezoneElt
          class="timezone-text"/>
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
    timezoneElt.text(timezone.format(tz, date1));

    return view;
  };

  mod.showLocation = function(meetingType) {
    switch (meetingType) {
    case "Call":
      return false;
    default:
      return true;
    }
  };

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
    what.text(slot.meeting_type.toUpperCase());
    when.append(formatDates(slot));
    if (showLoc && mod.showLocation(slot.meeting_type)) {
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

  mod.viewOfOption = function(slot, profs) {
'''
<td #view
    class="option-info">
  <div class="info-row">
    <div class="info-label">WHAT</div>
    <div #what
         class="info"/>
  </div>
  <div #callerRow
       class="info-row hide">
    <div class="info-label">CALLER</div>
    <div #caller
         class="info"/>
  </div>
  <div class="info-row">
    <div class="info-label">WHEN</div>
    <div #when
         class="info"/>
  </div>
  <div #whereRow
       class="info-row">
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
    what.text(slot.meeting_type);
    when.append(formatDates(slot));
    if (mod.showLocation(slot.meeting_type)) {
      whereName.text(slot.location.title);
      if (whereName.text() !== "")
        whereName.removeClass("hide");
      whereAddress.append(viewOfAddress(slot));
    }
    else
      whereRow.addClass("hide");

    notes.append(viewOfNotes(slot));
    if (notes.text() !== "")
      notesRow.removeClass("hide");

    if (slot.meeting_type === "Call") {
      var slotCaller =
        util.isNotNull(slot.caller) ?
        slot.caller :
        login.leader();
      var prof = profs[slotCaller].prof;
      var name = profile.fullNameOrEmail(prof);
      var phone = profile.phone(prof);
      caller.text(name + " : " + phone);
      callerRow.removeClass("hide");
    }

    return _view;
  }

  var tabSelector = show.create({
    "sched-step2-tab": {ids: ["sched-step2-tab"]},
    "sched-step4-tab": {ids: ["sched-step4-tab"]},
    "messages-tab": {ids: ["messages-tab"]},
    "setup-tab": {ids: ["setup-tab"]}
  });

  function loadStep2(profs, task) {
    var view = $("#sched-step2-table");
    view.children().remove();

    sched2.load(profs, task, view);
    tabSelector.show("sched-step2-tab");
  };

  function loadStep4(profs, task) {
    var view = $("#sched-step4-table");
    view.children().remove();

    sched4.load(profs, task, view);
    tabSelector.show("sched-step4-tab");
  };

  function loadMessages(task) {
    chat.loadTaskChats(task);
    tabSelector.show("messages-tab");
    $(".chat-entry").focus();
  };

  function loadSetup(profs, task) {
    var view = $("#setup-table");
    view.children().remove();

    schedSetup.load(profs, task, view);
    tabSelector.show("setup-tab");
  };

  function highlight(tab) {
    $(".show-" + tab + "-tab").addClass("active");
    if (tab === "setup") {
      $(".show-setup-tab").removeClass("disabled");
      $(".show-coordination-tab").removeClass("active");
      $(".show-messages-tab").removeClass("active");
    } else if (tab === "coordination") {
      $(".show-setup-tab").removeClass("active");
      $(".show-coordination-tab").removeClass("disabled");
      $(".show-messages-tab").removeClass("active");
    } else if (tab === "messages") {
      $(".show-setup-tab").removeClass("active");
      $(".show-coordination-tab").removeClass("active");
      $(".show-messages-tab").removeClass("disabled");
    }
  }

  function setup_step_buttons(ta, prog) {
    $(".show-coordination-tab")
      .off("click")
      .click(function() {
        if (ta.task_status.task_progress !== "Confirmed") {
          ta.task_status.task_progress = "Coordinating";
          prog = "Coordinate";
        }
        sched.loadTask(ta);
        highlight("coordination");
      });
    $(".show-messages-tab")
      .off("click")
      .click(function() {
        loadMessages(ta);
        highlight("messages");
      });
    $(".show-setup-tab")
      .off("click")
      .click(function() {
        profile.profilesOfTaskParticipants(ta).done(function(profs) {
          loadSetup(profs, ta);
        });
        highlight("setup");
      });
  }

  mod.loadTask = function(ta) {
    task.loadTaskTitle(ta);
    var state = ta.task_data[1];
    var progress = state.scheduling_stage;
    tabSelector.hideAll();
    setup_step_buttons(ta, progress);
    profile.profilesOfTaskParticipants(ta)
      .done(function(profs) {
        switch (progress) {
        case "Guest_list":
          highlight("setup");
          loadSetup(profs, ta);
          break;
        case "Find_availability":
          // Interpreted as Coordinate until case is removed from type
          highlight("coordination");
          loadStep2(profs, ta);
          break;
        case "Coordinate":
          highlight("coordination");
          loadStep2(profs, ta);
          break;
        case "Confirm":
          highlight("coordination");
          loadStep4(profs, ta);
          break;
        default:
          log("Unknown scheduling stage: " + progress);
        }
        util.focus();
      });
  };

  mod.isToDoStep = function(ta) {
    var step = ta.task_status_text.status_step;
    switch (step) {
      case "Offer_meeting_options":
      case "Follow_up_with_guest":
      case "Finalize_meeting_details":
      case "Confirm_with_guest":
        return true;
      default:
        return false;
    }
  }

  mod.isReminderStep = function(ta) {
    var step = ta.task_status_text.status_step;
    switch (step) {
      case "No_reminder_scheduled":
      case "Reminder_scheduled":
      case "Reminder_sent":
        return true;
      default:
        return false;
    }
  }

  /* The EA Web app status formatting shows what they need to do,
     while the exec mobile status formatting shows what the EA is doing */
  mod.eaStatus = function(ta) {
    var step = ta.task_status_text.status_step;
    var plural_s = ta.task_participants.organized_for.length > 2 ? "s" : "";
    if (step === "Offer_meeting_options")
      return "Offer meeting options";
    else if (step === "Wait_on_guest")
      return "Waiting on guest" + plural_s;
    else if (step === "Follow_up_with_guest")
      return "Follow up with guest" + plural_s;
    else if (step === "Finalize_meeting_details")
      return "Finalize meeting details";
    else if (step === "Confirm_with_guest")
      return "Confirm with guest" + plural_s;
    else if (step === "No_reminder_scheduled")
      return "No reminder" + plural_s + " scheduled";
    else if (step === "Reminder_scheduled")
      return "Reminder" + plural_s + " scheduled";
    else if (step === "Reminder_sent")
      return "Reminder" + plural_s + " sent";
    else
      // Should never happen
      return "UNRECOGNIZED TASK STATUS STEP";
  }

  return mod;
}());
