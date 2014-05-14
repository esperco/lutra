/*
  Create a view and everything needed to display and edit location
  and time for a meeting option.
*/

var editevent = (function() {
  var mod = {};

  /* Create modal containing date/time picker based on the
     user's calendar.

     Input parameters are the same as for calpicker.create.
  */
  function createCalendarModal(param) {
'''
<div #view
     class="modal fade"
     tabindex="-1"
     role="dialog"
     aria-hidden="true">
  <div class="modal-header calendar-modal-header">
    <div #iconContainer
         class="modal-icon cal-picker-modal-icon"/>
    <button #doneButton
            class="btn btn-primary"
            style="float:right">
      Done
    </button>
    <div #title
        class="modal-title">
      Click on the calendar to select a time.
    </div>
  </div>
  <div #content/>
</div>
'''
    var icon = $("<img class='svg-block'/>")
      .appendTo(iconContainer);
    svg.loadImg(icon, "/assets/img/calendar.svg");

    var id = util.randomString();
    title.attr("id", id);
    view.attr("aria-labelledby", id);

    var cal = calpicker.create(param);
    _view.cal = cal;
    _view.content.append(cal.view);
    _view.focus = cal.focus;

    return _view;
  }

  function next9AM(tz) {
    var nowUTC = date.ofString(date.now());
    type.set("date", nowUTC);
    var nowLocal = date.localOfUtc(tz, nowUTC);
    type.set("localdate", nowLocal);

    var today9AM = new Date(nowLocal.getTime());
    type.set("localdate", today9AM);
    // This is in local time but represented as UTC so we have to setUTCHours
    today9AM.setUTCHours(9, 0, 0, 0);

    if (nowLocal.getTime() < today9AM.getTime()) {
      return today9AM;
    } else {
      var oneDay = 86400000; // milliseconds
      var tomorrow9AM = date.ofString(today9AM.getTime() + oneDay);
      type.set("localdate", tomorrow9AM);
      return tomorrow9AM;
    }
  }

  /*
    If the meeting type does not require a location, the timezone can
    be changed by clicking on it, prompting the user for a location.
    Otherwise the timezone is determined by the location of the meeting.
   */
  function setupTimezoneLink(form, locationForm, slot) {
    function displayTimezone(slot) {
      var tz = sched.getTimezone(slot);
      if (util.isDefined(tz))
        timezoneText.text(timezone.format(tz));
    }
    function setTimezone(oldTz, newTz) {
      slot.timezone = newTz;
      var oldLoc = slot.location;
      if (! util.isDefined(oldLoc)) {
        var loc = { timezone: newTz };
        slot.location = loc;
        locationForm.setLocation(loc);
      }
      displayTimezone(slot);
    }
    var timezoneText = form.timezoneText;
    form.addPublicNotes
      .text("Add notes");
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
      });
    displayTimezone(slot);
    if (util.isDefined(locationForm))
      locationForm.setLocationNoCallback(slot.location);
  }

  function adaptToMeetingType(form, locationForm, slot) {
    setupTimezoneLink(form, locationForm, slot);
    if (sched.showLocation(slot.meeting_type))
      form.whereSection.removeClass("hide");
    else
      form.whereSection.addClass("hide");
    if (slot.meeting_type === "Call")
      form.callerSection.removeClass("hide");
    else
      form.callerSection.addClass("hide");
  }

  /*
    For now just a dropdown menu of meeting types.
    May be accompanied with options specific to the type of meeting selected.
  */
  function createMeetingTypeSelector(onSet, customBox, saveButton) {
    function showCustom() {
      customBox
        .val("")
        .removeClass("hide")
        .focus();
      saveButton.addClass("disabled");
    }
    function hideCustom() {
      customBox.addClass("hide");
    }
    function onSelect(value) {
      if (value === "Custom")
        showCustom();
      else {
        hideCustom();
        onSet(value);
      }
    }

    util.afterTyping(customBox, 500, function() {
      onSet(customBox.val());
    });

    function opt(label, value) {
      return { label: label, value: value, action: onSelect };
    }
    var meetingTypeSelector = select.create({
      initialKey: "Meeting",
      options: [
        opt("Breakfast", "Breakfast"),
        opt("Call", "Call"),
        opt("Coffee", "Coffee"),
        opt("Dinner", "Dinner"),
        opt("Drinks", "Drinks"),
        opt("Lunch", "Lunch"),
        opt("Meeting", "Meeting"),
        opt("Custom...", "Custom")
      ]
    });
    /* override default get() to read from the [possibly hidden] input box */
    meetingTypeSelector.get = function() { return customBox.val(); };

    return meetingTypeSelector;
  }

  function createCallerDropdown(ta, profs, slot) {
    var currentCaller = slot.caller;
    var attendees = sched.getAttendingGuests(ta);
    attendees.unshift(login.leader());
    var options = list.map(attendees, function(uid) {
      var prof = profs[uid].prof;
      var name = profile.fullNameOrEmail(prof);
      var phone = profile.phone(prof);
      return { label: name + " : " + phone, value: uid };
    });
    return select.create({
      initialKey: currentCaller,
      options: options
    });
  }

  mod.create = function(ta, profs, calOption, saveCalOption, cancel, addMode) {
'''
<div #view
     class="edit-option-row">
  <div #form
       class="option-info clearfix">
    <div class="edit-info-row">
      <div class="info-label what-label-edit">WHAT</div>
      <div class="info">
        <div #meetingTypeContainer/>
        <input #meetingTypeInput
               type="text"
               class="hide form-control custom-type-input"/>
      </div>
    </div>
    <div #callerSection
         class="edit-info-row hide">
      <div class="info-label caller-label-edit">CALLER</div>
      <div #callerDropdownContainer class="info"></div>
    </div>
    <div class="edit-info-row">
      <div class="info-label when-label-edit">WHEN</div>
      <div class="info">
        <div class="clearfix">
          <div #dateAndTimes/>
          <span #timezoneText class="timezone-link link"></span>
        </div>
        <span #openCalPicker
             class="open-cal-picker clearfix">
          <img class="open-cal-picker-icon svg-block"
               src="/assets/img/cal-picker.svg"/>
          <span #calendarLinkText
                class="open-cal-picker-text link">
            Adjust time in calendar
          </span>
        </span>
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
        <div #allNotes class="hide">
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
      <span #missingPhones
            class="hide">Missing a phone number</span>
      <button #saveButton
              class="btn btn-primary save-to-cal disabled"/>
    </div>
  </div>
</div>
'''

    var locationForm; /* defined later because of a circular dependency */

    var x = calOption.slot;

    /*** Meeting type ***/

    if (! util.isNonEmptyString(x.meeting_type))
      x.meeting_type = "Meeting";

    function setMeetingType(meetingType) {
      x.meeting_type = meetingType;
      adaptToMeetingType(_view, locationForm, x);
      updateSaveButton();
    }

    function getMeetingType() {
      return x.meeting_type;
    }

    var meetingTypeSelector =
      createMeetingTypeSelector(setMeetingType, meetingTypeInput, saveButton);
    meetingTypeContainer.append(meetingTypeSelector.view);
    meetingTypeSelector.set(x.meeting_type);

    var callerDropdown = createCallerDropdown(ta, profs, x);
    callerDropdownContainer.append(callerDropdown.view);

    /*** Meeting date and time, shown only once a timezone is set ***/

    var inlineDatesPicker = calpicker.create({
      withDatePicker: true,
      withCalendarPicker: false
    });

    function getDates() {
      return inlineDatesPicker.getDates();
    }

    function setDates(optDates) {
      inlineDatesPicker.setDates(optDates);
    }

    dateAndTimes.append(inlineDatesPicker.view);

    inlineDatesPicker.watchDates(function(newDates) {
      updateSaveButton();
    }, "saveButton");

    if (util.isNotNull(x.start) && util.isNotNull(x.end)) {
      inlineDatesPicker.setDates({
        start: date.ofString(x.start),
        end: date.ofString(x.end)
      });
    } else {
      var oneHour = 3600000; // milliseconds
      var nine = next9AM(timezone.guessUserTimezone());
      type.check("localdate", nine);
      var ten = date.ofString(nine.getTime() + oneHour);
      inlineDatesPicker.setDates({
        start: nine,
        end: ten
      });
    }

    function openCal() {
      mp.track("Set time in calendar");
      var dates = getDates();
      var defaultDate;
      if (util.isNotNull(dates))
        defaultDate = date.toString(dates.start);
      var calModal = createCalendarModal({
        timezone: sched.getTimezone(x),
        defaultDate: defaultDate,
        withDatePicker: false,
        withCalendarPicker: true
      });
      calModal.view.modal({});
      calModal.doneButton
        .click(function() {
          calModal.view.modal("hide");
          setDates(calModal.cal.getDates());
        });
      calModal.view
        .on("shown.bs.modal", function() {
          calModal.cal.render(); // can't happen earlier or calendar won't show
        });
      calModal.cal.setDates(getDates());
    }
    openCalPicker.click(openCal);

    /*** Meeting location ***/

    var loc = x.location;

    function displayTimezone() {
      setupTimezoneLink(_view, locationForm, x);
    }

    function onTimezoneChange(oldTimezone, newTimezone) {
      displayTimezone();
      updateSaveButton();
    }

    function onLocationSet(newLoc) {
      x.location = newLoc;
      if (util.isDefined(newLoc)) {
        displayTimezone();
      }
      updateSaveButton();
    }

    /* locationForm is defined earlier because we have a circular dependency */
    locationForm = locpicker.create({
      onTimezoneChange: onTimezoneChange,
      onLocationSet: onLocationSet,
      showDetails: true
    });
    if (util.isDefined(loc)) {
      locationForm.toggleForm();
      locationForm.setLocation(loc);
    } else {
      var tz = timezone.guessUserTimezone();
      loc = { timezone: tz };
      x.location = loc;
      onTimezoneChange(undefined, tz);
    };

    locationContainer.append(locationForm.view);

    /*** Meeting notes ***/

    var hostName = profile.firstName(profs[login.leader()].prof);
    viewableByExec.text(hostName.toUpperCase() + " ONLY");

    var notes = util.isDefined(x.notes) ? x.notes
      : { public_notes: "", private_notes: "" };
    notesBoxPublic.val(notes.public_notes);
    notesBoxPrivate.val(notes.private_notes);

    addPublicNotes
      .click(function() {
        mp.track("Add event notes");
        addPublicNotes.addClass("hide");
        allNotes.removeClass("hide");
        notesBoxPublic.focus();
      });
    addPrivateNotes
      .text("Add private notes for " + hostName + " only")
      .click(function() {
        addPrivateNotes.addClass("hide");
        notesEditorPrivate.removeClass("hide");
        notesBoxPrivate.focus();
      });

    if (notesBoxPublic.val() !== "" || notesBoxPrivate.val() !== "") {
      addPublicNotes.addClass("hide");
      allNotes.removeClass("hide");
    }

    if (notesBoxPrivate.val() !== "")
      addPrivateNotes.addClass("hide");
    else
      notesEditorPrivate.addClass("hide");

    /*** Row controls (save/remove) ***/

    /* Get a complete calendar_option or nothing */
    function getCalOption() {
      if (! util.isNotNull(locationForm)) return null; /* initializing */

      var meetingType = getMeetingType();
      var loc;
      var caller;
      if (meetingType === "Call") {
        loc = locationForm.getTimezoneLocation();
        caller = callerDropdown.get();
      } else {
        loc = locationForm.getCompleteLocation();
        if (loc === null) loc = locationForm.getTimezoneLocation();
      }

      if (
        !(meetingTypeInput.hasClass("hide"))
        && meetingTypeInput.val() === ""
      ) {
        return null;
      }

      var dates = getDates();
      if (util.isNotNull(meetingType)
          && util.isNotNull(loc)
          && util.isNotNull(dates)) {
        var oldCalOption = calOption;
        var notes = {
          public_notes: notesBoxPublic.val(),
          private_notes: notesBoxPrivate.val()
        };
        var calSlot = {
          meeting_type: meetingType,
          location: loc,
          on_site: true,
          timezone: x.timezone, /* optional */
          start: dates.start,
          end: dates.end,
          duration: dates.duration,
          notes: notes,
          caller: caller
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

    function hasPhone(uid) {
      var prof = profs[uid].prof;
      return util.isNotNull(prof.phones) && prof.phones.length > 0;
    }

    function calOptionIsReady() {
      return util.isNotNull(getCalOption());
    }

    function havePhonesForCall() {
      var meetingType = getMeetingType();
      var attendees = sched.getAttendingGuests(ta);
      attendees.unshift(login.leader());
      return meetingType === "Call" ?
        list.for_all(attendees, hasPhone) :
        true;
    }

    function updateSaveButton() {
      var optionReady = calOptionIsReady();
      var havePhones = havePhonesForCall();
      if (optionReady && havePhones) {
        dateAndTimes.removeClass("has-error");
        missingPhones.addClass("hide");
        saveButton.removeClass("disabled");
      } else if (optionReady && !havePhones) {
        dateAndTimes.removeClass("has-error");
        missingPhones.removeClass("hide");
        saveButton.addClass("disabled");
      } else if (!optionReady && havePhones) {
        dateAndTimes.addClass("has-error");
        missingPhones.addClass("hide");
        saveButton.addClass("disabled");
      } else {
        dateAndTimes.addClass("has-error");
        missingPhones.removeClass("hide");
        saveButton.addClass("disabled");
      }
    }

    function saveMe(action) {
      saveButton.addClass("disabled");
      var desc = locationForm.getGoogleDescription();
      var savedID = locationForm.getSavedPlaceID();
      saveCalOption(getCalOption(), action, desc, savedID);
    }

    var action;
    if (addMode) {
      saveButton.text("Add to calendar");
      action = "adding";
    } else {
      saveButton.text("Update calendar");
      action = "updating";
    }
    saveButton.click(function() {
      saveMe(action);
    })
    updateSaveButton();

    editActions.append(cancel);

    return {
      view: view
    };
  }

  return mod;
})();
