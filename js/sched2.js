/*
  Scheduling step 2
*/

var sched2 = (function() {
  var mod = {};

  function saveAndReload(ta) {
    api.postTask(ta)
      .done(function(task) { sched.loadTask(task); });
  }

  var step2Selector = show.create({
    "sched-step2-connect": {ids: ["sched-step2-connect"]},
    "sched-step2-prefs": {ids: ["sched-step2-prefs"]}
  });

  /* Record the options for the meeting selected by the user
     and move on to step 3. */
  function selectCalendarSlots(ta, slots) {
    var x = ta.task_data[1];
    ta.task_status.task_progress = "Coordinating"; // status in the task list
    x.scheduling_stage = "Coordinate"; // step in the scheduling page

    /* Cancel whatever was previously reserved */
    delete x.reserved;

    saveAndReload(ta);
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
  */
  function loadMeetingOption(tzList, listView, calOption,
                             saveCalOption, removeCalOption, isListRow) {
'''
<div #view>
  <div #adder/>
  <div #form/>
  <div class="clearfix">
    <div class="col-sm-3">
      <div class="location-title">Meeting Type</div>
      <div #meetingTypeContainer/>
    </div>
    <div class="col-sm-9"/>
  </div>
  <div #locationContainer/>
  <div #calendarContainer/>
  <button #removeButton class="btn btn-default">Remove</button>
  <button #saveButton class="btn btn-primary disabled">Save</button>
</div>
'''
    var x = calOption.slot;

    /*** Meeting type ***/

    if (! util.isNonEmptyString(x.meeting_type))
      x.meeting_type = "Meeting";

    function setMeetingType(meetingType) {
      x.meeting_type = meetingType;
    }

    function getMeetingType() {
      return x.meeting_type;
    }

    var meetingTypeSelector = createMeetingTypeSelector(setMeetingType);
    meetingTypeContainer.append(meetingTypeSelector.view);

    /*** Meeting date and time, shown only once a timezone is set ***/

    var getDates = function() { return null; };

    function updateCalendar(timezone) {
      calendarContainer.children().remove();

      if (util.isNonEmptyString(timezone)) {
        var picker = calpicker.createPicker({
          timezone: timezone,
          onChange: (function() { onChange(); })
        });
        getDates = picker.getDates;
        calendarContainer
          .append(picker.view);
        picker.render();
      }
    }

    /*** Meeting location ***/

    var loc = x.location;
    if (util.isDefined(loc)) {
      var timezone = loc.timezone;
      if (util.isNonEmptyString(timezone))
        updateCalendar(timezone);
    }
    var locationForm = locpicker.create({
      onTimezoneChange: updateCalendar
    });
    locationContainer.append(locationForm.view);

    /*** Row controls (save/remove) ***/

    function getCalOption() {
      var meetingType = getMeetingType();
      var loc = locationForm.getCompleteLocation();
      var dates = getDates();
      if (util.isNotNull(meetingType)
          && util.isNotNull(loc)
          && util.isNotNull(dates)) {
        var oldCalOption = calOption;
        var calSlot = {
          meeting_type: meetingType,
          location: loc,
          on_site: true,
          start: dates.start,
          end: dates.end,
          duration: dates.duration
        };
        var newCalOption = {
          label: oldCalOption.label,
          slot: calSlot,
          google_event: oldCalOption.google_event
        };
        return newCalOption;
      }
      else
        return null;
    }

    function calOptionIsReady() {
      return util.isNotNull(getCalOption());
    }

    function onChange() {
      if (calOptionIsReady())
        saveButton.removeClass("disabled");
      else
        saveButton.addClass("disabled");
    }

    function saveMe() {
      saveButton.addClass("disabled");
      saveCalOption(getCalOption());
    }

    if (isListRow) {
      var row = listView.createRow(view);
      removeButton
        .click(function () {
          row.remove();
          removeCalOption(calOption.label);
        });

      saveButton.click(saveMe);
    }
    else {
      removeButton.remove(); /* don't need a Remove button */
      saveButton.click(saveMe);
    }

    return(view);
  }

  function createMeetingOption(tzList, listView,
                               onSave, onRemove, isListRow) {
    var calOption = {
      label: util.randomString(),
      slot: {}
    };
    return loadMeetingOption(tzList, listView, calOption, onSave, onRemove);
  }

  function saveOption(ta, calOption) {
    var schedState = sched.getState(ta);
    var label = calOption.label;
    var options = schedState.calendar_options;
    if (list.exists(options, function(x) { return x.label === label; })) {
      schedState.calendar_options =
        list.replace(options, calOption, function(x) {
          return x.label === label;
        });
    }
    else
      options.push(calOption);
    saveAndReload(ta);
  }

  function removeOption(ta, calOptionLabel) {
    var schedState = sched.getState(ta);
    schedState.calendar_options =
      list.filter(schedState.calendar_options, function(x) {
        return x.label !== calOptionLabel;
      });
    saveAndReload(ta);
  }

  function loadMeetingOptions(tzList, ta) {
    var view = $("#sched-step2-option-list");
    view.children().remove();

    function save(calOption) { return saveOption(ta, calOption); }
    function remove(calOption) { return removeOption(ta, calOption); }

    function createAdderForm() {
      return createMeetingOption(tzList, listView, save, remove, false);
    }

    var schedState = sched.getState(ta);
    var listView = adder.createList({
      maxLength: 3,
      createAdderForm: createAdderForm
    });
    view.append(listView.view);
    list.iter(schedState.calendar_options, function(x) {
      loadMeetingOption(tzList, listView, x, save, remove, true);
    });

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

  function connectCalendar(tzList, profs, ta) {
    var leaderUid = login.leader();
    var result;
    if (! list.mem(ta.task_participants.organized_for, leaderUid)) {
      result = deferred.defer(loadMeetingOptions(tzList, ta));
    }
    else {
      var authLandingUrl = document.URL;
      result = api.getCalendarInfo(leaderUid, authLandingUrl)
        .then(function(calInfo) {
          if (!calInfo.has_calendar)
            promptForCalendar(profs[leaderUid], calInfo);
          else
            loadMeetingOptions(tzList, ta);
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
