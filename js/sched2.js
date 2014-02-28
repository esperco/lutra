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

  /*
    For now just a dropdown menu of meeting types.
    May be accompanied with options specific to the type of meeting selected.
  */
  function createMeetingTypeSelector(onSet, optInitialKey) {
    function opt(label, value) {
      return { label: label, value: value, action: onSet };
    }
    var initialKey = util.isString(optInitialKey) ? optInitialKey : "meeting";
    var meetingTypeSelector = select.create({
      divClass: "fill-div",
      buttonClass: "fill-div",
      initialKey: initialKey,
      options: [
        opt("Meeting", "meeting"),
        opt("Breakfast", "breakfast"),
        opt("Lunch", "lunch"),
        opt("Dinner", "dinner"),
        opt("Coffee", "coffee"),
        opt("Night life", "nightlife"),
        opt("Phone call", "call")
      ]
    });
    return meetingTypeSelector;
  }

  /*
    Create a view and everything needed to display and edit location
    and time for a meeting option.
    The input is an object with mutable fields
    for place and time, which may or may not be set to initial values.
  */
  function createMeetingOptionPicker(data) {
    var view = $("<div/>");

    /* meeting type */

    function setMeetingType(meetingType) {
      log(meetingType);
    }

    var meetingTypeSelector = createMeetingTypeSelector(setMeetingType);

    /* location */

    var location = locpicker.create({});

    /* date and time */

    function setTextEventDate(start, end) {
    }

    var calendar = calpicker.createPicker({
      timezone: "America/Los_Angeles",
      setTextEventDate: setTextEventDate
    });

    var setCalEventDate = calendar.setCalEventDate;

    view
      .append(meetingTypeSelector.view)
      .append(location.locationView)
      .append(calendar.calendarView);

    return view;
  }

  function loadStep2Prefs(tzList, task) {
    var view = $("#sched-step2-option-list");
    view.children().remove();

    var meetingOption = {};
    view.append(createMeetingOptionPicker(meetingOption));

/*
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
    var optionTimeZone = $("<div class='location-title'>Time Zone</div>")
      .appendTo(viewTimeZone);

    sel1.view.appendTo(colType);

    var q = taskMeetingParam(task);
    loadLocation(q.location);
*/

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
    connectCalendar(tzList, profs, ta);

    task.onSchedulingStepChanging.observe("step", function() {
      api.postTask(ta);
    });
  };

  return mod;
}());
