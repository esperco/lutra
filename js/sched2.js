/*
  Scheduling step 2
*/

var sched2 = (function() {
  var mod = {};

  var step2Selector = show.create({
    "sched-step2-connect": {ids: ["sched-step2-connect"]},
    "sched-step2-prefs": {ids: ["sched-step2-prefs"]}
  });

  // Set in loadStep2Prefs, used by geocodeAddress
  var timeZoneDropdown = null;

  function clearLocation() {
    $("#sched-step2-loc-addr").val("");
    $("#sched-step2-loc-notes").val("");
  }

  function getLocation() {
    var addr = $("#sched-step2-loc-addr").val();
    var notes = $("#sched-step2-loc-notes").val();
    return {
      title: addr,
      address: addr,
      instructions: notes,
      timezone: timeZoneDropdown.get()
    };
  }

  function loadLocation(locations) {
    if (locations && locations.length > 0) {
      var loc = locations[0];
      $("#sched-step2-loc-addr").val(loc.address);
      if (loc.timezone) {
        timeZoneDropdown.set(loc.timezone);
      }
    }
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
     and move on to step 3. */
  function selectCalendarSlots(ta, slots) {
    var x = ta.task_data[1];
    ta.task_status.task_progress = "Coordinating"; // status in the task list
    x.scheduling_stage = "Coordinate"; // step in the scheduling page

    /* TODO: reserve calendar slots for leader of organizing team,
             unreserve previously-reserved calendar slots */
    x.calendar_options = labelSlots(slots);

    /* reset further fields */
    delete x.availabilities;
    delete x.reserved;

    api.postTask(ta)
      .done(function(task) { sched.loadTask(task); });
  }

  function loadStep2Prefs(tzList, task) {
    var view = $("#sched-step2-pref-time");
    view.children().remove();

    var viewTimeZone = $("#sched-step2-time-zone");
    viewTimeZone.children().remove();

    function setTextEventDate(start, end) {
    }

    var calendar = calpicker.createPicker({
      timezone: "America/Los_Angeles",
      setTextEventDate: setTextEventDate
    });

    var setCalEventDate = calendar.setCalEventDate;
    view.append(calendar.calendarView);

    /* type of meeting */
    function opt(label, key) {
      return { label: label, key: key };
    }
    var sel1 = select.create({
      divClass: "fill-div",
      buttonClass: "fill-div",
      options: [
        opt("Breakfast", "breakfast"),
        opt("Lunch", "lunch"),
        opt("Dinner", "dinner"),
        opt("Night life", "nightlife"),
        opt("Coffee", "coffee"),
        opt("Phone call", "call"),
        opt("Meeting (Any time)", "meeting"),
      ]
    });

    var grid = $("<div/>")
      .appendTo(view);

    var colType = $("<div class='col-sm-4'/>")
      .appendTo(grid);
    var colDuration = $("<div class='col-sm-4'/>")
      .appendTo(grid);
    var colUrgency = $("<div class='col-sm-4'/>")
      .appendTo(grid);

    var optionType = $("<div class='pref-time-title'>Meeting Type</div>")
      .appendTo(colType);
    var optionDuration = $("<div class='pref-time-title'>Duration</div>")
      .appendTo(colDuration);
    var optionUrgency = $("<div class='pref-time-title'>Urgency</div>")
      .appendTo(colUrgency);
    var optionTimeZone = $("<div class='location-title'>Time Zone</div>")
      .appendTo(viewTimeZone);

    sel1.view.appendTo(colType);

    $("<input id='dur-hour' type='number' min='0'/>")
      .change(durationChange)
      .appendTo(colDuration);
    colDuration.append("hrs");
    $("<input id='dur-minute' type='number' min='0'/>")
      .change(durationChange)
      .appendTo(colDuration);
    colDuration.append("mins ");
    colDuration.append("<br/>");
    colDuration.append("+ buffer ");
    $("<input id='buffer-minute' type='number' min='0'/>")
      .change(mergeSelections)
      .appendTo(colDuration);
    colDuration.append("mins");

    var q = taskMeetingParam(task);
    loadLocation(q.location);
    sel1.set(q.meeting_type.toLowerCase());
    if (q.duration) setDuration(q.duration);
    if (q.buffer_time) $("#buffer-minute").val(q.buffer_time / 60);
    loadDaysOfWeek(q);
    loadHowSoon(q.how_soon);
    $("#starting").val(q.no_sooner ? q.no_sooner : "0");

    step2Selector.show("sched-step2-prefs");
  }

  /* hitting "Connect" takes the user to Google, then back here with
     a full reload */
  function promptForCalendar(obsProf, calInfo) {
    var view = $("#sched-step2-connect");
    view.children().remove();

    var prof = obsProf.prof;
    $("<div class='center-msg'/>")
      .text("Connect with " + profile.fullName(prof) + "'s Google Calendar")
      .appendTo(view);
    $("<div class='center-msg'/>")
      .text("to let Esper help you ﬁnd available times.")
      .appendTo(view);
    $("<a class='btn btn-default'>Connect</a>")
      .attr("href", calInfo.google_auth_url)
      .appendTo(view);

    step2Selector.show("sched-step2-connect");
  }

  function connectCalendar(tzList, profs, task) {
    var leaderUid = login.leader();
    var result;
    if (! list.mem(task.task_participants.organized_for, leaderUid)) {
      result = deferred.defer(loadStep2Prefs(tzList, task));
    }
    else {
      var authLandingUrl = document.URL;
      result = api.getCalendarInfo(leaderUid, authLandingUrl)
        .then(function(calInfo) {
          if (!calInfo.has_calendar)
            promptForCalendar(profs[leaderUid], calInfo);
          else
            loadStep2Prefs(tzList, task);
        });
    }
    return result;
  }


  mod.load = function(tzList, profs, ta) {
    suggestionArea.show("idle");
    clearLocation();
    util.afterTyping($("#sched-step2-loc-addr"), 250, predictAddress);
    connectCalendar(tzList, profs, ta);

    // TODO Better way to do this?
    var editModal = $("#edit-place-modal");
    editModal.on("hidden.bs.modal", function() {
      $("#edit-place-save").off("click");
    });

    task.onSchedulingStepChanging.observe("step", function() {
      api.postTask(ta);
    });
  };

  return mod;
}());
