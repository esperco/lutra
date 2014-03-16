/*
  Scheduling step 2
*/

var sched2 = (function() {
  var mod = {};

  function saveAndReload(ta) {
    disableNextButton();
    api.postTask(ta)
      .done(function(task) { sched.loadTask(task); });
  }

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

  function toggleShow(showHide, header, content, connector) {
    if (content.hasClass("hide")) {
      showHide.text("Hide");
      header.removeClass("collapsed");
      content.removeClass("hide");
      if (connector != null) {
        connector.removeClass("collapsed");
      }
    } else {
      showHide.text("Show");
      header.addClass("collapsed");
      content.addClass("hide");
      if (connector != null) {
        connector.addClass("collapsed");
      }
    }
  }

  function createSelectionSection() {
    var view = $("<div/>");
    var module = $("<div class='sched-module'/>")
      .appendTo(view);

    var header = $("<div class='sched-module-header collapsed'/>")
      .appendTo(module);
    var showHide = $("<span class='show-hide link'/>")
      .text("Show")
      .appendTo(header);
    var selectionIcon = $("<img class='sched-module-icon'/>")
      .appendTo(header);
    svg.loadImg(selectionIcon, "/assets/img/star.svg");
    var headerText = $("<div class='sched-module-title'/>")
      .text("Select the preferred meeting option")
      .appendTo(header);

    var content = $("<div class='hide'/>")
      .appendTo(module);

    showHide.click(function() {
      toggleShow(showHide, header, content);
    })

    return view;
  }

  function createOfferSection() {
    var view = $("<div/>");
    var module = $("<div class='sched-module'/>")
      .appendTo(view);
    var connector = createConnector().addClass("collapsed")
      .appendTo(view);

    var header = $("<div class='sched-module-header collapsed'/>")
      .appendTo(module);
    var showHide = $("<span class='show-hide link'/>")
      .text("Show")
      .appendTo(header);
    var offerIcon = $("<img id='offer-icon' class='sched-module-icon'/>")
      .appendTo(header);
    svg.loadImg(offerIcon, "/assets/img/email.svg");
    var headerText = $("<div class='sched-module-title'/>")
      .text("Offer to guests")
      .appendTo(header);

    var content = $("<div class='hide'/>")
      .appendTo(module);

    showHide.click(function() {
      toggleShow(showHide, header, content, connector);
    })

    return view;
  }

  function createApprovalSection() {
    var view = $("<div/>");
    var module = $("<div class='sched-module'/>")
      .appendTo(view);
    var connector = createConnector().addClass("collapsed")
      .appendTo(view);

    var header = $("<div class='sched-module-header collapsed'/>")
      .appendTo(module);
    var showHide = $("<span class='show-hide link'/>")
      .text("Show")
      .appendTo(header);
    var calendarIcon = $("<img class='sched-module-icon'/>")
      .appendTo(header);
    svg.loadImg(calendarIcon, "/assets/img/calendar.svg");
    var headerText = $("<div class='sched-module-title'/>")
      .text("Request approval (Optional)")
      .appendTo(header);

    var content = $("<div class='hide'/>")
      .appendTo(module);

    showHide.click(function() {
      toggleShow(showHide, header, content, connector);
    })

    return view;
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
        opt("Custom...", "Custom"),
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
    If the meeting type does not require a location, the timezone can
    be changed by clicking on it, prompting the using for a location.
    Otherwise the timezone is the determined by the location of the meeting.
   */
  function setupTimezoneLink(form, slot) {
    function displayTimezone(loc) {
      log("displayTimezone", loc);
      if (util.isDefined(loc))
        timezoneText.text("Time Zone: " + timezone.format(loc.timezone));
    }
    function setTimezone(oldTz, newTz) {
      var loc = { timezone: newTz };
      slot.location = loc;
      displayTimezone(loc);
    }
    var timezoneText = form.timezoneText;
    var timezonePicker = form.timezonePicker;
    switch (slot.meeting_type) {
    case "Call":
      timezoneText
        .tooltip("destroy")
        .tooltip({
          title:
          "Click to change the time zone"
        })
        .off("click")
        .click(function() {
          var picker = tzpicker.create({
            onTimezoneChange: setTimezone
          });
          timezonePicker.children().remove();
          timezonePicker.append(picker.view);
        })
        .addClass("clickable");
      form.addPublicNotes
        .text("Specify phone number and notes");
      break;

    default:
      timezoneText
        .removeClass("clickable")
        .tooltip("destroy")
        .tooltip({
          title:
          "The time zone is automatically set based on the meeting location"
        })
        .off("click");
      form.addPublicNotes
        .text("Add notes");
    }
    displayTimezone(slot.location);
  }

  function adaptToMeetingType(form, slot) {
    setupTimezoneLink(form, slot);
    switch (slot.meeting_type) {
    case "Call":
      form.whereSection.addClass("hide");
      break;
    default:
      form.whereSection.removeClass("hide");
    }
  }

  /* Create modal containing date/time picker based on the
     user's calendar.

     Input parameters are the same as for calpicker.create.
  */
  function createCalendarModal(param) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog"
     aria-hidden="true">
  <div #dialog
       class="modal-dialog cal-picker-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <img #icon
             class="svg cal-icon" src="/assets/img/calendar.svg"/>
        <div style="float:right" data-dismiss="modal">
          <img class="svg modal-close" src="/assets/img/x.svg"/>
        </div>
        <h3 #title
            class="modal-title">
          Select a time.
        </h3>
        <button #doneButton
                class="btn btn-default">Done</button>
      </div>
      <div #body
           class="modal-body"></div>
    </div>
  </div>
</div>
'''
    var id = util.randomString();
    title.attr("id", id);
    modal.attr("aria-labelledby", id);

    var cal = calpicker.create(param);
    _view.cal = cal;
    _view.body.append(cal.view);

    return _view;
  }


  /*
    Create a view and everything needed to display and edit location
    and time for a meeting option.
  */
  function editableViewOfOption(tzList, profs, calOption, saveCalOption, cancel, addMode) {
'''
<div #view
     class="edit-option-row">
  <div #form
       class="option-info clearfix">
    <div class="edit-info-row">
      <div class="info-label what-label-edit">WHAT</div>
      <div class="info">
        <div #meetingTypeContainer/>
      </div>
    </div>
    <div class="edit-info-row">
      <div class="info-label when-label-edit">WHEN</div>
      <div class="info">
        <div class="clearfix">
          <div #dateAndTimes
               class="hide">
            <div class="some-datepicker">
              <input #startDate
                     type="text"
                     class="form-control date-picker-field start"/>
            </div>
            <div class="bootstrap-timepicker">
              <input #startTime
                     type="text"
                     class="form-control time-picker-field start"/>
            </div>
            <div class="time-input-row-end">
              <span class="time-to-text">to</span>
              <div class="bootstrap-timepicker">
                <input #endTime
                       type="text"
                       class="form-control time-picker-field end"/>
              </div>
              <div class="some-datepicker">
                <input #endDate
                       type="text"
                       class="form-control date-picker-field end"/>
              </div>
            </div>
          </div>
          <span #timezoneText class="timezone-text"></span>
          <div #timezonePicker/>
        </div>
        <span #openCalPicker
             class="open-cal-picker clearfix">
          <img class="open-cal-picker-icon svg"
               src="/assets/img/cal-picker.svg"/>
          <span class="open-cal-picker-text link">
            Select time in calendar
          </span>
        </span>
        <div #calPickerContainer/>
      </div>
    </div>
    <div #whereSection
         class="edit-info-row">
      <div class="info-label where-label-edit">WHERE</div>
      <div #locationContainer
           class="info"/>
    </div>
    <div class="edit-info-row">
      <div class="info-label notes-label-edit">NOTES</div>
      <div class="info">
        <span #addPublicNotes
              class="add-public-notes link">Add notes</span>
        <div #notes class="hide">
          <div #notesEditorPublic
               class="notes-editor-public">
            <textarea #notesBoxPublic
                      class="notes-entry"></textarea>
            <div class="viewable-by-label">
              <img class="viewable-by-eye svg"
                   src="/assets/img/eye.svg"/>
              <span class="viewable-by-text">ALL GUESTS</span>
            </div>
          </div>
          <span #addPrivateNotes
                class="add-private-notes link"/>
          <div #notesEditorPrivate
               class="notes-editor-private">
            <textarea #notesBoxPrivate
                      class="notes-entry"></textarea>
            <div class="viewable-by-label">
              <img class="viewable-by-eye svg"
                   src="/assets/img/eye.svg"/>
              <span #viewableByExec
                    class="viewable-by-text"/>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div #editActions
         class="edit-option-actions clearfix">
      <button #saveButton
              class="btn btn-primary save-to-cal disabled"/>
    </div>
  </div>
</div>
'''

    var x = calOption.slot;

    /*** Meeting type ***/

    if (! util.isNonEmptyString(x.meeting_type))
      x.meeting_type = "Meeting";

    function setMeetingType(meetingType) {
      x.meeting_type = meetingType;
      adaptToMeetingType(_view, x);
    }

    function getMeetingType() {
      return x.meeting_type;
    }

    var meetingTypeSelector = createMeetingTypeSelector(setMeetingType);
    meetingTypeContainer.append(meetingTypeSelector.view);
    meetingTypeSelector.set(x.meeting_type);

    /*** Meeting date and time, shown only once a timezone is set ***/

    var dates;
    function setDates(optDates) {
      log("sched2 setDates", optDates);
      /* TODO: render dates if defined */
      dates = optDates;
    }

    var displayDates = function() {
      log("TODO: displayDates");
      dateAndTimes.removeClass("hide");
    };
    var hideDates = function() {
      log("TODO: hideDates");
      dateAndTimes.addClass("hide");
    };

    function openCal() {
      var calModal = createCalendarModal({
        timezone: x.location.timezone,
        onChange: setDates
      });
      calPickerContainer.children().remove();
      calPickerContainer.append(calModal.modal);
      calModal.modal.modal({});
      calModal.modal
        .on("shown.bs.modal", function() {
          calModal.cal.render(); // can't happen earlier or calendar won't show
        });
      calModal.doneButton
        .click(function() {
          log("TODO: save dates");
          calModal.modal.modal("hide");
        });
    }
    openCalPicker.click(openCal);

    /*** Meeting location ***/

    var loc = x.location;
    function onTimezoneChange(oldTimezone, newTimezone) {
      log("new timezone: " + newTimezone);
      setupTimezoneLink(_view, x);
      if (util.isNonEmptyString(oldTimezone)
          && util.isNonEmptyString(newTimezone))
        displayDates();
    }
    var locationForm = locpicker.create({
      onTimezoneChange: onTimezoneChange
    });
    if (util.isDefined(loc))
      locationForm.setLocation(loc);
    else {
      var tz = timezone.guessUserTimezone();
      loc = { timezone: tz };
      x.location = loc;
      onTimezoneChange(undefined, tz);
    };

    locationContainer.append(locationForm.view);

    /*** Meeting notes ***/

    var hostName = profile.firstName(profs[login.leader()].prof);
    viewableByExec.text(hostName.toUpperCase() + " ONLY");

    addPublicNotes
      .click(function() {
        addPublicNotes.addClass("hide");
        notes.removeClass("hide");
        notesBoxPublic.focus();
      });
    addPrivateNotes
      .text("Add private notes for " + hostName + " only")
      .click(function() {
        addPrivateNotes.addClass("hide");
        notesEditorPrivate.removeClass("hide");
        notesBoxPrivate.focus();
      });
    if (notesBoxPrivate.val() === "") {
      notesEditorPrivate.addClass("hide");
    } else {
      addPrivateNotes.addClass("hide");
    }

    /*** Row controls (save/remove) ***/

    function getCalOption() {
      var meetingType = getMeetingType();
      var loc = locationForm.getCompleteLocation();
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

    if (addMode) {
      saveButton.text("Add to calendar");
    } else {
      saveButton.text("Update calendar");
    }
    saveButton.click(saveMe);
    updateSaveButton();

    editActions.append(cancel);

    return {
      view: view
    };
  }

  function createMeetingOption(tzList, profs, saveCalOption, cancel, addMode) {
    var calOption = {
      label: util.randomString(),
      slot: {}
    };
    return editableViewOfOption(tzList, profs, calOption,
                                saveCalOption, cancel, addMode);
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

  function readOnlyViewOfOption(calOption, typ, toggleEdit, remove) {
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
        <li #editOption>
          <a class="edit-option-details">Edit option</a>
        </li>
        <li #duplicateOption>
          <a class="duplicate-option">Duplicate option</a>
        </li>
        <li #removeOption>
          <a class="remove-option">Remove option</a>
        </li>
      </ul>
  </div>
  {{sched.viewOfOption(calOption, typ, false)}}
</div>
'''
    edit.click(toggleEdit);
    editOption.click(toggleEdit);
    removeOption.click(remove);

    return view;
  }

  function insertViewOfOption(ta, tzList, profs, listView, calOption,
                              i, saveCalOption, removeCalOption) {
'''
<div #view>
  <div #optionLetter
       class="option-letter">
    <span #letter/>
    <img #plus
         class="plus-option svg hide"
         src="/assets/img/plus.svg"/>
  </div>
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
    function toggleEdit() {
      if (readOnlyContainer.hasClass("hide")) {
        readOnlyContainer.removeClass("hide");
        editableContainer.addClass("hide");
        optionLetter.removeClass("cancel")
                    .off("click");
        letter.removeClass("hide");
        plus.removeClass("cancel")
            .addClass("hide");
      } else {
        var cancel = $("<span class='cancel-edit-mode link'/>")
          .text("Cancel")
          .click(toggleEdit);
        var addMode = false;
        var edit =
          editableViewOfOption(tzList, profs, calOption,
                               saveCalOption, cancel, addMode);
        editableContainer.children().remove();
        editableContainer.append(edit.view);

        readOnlyContainer.addClass("hide");
        editableContainer.removeClass("hide");

        optionLetter.addClass("cancel")
                    .click(removeOption);
        letter.addClass("hide");
        plus.removeClass("hide return-to-add")
            .addClass("cancel");
      }

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
    letter.text(indexLabel(i));

    var typ = sched.meetingType(sched.getState(ta));
    readOnlyContainer.append(readOnlyViewOfOption(calOption, typ,
                                                  toggleEdit, removeOption));

    return view;
  }

  function loadMeetingOptions(v, tzList, profs, ta, connector) {
    function save(calOption) { return saveOption(ta, calOption); }
    function remove(calOption) { return removeOption(ta, calOption); }

    function createAdderForm(cancelAdd) {
      var addMode = true;
      return createMeetingOption(tzList, profs, save, cancelAdd, addMode).view
               .addClass("add-row");
    }

    var schedState = sched.getState(ta);
    var listView = adder.createList({
      maxLength: 3,
      createAdderForm: createAdderForm,
      onAdderOpen: disableNextButton /* reenabled when the page is reloaded */
    });
    var numOptions = 0;
    list.iter(schedState.calendar_options, function(x, i) {
      v.append(insertViewOfOption(ta, tzList, profs, listView,
                                  x, i, save, remove));
      numOptions++;
    });
    var addRow = listView.view
      .appendTo(v);
    addRow.hover(function() {
      if (addRow.hasClass("click-mode")) {
        connector.addClass("collapsed");
      } else {
        connector.removeClass("collapsed");
      }
    },function() {
      if (addRow.hasClass("click-mode"))
        connector.removeClass("collapsed");
    })
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
    var module = $("<div class='sched-module'/>")
      .appendTo(view);
    var connector = createConnector()
      .appendTo(view);

    var header = $("<div class='sched-module-header'/>")
      .appendTo(module);
    var showHide = $("<span class='show-hide link'/>")
      .text("Hide")
      .appendTo(header);
    var optionsIcon = $("<img class='sched-module-icon'/>")
      .appendTo(header);
    svg.loadImg(optionsIcon, "/assets/img/create-options.svg");
    var headerText = $("<div class='sched-module-title'/>")
      .text("Create up to 3 meeting options")
      .appendTo(header);

    var content = $("<div id='options-content'/>")
      .appendTo(module);

    var leaderUid = login.leader();
    if (! list.mem(ta.task_participants.organized_for, leaderUid)) {
      deferred.defer(loadMeetingOptions(content, tzList, profs, ta, connector));
    }
    else {
      var authLandingUrl = document.URL;
      api.getCalendarInfo(leaderUid, authLandingUrl)
        .then(function(calInfo) {
          if (!calInfo.has_calendar)
            promptForCalendar(profs[leaderUid], calInfo);
          else
            loadMeetingOptions(content, tzList, profs, ta, connector);
        });
    }

    showHide.click(function() {
      toggleShow(showHide, header, content, connector);
    })

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
      .append(createOptionsSection(tzList, profs, ta))
      // .append(createApprovalSection())
      .append(createOfferSection())
      .append(createSelectionSection());

    observable.onSchedulingStepChanging.observe("step", function() {
      api.postTask(ta);
    });
  };

  return mod;
}());
