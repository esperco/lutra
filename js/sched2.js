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

  function disableNextButton() {
    $(".sched-step2-next")
      .addClass("disabled");
  }


  /*** SELECT ***/

  function viewOfOption(calOption) {
    var view = $("<div class='suggestion'/>")
      .attr("id", calOption.label);
    var radio = $("<img class='suggestion-radio'/>")
      .appendTo(view);
    svg.loadImg(radio, "/assets/img/radio.svg");
    sched.viewOfSuggestion(calOption.slot)
      .appendTo(view);
    return view;
  }

  function eqSlot(x, y) {
    return !x && !y
        || x && y
           && x.start === y.start
           && x.end === y.end
           && x.on_site === y.on_site
           && x.location.address === y.location.address;
  }

  /*
     Are all the attending guests available for this option?
     If so, highlight it for the EA in the schedule module.
  */
  function worksForAllGuests(guests, avails, option) {
    var worksForAll = null;

    // Make sure we're only checking availabilities of attending guests
    var guestAvails = list.filter_map(guests, function(guest) {
      return list.find(avails, function(avail) {
        return avail.participant === guest;
      });
    });

    // Set-intersect the availability choices of the attending guests
    list.iter(guestAvails, function(avail) {
      worksForAll =
        util.isNotNull(worksForAll) ?
        list.inter(avail.labels, worksForAll) :
        avail.labels;
    });

    // Does the option we're looking for remain?
    function matchingOptionLabel(x) { return x === option.label; }
    return (
      util.isNotNull(worksForAll)
      && list.exists(worksForAll, matchingOptionLabel)
    );
  }

  function viewOfOptions(task, onSelect) {
    var view = $("<div/>");
    var state = sched.getState(task);
    var options = state.calendar_options;
    var guests = sched.getAttendingGuests(task);
    var avails = state.availabilities;

    var idList = list.map(options, function(x) {
      return { k: x.label, ids: [x.label] };
    });
    var idTbl = list.toTable(idList, function(x) { return x.k; });
    var selector = show.create(idTbl, {
      onClass: "radio-selected",
      offClass: ""
    });

    list.iter(options, function(x) {
      var x_view = viewOfOption(x);
      x_view.click(function() {
          selector.show(x.label);
          onSelect(x);
        })
        .appendTo(view);

      if (state.reserved && eqSlot(x.slot, state.reserved.slot)) {
        x_view.addClass("radio-selected");
        onSelect(x);
      }
    });

    return view;
  }

  function updateTaskState(state, calOption) {
    if (calOption) {
      if (! state.reserved) {
        state.reserved = {
          /* reminders may be set later by the user */
          notifs: []
        };
      }
      state.reserved.slot = calOption.slot;
    }
  }

  function saveTask(ta, calOption) {
    updateTaskState(sched.getState(ta), calOption);
    api.postTask(ta);
  }

  function reserveCalendar(tid) {
    return api.reserveCalendar(tid, { notified: [] })
      .then(function(eventInfo) {
        return api.getTask(tid);
      });
  }

  function updateTask(ta, calOption) {
    var state = sched.getState(ta);
    ta.task_status.task_progress = "Confirmed"; // status in the task list
    state.scheduling_stage = "Confirm";         // step in the scheduling page
    updateTaskState(state, calOption);
    api.postTask(ta)
      .done(function(ta) {
        reserveCalendar(ta.tid)
          .done(function(eventInfo) {
            api.getTask(ta.tid)
              .done(sched.loadTask);
          });
      });
  }

  function createScheduleSection(ta) {
'''
<div #view>
  <div #module
       class="sched-module disabled">
    <div #header
         class="sched-module-header collapsed">
      <span #showHide
            class="show-hide link">
        Show
      </span>
      <img id="select-icon"
           class="sched-module-icon"
           src="/assets/img/star.svg"/>
      <div #headerTitle
           class="sched-module-title">
        Schedule the preferred meeting option
      </div>
    </div>
    <div #content
         class="schedule-content clearfix hide">
      <div #optionA
           id="select-option-a"
           class="col-sm-4 schedule-option disabled">
        <div #letterA
             class="select-option-letter disabled">
          A
        </div>
        <button #buttonA
                class="btn btn-primary select-option-btn disabled">
          Schedule
        </button>
      </div>
      <div #optionB
           id="select-option-b"
           class="col-sm-4 schedule-option disabled">
        <div #letterB
             class="select-option-letter disabled">
          B
        </div>
        <button #buttonB
                class="btn btn-primary select-option-btn disabled">
          Schedule
        </button>
      </div>
      <div #optionC
           id="select-option-c"
           class="col-sm-4 schedule-option disabled">
        <div #letterC
             class="select-option-letter disabled">
          C
        </div>
        <button #buttonC
                class="btn btn-primary select-option-btn disabled">
          Schedule
        </button>
      </div>
      <div #temporary/>
    </div>
  </div>
</div>
'''
    var state = sched.getState(ta);
    var guests = sched.getAttendingGuests(ta);
    var avails = state.availabilities;
    var options = state.calendar_options;

    function enableOptionIfExists(index, letter) {
      var option = options[index];
      if (util.isNotNull(option)) {
        _view["option" + letter].removeClass("disabled");
        _view["letter" + letter].removeClass("disabled");
        if (worksForAllGuests(guests, avails, option)) {
          _view["letter" + letter].addClass("recommended");
        }
        _view["button" + letter]
          .removeClass("disabled")
          .click(function() {
            $(".select-option-btn").addClass("disabled");
            updateTask(ta, option);
          });
      }
    }

    enableOptionIfExists(0, "A");
    enableOptionIfExists(1, "B");
    enableOptionIfExists(2, "C");

    var next = $(".sched-step2-next");
    var selected;

    next
      .addClass("disabled")
      .off("click")
      .click(function() {
//        updateTask(ta, selected);
      });

    function onSelect(x) {
      selected = x;
      log(selected);
      next.removeClass("disabled");
    }

//    viewOfOptions(ta, onSelect)
//      .appendTo(temporary);

    return _view;
  }


/*** OFFER ***/

  function emailViewOfOption(calOption, i) {
    var option = sched.viewOfSuggestion(calOption.slot)
      .addClass("email-option-details");

    return $("<div class='email-option'/>")
      .append($("<div class='option-letter-sm option-letter-modal unselectable' />")
      .text(util.letterOfInt(i)))
      .append(option);
  }

  function emailViewOfOptions(options) {
    var view = $("<div class='email-options'/>");
    list.iter(options, function(x, i) {
      emailViewOfOption(x, i)
        .appendTo(view);
    });
    return view;
  }

  function showEndTime() {
    $("#sched-availability-message-readonly .time-text")
      .removeClass("hide");
    $("#sched-availability-message-readonly .time-text-short")
      .addClass("hide");
  }

  function hideEndTime() {
    $("#sched-availability-message-readonly .time-text")
      .addClass("hide");
    $("#sched-availability-message-readonly .time-text-short")
      .removeClass("hide");
  }

  function loadRecipients(toObsProf) {
    $("#sched-availability-to-list").children().remove();

    var recipientRow = $("<div class='sched-availability-to checkbox-selected'/>")
      .appendTo($("#sched-availability-to-list"));

    var recipientCheckboxDiv = $("<div class='recipient-checkbox-div'/>")
      .appendTo(recipientRow);

    var recipientCheckbox = $("<img class='recipient-checkbox'/>")
      .appendTo(recipientCheckboxDiv);
    svg.loadImg(recipientCheckbox, "/assets/img/checkbox-sm.svg");

    var recipientName = $("<div class='recipient-name' />")
      .append(profile.fullName(toObsProf.prof))
      .appendTo(recipientRow);

    recipientRow.click(function() {
      if (recipientRow.hasClass("checkbox-selected")) {
        recipientRow.removeClass("checkbox-selected");
      } else {
        recipientRow.addClass("checkbox-selected");
      }
    })
  }

  function preFillAvailabilityModal(profs, task, options, toUid) {
    var ea = sched.assistedBy(toUid, sched.getGuestOptions(task));
    var toObsProf = util.isNotNull(ea) ? profs[ea] : profs[toUid];

    loadRecipients(toObsProf);

    $("#sched-availability-subject")
      .val("Re: " + task.task_status.task_title);

    var organizerName = profile.fullName(profs[login.me()].prof);
    var hostName = profile.fullName(profs[login.leader()].prof);
    var toName = profile.fullName(profs[toUid].prof);

    var footerOption = $("#footer-option");
    footerOption.children().remove();

    var footerCheckboxDiv = $("<div class='footer-checkbox-div'/>")
      .appendTo(footerOption);
    var footerCheckbox = $("<img class='footer-checkbox'/>")
      .appendTo(footerCheckboxDiv);
    svg.loadImg(footerCheckbox, "/assets/img/checkbox-sm.svg");

    var timeOption = $("<div class='time-option' />")
      .append("Show end time of meeting options")
      .appendTo(footerOption);

    var footer = $("#sched-availability-message-readonly");
    footer.children().remove();
    footer.append(emailViewOfOptions(options));
    if (footer.hasClass("short")) {
      hideEndTime();
    } else {
      showEndTime();
    }

    footerOption.off("click");
    footerOption.click(function() {
      if (footerOption.hasClass("checkbox-selected")) {
        footerOption.removeClass("checkbox-selected");
        footer.addClass("short");
        hideEndTime();
      } else {
        footerOption.addClass("checkbox-selected");
        footer.removeClass("short");
        showEndTime();
      }
    })

    var parameters = {
      exec_name: hostName,
      guest_name: toName,
      guest_uid: toUid
    };

    if (util.isNotNull(ea)) {
      parameters.guest_EA = profile.fullName(profs[ea].prof);
      parameters.template_kind = "Options_to_guest_assistant";
      $("#sched-options-guest-addr").val("Address_to_assistant");
    } else {
      parameters.template_kind = "Options_to_guest";
      $("#sched-options-guest-addr").val("Address_directly");
    }
    api.getOptionsMessage(task.tid, parameters)
      .done(function(optionsMessage) {
        $("#sched-availability-message").val(optionsMessage.message_text);
        $("#sched-options-guest-addr")
          .unbind("change")
          .change(function(){refreshOptionsMessage(task.tid, parameters);});
      });
  }

  /*
     If didWeSend is true, look for the most recent chatKind TO uid
     otherwise, look for the most recent chatKind BY (from) uid
  */
  function howLongAgo(ta, uid, chatKind, didWeSend) {
    var firstMatch = list.find(ta.task_chat_items, function(x) {
      var uidMatch = didWeSend ? list.mem(x.to, uid) : x.by === uid;
      return uidMatch && variant.cons(x.chat_item_data) === chatKind;
    });
    var created = date.ofString(firstMatch.time_created);
    return date.viewTimeAgo(created).text();
  }

  function createOfferRow(profs, task, uid) {
'''
<div #view
     class="module-row clearfix">
  <div #compose
       class="btn compose-offer-btn"/>
</div>
'''
    var prof = profs[uid].prof;
    var state = sched.getState(task);
    var options = state.calendar_options;

    var availabilityModal = $("#sched-availability-modal");
    function closeAvailabilityModal(item) {
      availabilityModal.modal("hide");
    }

    function composeEmail() {
      preFillAvailabilityModal(profs, task, options, uid);
      availabilityModal.modal({});
    }

    var composeIcon = $("<img class='compose-confirmation-icon'/>")
      .appendTo(compose);
    svg.loadImg(composeIcon, "/assets/img/compose.svg");
    compose.append($("<span class='compose-confirmation-text'/>")
             .text("Write offer"));

    var chatHead = profile.viewMediumCirc(prof)
      .addClass("list-prof-circ")
      .appendTo(view);

    if (sched.sentEmail(task, uid, "Scheduling_q")) {
      chatHead.addClass("sent");
      compose.addClass("btn-default");
      composeIcon.addClass("sent");
    } else {
      chatHead.addClass("not-sent");
      compose.addClass("btn-primary");
      composeIcon.addClass("not-sent");
    }

    var guestName = profile.viewMediumFullName(prof)
      .addClass("reminder-guest-name")
      .appendTo(view);

    var plural = options.length === 1 ? "" : "s";
    var statusText = "Has not received the meeting option" + plural;
    if (sched.receivedEmail(task, uid, "Scheduling_r")) {
      statusText =
        "Submitted meeting preference" + plural + " " +
        howLongAgo(task, uid, "Scheduling_r", false);
    } else if (sched.sentEmail(task, uid, "Scheduling_q")) {
      statusText =
        "Received the meeting option" + plural + " " +
        howLongAgo(task, uid, "Scheduling_q", true);
    }
    var guestStatus = $("<div class='reminder-guest-status'/>")
      .text(statusText)
      .appendTo(view);

    compose.click(composeEmail);

    var sendButton = $("#sched-availability-send");
    sendButton
      .removeClass("disabled")
      .unbind('click')
      .click(function() {
        if (! sendButton.hasClass("disabled")) {
          sendButton.addClass("disabled");
          var body = $("#sched-availability-message").val();
          if ("Address_to_assistant" === $("#sched-options-guest-addr").val()) {
            var ea = sched.assistedBy(uid, sched.getGuestOptions(task));
            if (util.isNotNull(ea)) {
              uid = ea;
            }
          }
          var hideEnd = $("#sched-availability-message-readonly")
            .hasClass("short");
          sched.optionsForGuest(sched.getGuestOptions(task), uid)
            .hide_end_times = hideEnd;
          api.postTask(task).done(function() {
            var chatItem = {
              tid: task.tid,
              by: login.me(),
              to: [uid],
              chat_item_data: ["Scheduling_q", {
                body: body,
                choices: options
              }]
            };
            chat.postChatItem(chatItem)
              .done(closeAvailabilityModal);
          });
        }
      });

    return { view: view,
             composeEmail: composeEmail };
  }

  function createOfferSection(profs, ta, guests) {
'''
<div #view>
  <div #module
       class="sched-module disabled">
    <div #header
         class="sched-module-header collapsed">
      <span #showHide
            class="show-hide link">
        Show
      </span>
      <img id="offer-icon"
           class="sched-module-icon"
           src="/assets/img/email.svg"/>
      <div #headerTitle
           class="sched-module-title"/>
    </div>
    <div #content
         class="hide"/>
  </div>
  <div #connector
       class="connector collapsed"/>
</div>
'''
    var connectorIcon = $("<img/>")
      .appendTo(connector);
    svg.loadImg(connectorIcon, "/assets/img/connector.svg");

    var headerText = guests.length > 1 ?
      "Offer to guests" :
      "Offer to the guest";
    headerTitle.text(headerText);

    list.iter(guests, function(uid) {
      var x = createOfferRow(profs, ta, uid);
      x.view
        .appendTo(content)
    });

    return _view;
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
    _view.focus = cal.focus;

    return _view;
  }


  /*
    Create a view and everything needed to display and edit location
    and time for a meeting option.
  */
  function editableViewOfOption(tzList, profs, calOption,
                                saveCalOption, cancel, addMode) {
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

    var dates = {
      start: date.ofString(x.start),
      end: date.ofString(x.end)
    };

    function displayDates() {
      dateAndTimes.children().remove();
      if (util.isDefined(dates)) {
        dateAndTimes.append(sched.viewOfDates(dates.start, dates.end));
        dateAndTimes.removeClass("hide");
      }
      else {
        dateAndTimes.addClass("hide");
      }
    }

    displayDates();

    function setDates(optDates) {
      dates = optDates;
      displayDates(optDates);
      updateSaveButton();
    }

    function openCal() {
      var calModal = createCalendarModal({
        timezone: x.location.timezone,
        onChange: setDates
      });
      calPickerContainer.children().remove();
      calPickerContainer.append(calModal.modal);
      calModal.modal.modal({});
      calModal.doneButton
        .click(function() {
          /* dates are already saved by the onChange handler. */
          calModal.modal.modal("hide");
        });
      calModal.modal
        .on("shown.bs.modal", function() {
          calModal.cal.render(); // can't happen earlier or calendar won't show
        });
      calModal.cal.setDates(dates);
    }
    openCalPicker.click(openCal);

    /*** Meeting location ***/

    var loc = x.location;

    function displayTimezone() {
      setupTimezoneLink(_view, x);
    }

    function onTimezoneChange(oldTimezone, newTimezone) {
      displayTimezone();
      if (util.isNonEmptyString(oldTimezone)
          && util.isNonEmptyString(newTimezone))
        displayDates();
    }

    function onLocationSet(newLoc) {
      log("onLocationSet", newLoc);
      x.location = newLoc;
      if (util.isDefined(newLoc)) {
        displayTimezone();
        displayDates(dates);
      }
      updateSaveButton();
    }

    var locationForm = locpicker.create({
      onTimezoneChange: onTimezoneChange,
      onLocationSet: onLocationSet
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

  function readOnlyViewOfOption(calOption, toggleEdit, remove) {
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
          <a class="danger-list-item">Remove option</a>
        </li>
      </ul>
  </div>
  {{sched.viewOfOption(calOption, false)}}
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

    readOnlyContainer.append(readOnlyViewOfOption(calOption,
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
      profs: profs,
      createAdderForm: createAdderForm,
      onAdderOpen: disableNextButton /* reenabled when the page is reloaded */
    });
    list.iter(schedState.calendar_options, function(x, i) {
      v.append(insertViewOfOption(ta, tzList, profs, listView,
                                  x, i, save, remove));
    });
    v.append(listView.view)

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
'''
<div #view>
  <div #module
       class="sched-module first-module">
    <div #header
         class="sched-module-header">
      <span #showHide
            class="show-hide link">
        Hide
      </span>
      <img id="create-icon"
           class="sched-module-icon"
           src="/assets/img/create-options.svg"/>
      <div #headerTitle
           class="sched-module-title">
        Create up to 3 meeting options
      </div>
    </div>
    <div #content/>
  </div>
  <div #connector
       class="connector"/>
</div>
'''
    var connectorIcon = $("<img/>")
      .appendTo(connector);
    svg.loadImg(connectorIcon, "/assets/img/connector.svg");

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

    return _view;
  }

  mod.load = function(tzList, profs, ta, view) {
    view.children().remove();
    var guests = sched.getAttendingGuests(ta);

    var options = createOptionsSection(tzList, profs, ta);
    var offer = createOfferSection(profs, ta, guests);
    var schedule = createScheduleSection(ta);

    options.showHide.click(function() {
      toggleModule(options, "options");
    })
    offer.showHide.click(function() {
      toggleModule(offer, "offer");
    })
    schedule.showHide.click(function() {
      toggleModule(schedule, "schedule");
    })

    function toggleModule(toggling, x) {
      var content = toggling.content;
      var showHide = toggling.showHide;
      var header = toggling.header;
      var connector;
      if (x !== "schedule")
        connector = toggling.connector;

      if (content.hasClass("hide")) {
        showHide.text("Hide");
        header.removeClass("collapsed");
        content.removeClass("hide");
        if (connector != null)
          connector.removeClass("collapsed");
        hideOthers(x);
      } else {
        showHide.text("Show");
        header.addClass("collapsed");
        content.addClass("hide");
        if (connector != null)
          connector.addClass("collapsed");
      }

      function hideOthers(x) {
        if ((x != "options") && (! options.content.hasClass("hide")))
          toggleModule(options, "options");
        if ((x != "offer") && (! offer.content.hasClass("hide")))
          toggleModule(offer, "offer");
        if ((x != "schedule") && (! schedule.content.hasClass("hide")))
          toggleModule(schedule, "schedule");
      }
    }

    if (sched.getState(ta).calendar_options.length > 0) {
      offer.module.removeClass("disabled");
      schedule.module.removeClass("disabled");
    }

    view
      .append($("<h3>Find the best meeting option.</h3>"))
      .append(options.view)
      .append(offer.view)
      .append(schedule.view);

    observable.onSchedulingStepChanging.observe("step", function() {
      api.postTask(ta);
    });
  };

  return mod;
}());
