/*
  Scheduling step 2
*/

var sched2 = (function() {
  var mod = {};

  function saveAndReload(ta) {
    log("saveAndReload", ta);
    disableNextButton();
    api.postTask(ta)
      .done(function(task) { sched.loadTask(task); });
  }

  var step2Selector = show.create({
    "sched-step2-connect": {ids: ["sched-step2-connect"]},
    "sched-step2-prefs": {ids: ["sched-step2-prefs"]}
  });

  function moveOnToNextStep(ta) {
    var x = ta.task_data[1];
    ta.task_status.task_progress = "Coordinating"; // status in the task list
    x.scheduling_stage = "Coordinate"; // step in the scheduling page

    /* Cancel whatever was previously reserved */
    delete x.reserved;

    saveAndReload(ta);
  }

  function enableNextButton() {
    $(".sched-step2-next")
      .removeClass("disabled");
  }

  function disableNextButton() {
    $(".sched-step2-next")
      .addClass("disabled");
  }

  function initNextButton(ta) {
    var nextButton = $(".sched-step2-next")
      .off("click")
      .one("click", function() {
        moveOnToNextStep(ta);
      });
    var schedState = sched.getState(ta);
    var options = schedState.calendar_options;
    if (util.isDefined(options) && options.length > 0)
      enableNextButton();
    else
      disableNextButton(); /* should be disabled already anyway */
  }

  /*
    For now just a dropdown menu of meeting types.
    May be accompanied with options specific to the type of meeting selected.
  */
  function createMeetingTypeSelector(onSet, optInitialKey) {
    function opt(label, value) {
      return { label: label, value: value, action: onSet };
    }
    var initialKey = util.isString(optInitialKey) ? optInitialKey : "Meeting";
    var meetingTypeSelector = select.create({
      divClass: "fill-div",
      buttonClass: "fill-div",
      initialKey: initialKey,
      options: [
        opt("Meeting", "Meeting"),
        opt("Breakfast", "Breakfast"),
        opt("Lunch", "Lunch"),
        opt("Dinner", "Dinner"),
        opt("Coffee", "Coffee"),
        opt("Night life", "Nightlife"),
        opt("Phone call", "Call")
      ]
    });
    return meetingTypeSelector;
  }

  /*
    Create a view and everything needed to display and edit location
    and time for a meeting option.
  */
  function editableViewOfOption(tzList, calOption, saveCalOption) {
'''
<div #view>
  <div #adder/>
  <div #form/>
  <div class="row clearfix">
    <div class="col-sm-3">
      <div class="location-title">Meeting Type</div>
      <div #meetingTypeContainer/>
    </div>
    <div class="col-sm-9"/>
  </div>
  <div #locationContainer/>
  <div #calendarContainer/>
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
    meetingTypeSelector.set(x.meeting_type);

    /*** Meeting date and time, shown only once a timezone is set ***/

    var getDates = function() { return null; };
    var renderCalendar = function() {};
    var clearDates = function() {};

    function updateCalendar(timezone) {
      calendarContainer.children().remove();

      if (util.isNonEmptyString(timezone)) {
        var picker = calpicker.createPicker({
          timezone: timezone,
          onChange: (function() { updateSaveButton(); })
        });
        getDates = picker.getDates;
        calendarContainer
          .append(picker.view);

        if (util.isDefined(x.start) && util.isDefined(x.end))
          picker.setDates(x);

        picker.render();
          /* needs to be done once calendar becomes visible */

        renderCalendar = picker.render;
        clearDates = picker.clearDates;
      }
    }

    /*** Meeting location ***/

    var loc = x.location;
    function onTimeZoneChange(oldTimezone, newTimezone) {
      log("timezone change: " + oldTimezone + " -> " + newTimezone);
      updateCalendar(newTimezone);
      if (util.isNonEmptyString(oldTimezone)
          && util.isNonEmptyString(newTimezone))
        clearDates();
    }
    var locationForm = locpicker.create({
      onTimezoneChange: onTimeZoneChange
    });
    if (util.isDefined(loc)) {
      locationForm.setLocation(loc);
    }
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

    function updateSaveButton() {
      if (calOptionIsReady())
        saveButton.removeClass("disabled");
      else
        saveButton.addClass("disabled");
    }

    function saveMe() {
      saveButton.addClass("disabled");
      saveCalOption(getCalOption());
    }

    saveButton.click(saveMe);
    updateSaveButton();

    return {
      view: view,
      renderCalendar: renderCalendar
    };
  }

  function createMeetingOption(tzList, saveCalOption) {
    var calOption = {
      label: util.randomString(),
      slot: {}
    };
    return editableViewOfOption(tzList, calOption, saveCalOption);
  }

  function insertViewOfOption(tzList, listView, calOption,
                              saveCalOption, removeCalOption) {
'''
<div #view>
  <div #readOnlyContainer/>
  <div #editableContainer
       class="hide"/>
  <button #removeButton class="btn btn-default">Remove</button>
</div>
'''
    var row = listView.createRow(view);
    removeButton
      .click(function () {
        row.remove();
        removeCalOption(calOption.label);
      });

    /* Load calendar and forms when user clicks "Edit" */
    function switchToEdit() {
      var edit =
        editableViewOfOption(tzList, calOption, saveCalOption);
      editableContainer.append(edit.view);

      readOnlyContainer.addClass("hide");
      editableContainer.removeClass("hide");

      edit.renderCalendar();
    }

    var readOnlyView =
      readOnlyViewOfOption(calOption, switchToEdit);
    readOnlyContainer.append(readOnlyView);

    return view;
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

  function readOnlyViewOfOption(calOption, switchToEdit) {
'''
<div #view
   class="suggestion">
  {{sched.viewOfSuggestion(calOption.slot)}}
  <button #editButton
          class="btn btn-default">
    Edit
  </button>
</div>
'''
    editButton.click(switchToEdit);
    return view;
  }

  function loadMeetingOptions(tzList, ta) {
    var view = $("#sched-step2-option-list");
    view.children().remove();

    function save(calOption) { return saveOption(ta, calOption); }
    function remove(calOption) { return removeOption(ta, calOption); }

    function createAdderForm() {
      return createMeetingOption(tzList, save).view;
    }

    var schedState = sched.getState(ta);
    var listView = adder.createList({
      maxLength: 3,
      createAdderForm: createAdderForm,
      onAdderOpen: disableNextButton /* reenabled when the page is reloaded */
    });
    view.append(listView.view);
    list.iter(schedState.calendar_options, function(x) {
      insertViewOfOption(tzList, listView, x, save, remove);
    });

    initNextButton(ta);

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
