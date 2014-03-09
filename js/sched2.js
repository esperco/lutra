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

  // var step2Selector = show.create({
  //   "sched-step2-connect": {ids: ["sched-step2-connect"]},
  //   "sched-step2-prefs": {ids: ["sched-step2-prefs"]}
  // });

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
<div #view
     class="edit-option-row">
  <tr>
    <td #optionLetterCell
        class="option-letter-cell">
      <div #optionLetter
           class="option-letter"/>
    </td>
    <td #form
        class="option-info clearfix">
      <div class="info-row">
        <div class="info-label">WHAT</div>
        <div #meetingTypeContainer
             class="info"/>
      </div>
      <div class="info-row">
        <div class="info-label">WHERE</div>
        <div #locationContainer
             class="info"/>
      </div>
      <div class="info-row">
        <div class="info-label">WHEN</div>
        <span #openCalPicker
             class="info link">
          Select time in calendar
        </span>
      </div>
      <div class="edit-option-actions clearfix">
        <button #saveButton
                class="btn btn-primary save-to-cal disabled">
          Save to calendar
        </button>
        <span #cancel
              class="cancel-edit-mode link">
          Cancel
        </span>
      </div>
    </td>
  </tr>
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

    var calendarModal = $("#cal-picker-modal");
    var calendarContainer = $("#cal-picker");
    calendarContainer.children().remove();
    openCalPicker.click(function() {
      calendarModal.modal({})
    });

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

  function insertViewOfOption(ta, tzList, listView, calOption, i,
                              saveCalOption, removeCalOption) {
'''
<div #view>
  <div #readOnlyContainer/>
  <div #editableContainer
       class="hide"/>
</div>
'''
    var row = listView.createRow(view);
    function removeOption() {
      row.remove();
      removeCalOption(calOption.label);
    }

    /* Load calendar and forms when user clicks "Edit" */
    function switchToEdit() {
      var edit =
        editableViewOfOption(tzList, calOption, saveCalOption);
      editableContainer.append(edit.view);

      readOnlyContainer.addClass("hide");
      editableContainer.removeClass("hide");

      edit.renderCalendar();
    }

    function indexLabel(i) {
      var a = "A".charCodeAt(0);
      var label = "";
      do {
        label = String.fromCharCode(i % 26 + a) + label;
        i = Math.floor(i / 26);
      } while (i > 0);
      return label;
    }

    var label = indexLabel(i);
    var typ = sched.meetingType(sched.getState(ta));
    readOnlyContainer.append(readOnlyViewOfOption(calOption, label, typ,
                                                  switchToEdit, removeOption));

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

  function readOnlyViewOfOption(calOption, label, typ,
                                switchToEdit, remove) {
'''
<div #view
     class="option-row">
   <div #editButton
        class="btn-group edit-option">
      <button #edit
              type="button"
              class="btn btn-default edit-option-btn">
        Edit
      </button>
      <button type="button"
              class="btn btn-default dropdown-toggle"
              data-toggle="dropdown">
        <span class="caret"/>
        <span class="sr-only">Toggle Dropdown</span>
      </button>
      <ul class="dropdown-menu pull-right edit-option-dropdown"
          role="menu">
        <li #editOption
            class="edit-option-details">
          <a>Edit option</a>
        </li>
        <li #removeOption
            class="remove-option">
          <a>Remove option</a>
        </li>
      </ul>
  </div>
  <tr>
    <td #optionLetterCell
        class="option-letter-cell">
      <div #optionLetter
           class="option-letter"/>
    </td>
    {{sched.viewOfOption(calOption, typ, false)}}
  </tr>
</div>
'''
    optionLetter.text(label);
    edit.click(switchToEdit);
    editOption.click(switchToEdit);
    removeOption.click(remove);

    return view;
  }

  function loadMeetingOptions(v, tzList, ta) {
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
    var numOptions = 0;
    list.iter(schedState.calendar_options, function(x, i) {
      v.append(insertViewOfOption(ta, tzList, listView, x, i, save, remove));
      numOptions++;
    });
    var addRow = listView.view
      .appendTo(v);
    if (numOptions < 3) {
      addRow.removeClass("hide")
    }

    initNextButton(ta);

    return v;
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

    view.removeClass("hide");
  }

  function createOptionsSection(tzList, profs, ta) {
    var view = $("<div/>");
    var module = $("<div id='edit-meeting-div' class='sched-module'/>")
      .appendTo(view);
    var connector = createConnector()
      .appendTo(view);

    var header = $("<div class='sched-module-header'/>")
      .appendTo(module);
    var showHide = $("<span class='show-hide link'/>")
      .text("Hide")
      .appendTo(header);
    var calendarIcon = $("<img class='sched-module-icon'/>")
      .appendTo(header);
    svg.loadImg(calendarIcon, "/assets/img/calendar.svg");
    var headerText = $("<div class='sched-module-title'/>")
      .text("Create up to 3 meeting options")
      .appendTo(header);

    var content = $("<div id='options-content'/>")
      .appendTo(module);

    var leaderUid = login.leader();
    if (! list.mem(ta.task_participants.organized_for, leaderUid)) {
      deferred.defer(loadMeetingOptions(content, tzList, ta));
    }
    else {
      var authLandingUrl = document.URL;
      api.getCalendarInfo(leaderUid, authLandingUrl)
        .then(function(calInfo) {
          if (!calInfo.has_calendar)
            promptForCalendar(profs[leaderUid], calInfo);
          else
            loadMeetingOptions(content, tzList, ta);
        });
    }
    return view;
  }

  function createConnector() {
    var connectorBox = $("<div class='connector'/>");
    var connector = $("<img/>")
      .appendTo(connectorBox);
    svg.loadImg(connector, "/assets/img/connector.svg");
    return connectorBox;
  }

  mod.load = function(tzList, profs, ta, view) {
    view.children().remove();
    var guests = sched.getAttendingGuests(ta);

    view
      .append($("<h3>Find the best meeting option.</h3>"))
      .append(createOptionsSection(tzList, profs, ta));
      // .append(createApprovalSection(profs, ta))
      // .append(createOfferSection(profs, ta, guests));
      // .append(createSelectionSection(profs, ta, guests));

    // connectCalendar(tzList, profs, ta);

    observable.onSchedulingStepChanging.observe("step", function() {
      api.postTask(ta);
    });
  };

  return mod;
}());
