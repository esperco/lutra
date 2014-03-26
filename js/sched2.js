/*
  Scheduling step 2
*/

var sched2 = (function() {
  var mod = {};

  function saveAndReload(ta, action) {
    disableNextButton();
    var msg;
    switch (action) {
    case "adding":
      msg = "Adding to calendar...";
      break;
    case "removing":
      msg = "Removing from calendar...";
      break;
    default:
      msg = "Updating calendar...";
    }
    spinner.spin(
      msg,
      api.postTask(ta).done(sched.loadTask)
    );
  }

  function disableNextButton() {
    $(".sched-step2-next")
      .addClass("disabled");
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


  /*** SELECT ***/

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

  function reserveCalendar(tid) {
    return api.reserveCalendar(tid, { notified: [] })
      .then(function(eventInfo) {
        return api.getTask(tid);
      });
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

  function updateTask(ta, calOption) {
    var state = sched.getState(ta);
    ta.task_status.task_progress = "Confirmed"; // status in the task list
    state.scheduling_stage = "Confirm";         // step in the scheduling page
    updateTaskState(state, calOption);
    var async =
      api.postTask(ta).then(function(ta) {
        return reserveCalendar(ta.tid).then(function(eventInfo) {
          return api.getTask(ta.tid).done(sched.loadTask);
        });
      });
    spinner.spin("Updating calendar...", async);
  }

  function createScheduleSection(ta) {
'''
<div #view
     class="sched-module-view collapsed">
  <div #connectorNub
       class="connector-nub"/>
  <div #module
       class="sched-module disabled">
    <div #header
         class="sched-module-header">
      <span #showHide
            class="show-hide link">
        Show
      </span>
      <div #headerIconContainer
           class="sched-module-icon schedule-icon"/>
      <div #headerTitle
           class="sched-module-title">
        Schedule the preferred meeting option
      </div>
    </div>
    <div #content
         class="schedule-content clearfix"
         style="display:none">
      <div #optionA
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
           class="col-sm-4 schedule-option center-block disabled">
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
    </div>
  </div>
  <div #connectorArrow
     class="connector-arrow"/>
</div>
'''
    var connectorNubIcon = $("<img class='svg-block'/>")
      .appendTo(connectorNub);
    svg.loadImg(connectorNubIcon, "/assets/img/connector-nub.svg");

    var headerIcon = $("<img class='svg-block'/>")
      .appendTo(headerIconContainer);
    svg.loadImg(headerIcon, "/assets/img/star.svg");

    var state = sched.getState(ta);
    var guests = sched.getAttendingGuests(ta);
    var avails = state.availabilities;
    var options = state.calendar_options;

    var i = 0;
    list.iter(options, function(x) {
      var showLoc = false;
      var x_view = sched.summaryOfOption(x.slot, showLoc);
      if (i === 0) {
        optionA.append(x_view.view);
      } else if (i === 1) {
        optionB.append(x_view.view);
      } else if (i === 2) {
        optionC.append(x_view.view);
      }
      i++;
    });

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
      } else {
        if (index === 1) {
          _view["option" + letter]
            .append($("<div class='not-created'/>")
              .text("A second meeting option was not created."));
        } else if (index === 2) {
          _view["option" + letter]
            .append($("<div class='not-created'/>")
              .text("A third meeting option was not created."));
        }
      }
    }

    enableOptionIfExists(0, "A");
    enableOptionIfExists(1, "B");
    enableOptionIfExists(2, "C");

    header.hover(
      function() {
        connectorNub.addClass("hovering");
      }, function() {
        connectorNub.removeClass("hovering");
      }
    );

    return _view;
  }


/*** OFFER ***/

  function emailViewOfOption(slot, i) {
'''
<div #view>
  <div #optionLetter
       class="option-letter">
    <span #letter/>
  </div>
  <div class="option-row">
    {{sched.viewOfOption(slot).view}}
  </div>
</div>
'''
    letter.text(indexLabel(i));

    return view;
  }

  function showEndTime() {
    $(".time-to").removeClass("hide");
    $(".time-end").removeClass("hide");
    $(".time-at").addClass("hide");
  }

  function hideEndTime() {
    $(".time-to").addClass("hide");
    $(".time-end").addClass("hide");
    $(".time-at").removeClass("hide");
  }

  function createOfferModal() {
'''
<div #view
     class="modal fade"
     tabindex="-1"
     role="dialog"
     aria-hidden="true">
  <div #dialog
       class="modal-dialog composition-modal">
    <div #content
         class="modal-content composition-modal">
      <div class="modal-header">
        <div #iconContainer
             class="modal-icon offer-modal-icon"/>
        <div #closeContainer
             class="modal-close"
             data-dismiss="modal"/>
        <div #title
            class="modal-title"/>
      </div>
      <table class="email-info-table">
        <tr class="email-info-row">
          <td class="email-info-label">TO</td>
          <td class="email-info ellipsis bold">
            <div #recipient
                 class="recipient-name"/>
          </td>
        </tr>
        <tr class="email-info-row">
          <td class="email-info-label">SUBJECT</td>
          <td #subject
               class="email-info ellipsis"/>
        </tr>
      </table>
    </div>
    <div #composeBox
         class="modal-compose-box scrollable">
      <textarea #messageEditable
                class="compose-text"/>
      <div #messageReadOnly
           class="compose-read-only"/>
    </div>
    <div #footer
         class="modal-footer clearfix">
      <div #showEndTimeOption
           class="show-end-time-option checkbox-selected">
        <div #showEndTimeCheckboxContainer
             class="checkbox-container"/>
        <div #showEndTimeText
             class="show-end-time-text"/>
      </div>
      <div style="float:right">
        <button #discardDraft
                type="button" class="btn btn-danger">
          Discard Draft
        </button>
        <button #saveDraft
                type="button" class="btn btn-default">
          Save as Draft
        </button>
        <button #send
                type="button" class="btn btn-primary">
          Send
        </button>
      </div>
      </button>
    </div>
  </div>
</div>
'''
    var icon = $("<img class='svg-block'/>")
      .appendTo(iconContainer);
    svg.loadImg(icon, "/assets/img/email.svg");

    var close = $("<img class='svg-block'/>")
      .appendTo(closeContainer);
    svg.loadImg(close, "/assets/img/x.svg");

    messageEditable.autosize();

    var showEndTimeCheckbox = $("<img class='svg-block'/>")
      .appendTo(showEndTimeCheckboxContainer);
    svg.loadImg(showEndTimeCheckbox, "/assets/img/checkbox-sm.svg");

    showEndTimeOption
      .off("click")
      .click(function() {
        if (showEndTimeOption.hasClass("checkbox-selected")) {
          showEndTimeOption.removeClass("checkbox-selected");
          messageReadOnly.addClass("short");
          hideEndTime();
        } else {
          showEndTimeOption.addClass("checkbox-selected");
          messageReadOnly.removeClass("short");
          showEndTime();
        }
      });

    return _view;
  }

  function optionsDraftKey(ta, uid) {
    return ta.tid + "|" + uid + "|OPTIONS";
  }

  function composeEmail(profs, task, options, toUid) {
    var offerModal = createOfferModal();
    var ea = sched.assistedBy(toUid, sched.getGuestOptions(task));
    var toObsProf = util.isNotNull(ea) ? profs[ea] : profs[toUid];
    var organizerName = profile.fullName(profs[login.me()].prof);
    var hostName = profile.fullName(profs[login.leader()].prof);
    var toName = profile.fullName(profs[toUid].prof);

    var plural = options.length === 1 ? "" : "s";
    offerModal.title.text("Offer the meeting option" + plural + ".");
    offerModal.showEndTimeText.text("Show end time of meeting option" + plural);

    offerModal.recipient.text(toName);
    offerModal.subject.text("Re: " + task.task_status.task_title);

    var readOnly = offerModal.messageReadOnly;
    readOnly.children().remove();
    list.iter(options, function(calOption, i) {
      emailViewOfOption(calOption.slot, i)
        .appendTo(readOnly);
    });
    if (readOnly.hasClass("short")) {
      hideEndTime();
    } else {
      showEndTime();
    }

    var parameters = {
      exec_name: hostName,
      guest_name: toName,
      guest_uid: toUid
    };

    if (util.isNotNull(ea)) {
      var eaName = profile.fullName(profs[ea].prof);
      offerModal.recipient.text(eaName);
      parameters.guest_EA = eaName;
      parameters.template_kind = "Options_to_guest_assistant";
    } else {
      parameters.template_kind = "Options_to_guest";
    }

    var localStorageKey = optionsDraftKey(task, toUid);

    var draft = store.get(localStorageKey);
    if (util.isDefined(draft)) {
      offerModal.discardDraft.show();
      offerModal.messageEditable
        .val(draft)
        .trigger("autosize.resize");
    } else {
      offerModal.discardDraft.hide();
      api.getOptionsMessage(task.tid, parameters)
        .done(function(optionsMessage) {
          offerModal.messageEditable
            .val(optionsMessage.message_text)
            .trigger("autosize.resize");
        });
    }

    offerModal.saveDraft
      .click(function() {
        var draft = offerModal.messageEditable.val();
        store.set(localStorageKey, draft);
        offerModal.view.modal("hide");
      });

    offerModal.discardDraft
      .click(function() {
        store.remove(localStorageKey);
        offerModal.view.modal("hide");
      });

    var sendButton = offerModal.send;
    sendButton
      .removeClass("disabled")
      .off("click")
      .click(function() {
        if (! sendButton.hasClass("disabled")) {
          sendButton.addClass("disabled");
          var body = offerModal.messageEditable.val();
          var ea = sched.assistedBy(toUid, sched.getGuestOptions(task));
          if (util.isNotNull(ea)) {
            toUid = ea;
          }
          var hideEnd = offerModal.messageReadOnly.hasClass("short");
          sched.optionsForGuest(sched.getGuestOptions(task), toUid)
            .hide_end_times = hideEnd;
          var async =
            api.postTask(task).then(function() {
              var chatItem = {
                tid: task.tid,
                by: login.me(),
                to: [toUid],
                chat_item_data: ["Scheduling_q", {
                  body: body,
                  choices: options
                }]
              };
              return chat.postChatItem(chatItem).done(function() {
                offerModal.view.modal("hide");
              });
            });
          spinner.spin("Sending...", async);
        }
      });

    offerModal.view.modal({});
  }

  function latestOfferTo(uid, ta) {
    var opts = sched.getState(ta).calendar_options;
    var offer = null;
    var latestTime = 0;
    list.iter(ta.task_chat_items, function(i) {
      if (i.chat_item_data[0] === "Scheduling_q" && list.mem(i.to, uid)) {
        var validChoices =
          list.for_all(i.chat_item_data[1].choices, function(choice) {
            return list.exists(opts, function(opt) {
              return opt.label === choice.label;
            });
          });
        var responseTime = date.ofString(i.time_created).getTime();
        if (validChoices && responseTime > latestTime) {
          offer = i;
          latestTime = responseTime;
        }
      }
    });
    return offer;
  }

  function latestResponseFrom(uid, ta) {
    var opts = sched.getState(ta).calendar_options;
    var response = null;
    var latestTime = 0;
    list.iter(ta.task_chat_items, function(i) {
      if (i.chat_item_data[0] === "Scheduling_r" && i.by === uid) {
        var validSelections =
          list.for_all(i.chat_item_data[1].selected, function(sel) {
            return list.exists(opts, function(opt) {
              return opt.label === sel.label;
            });
          });
        var responseTime = date.ofString(i.time_created).getTime();
        if (validSelections && responseTime > latestTime) {
          response = i;
          latestTime = responseTime;
        }
      }
    });
    return response;
  }

  /*
     If didWeSend is true, look for the most recent Scheduling_q TO uid
     otherwise, look for the most recent Scheduling_r BY (from) uid
  */
  function howLongAgo(ta, uid, didWeSend) {
    var latestMatch = didWeSend ?
      latestOfferTo(uid, ta) :
      latestResponseFrom(uid, ta);
    var created = date.ofString(latestMatch.time_created);
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
    var sentQ = latestOfferTo(uid, task);
    var receivedR = latestResponseFrom(uid, task);

    var composeIcon = $("<img class='compose-confirmation-icon'/>")
      .appendTo(compose);
    svg.loadImg(composeIcon, "/assets/img/compose.svg");
    compose.append($("<span class='compose-confirmation-text'/>")
             .text("Write offer"));

    var chatHead = profile.viewMediumCirc(prof)
      .addClass("list-prof-circ")
      .appendTo(view);

    if (util.isNotNull(sentQ)) {
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
    if (util.isNotNull(receivedR)) {
      statusText =
        "Submitted meeting preference" + plural + " " +
        howLongAgo(task, uid, false);
    } else if (util.isNotNull(sentQ)) {
      statusText =
        "Received the meeting option" + plural + " " +
        howLongAgo(task, uid, true);
    }
    var guestStatus = $("<div class='reminder-guest-status'/>")
      .text(statusText)
      .appendTo(view);

    compose.click(function() {
      composeEmail(profs, task, options, uid);
    });

    return view;
  }

  function createOfferSection(profs, ta, guests) {
'''
<div #view
     class="sched-module-view collapsed">
  <div #connectorNub
       class="connector-nub"/>
  <div #module
       class="sched-module">
    <div #header
         class="sched-module-header">
      <span #showHide
            class="show-hide link">
        Show
      </span>
      <div #headerIconContainer
           class="sched-module-icon offer-icon"/>
      <div #headerTitle
           class="sched-module-title"/>
    </div>
    <div #content
         style="display:none"/>
  </div>
  <div #connectorArrow
       class="connector-arrow"/>
</div>
'''
    var connectorNubIcon = $("<img class='svg-block'/>")
      .appendTo(connectorNub);
    svg.loadImg(connectorNubIcon, "/assets/img/connector-nub.svg");

    var headerIcon = $("<img class='svg-block'/>")
      .appendTo(headerIconContainer);
    svg.loadImg(headerIcon, "/assets/img/email.svg");

    var connectorArrowIcon = $("<img class='svg-block'/>")
      .appendTo(connectorArrow);
    svg.loadImg(connectorArrowIcon, "/assets/img/connector-arrow.svg");

    var headerText = guests.length > 1 ?
      "Offer to guests" :
      "Offer to the guest";
    headerTitle.text(headerText);

    list.iter(guests, function(uid) {
      content.append(createOfferRow(profs, ta, uid));
    });

    header.hover(
      function() {
        connectorNub.addClass("hovering");
        connectorArrow.addClass("hovering");
      }, function() {
        connectorNub.removeClass("hovering");
        connectorArrow.removeClass("hovering");
      }
    );

    return _view;
  }

  /*
    For now just a dropdown menu of meeting types.
    May be accompanied with options specific to the type of meeting selected.
  */
  function createMeetingTypeSelector(onSet, customBox) {
    function showCustom() {
      customBox
        .val("")
        .removeClass("hide")
        .focus();
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
    /* override default get() to read from the [possibly hidden] input box */
    meetingTypeSelector.get = function() { return customBox.val(); };

    return meetingTypeSelector;
  }

  /*
    If the meeting type does not require a location, the timezone can
    be changed by clicking on it, prompting the user for a location.
    Otherwise the timezone is determined by the location of the meeting.
   */
  function setupTimezoneLink(form, locationForm, slot) {
    function displayTimezone(loc) {
      if (util.isDefined(loc))
        timezoneText.text(timezone.format(loc.timezone));
    }
    function setTimezone(oldTz, newTz) {
      var loc = { timezone: newTz };
      slot.location = loc;
      displayTimezone(loc);
      locationForm.setLocation(loc);
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
        .addClass("link");
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
        .off("click")
        .removeClass("link");
      form.addPublicNotes
        .text("Add notes");
    }
    displayTimezone(slot.location);
    if (util.isDefined(locationForm))
      locationForm.setLocationNoCallback(slot.location);
  }

  function adaptToMeetingType(form, locationForm, slot) {
    setupTimezoneLink(form, locationForm, slot);
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
<div #view
     class="modal fade"
     tabindex="-1"
     role="dialog"
     aria-hidden="true">
  <div #dialog
       class="modal-dialog cal-picker-modal">
    <div #content
         class="modal-content cal-picker-modal">
      <div class="modal-header">
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
    </div>
  </div>
</div>
'''
    var icon = $("<img class='svg-block'/>")
      .appendTo(iconContainer);
    svg.loadImg(icon, "/assets/img/calendar.svg");

    // var id = util.randomString();
    // title.attr("id", id);
    // view.attr("aria-labelledby", id);

    var cal = calpicker.create(param);
    _view.cal = cal;
    _view.content.append(cal.view);
    _view.focus = cal.focus;

    return _view;
  }


  /*
    Create a view and everything needed to display and edit location
    and time for a meeting option.
  */
  function editableViewOfOption(profs, calOption,
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
        <input #meetingTypeInput
               type="text"
               class="hide form-control custom-type-input"/>
      </div>
    </div>
    <div class="edit-info-row">
      <div class="info-label when-label-edit">WHEN</div>
      <div class="info">
        <div class="clearfix">
          <div #dateAndTimes/>
          <div>
            <img class="timezone-icon-sm svg-block"
                 src="/assets/img/globe.svg"/>
            <span #timezoneText class="timezone-text"></span>
          </div>
          <div #timezonePicker/>
        </div>
        <span #openCalPicker
             class="open-cal-picker clearfix">
          <img class="open-cal-picker-icon svg-block"
               src="/assets/img/cal-picker.svg"/>
          <span #calendarLinkText
                class="open-cal-picker-text link">
            Select time in calendar
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
      createMeetingTypeSelector(setMeetingType, meetingTypeInput);
    meetingTypeContainer.append(meetingTypeSelector.view);
    meetingTypeSelector.set(x.meeting_type);

    /*** Meeting date and time, shown only once a timezone is set ***/

    var dates = {
      start: date.ofString(x.start),
      end: date.ofString(x.end)
    };

    function hasDates() {
      var result = util.isDefined(dates)
        && util.isNotNull(dates.start)
        && util.isNotNull(dates.end);
      return result;
    }

    function displayDates() {
      dateAndTimes.children().remove();
      if (hasDates()) {
        dateAndTimes.append(sched.viewOfDates(dates.start, dates.end));
      }
    }

    displayDates();

    function setDates(optDates) {
      dates = optDates;
      displayDates(optDates);
      updateSaveButton();
    }

    function openCal() {
      var defaultDate;
      if (util.isNotNull(dates.start))
        defaultDate = date.toString(dates.start);
      var calModal = createCalendarModal({
        timezone: x.location.timezone,
        onChange: setDates,
        defaultDate: defaultDate
      });
      calModal.view.modal({});
      calModal.doneButton
        .click(function() {
          /* dates are already saved by the onChange handler. */
          calModal.view.modal("hide");
        });
      calModal.view
        .on("shown.bs.modal", function() {
          calModal.cal.render(); // can't happen earlier or calendar won't show
        });
      calModal.cal.setDates(dates);
    }
    openCalPicker.click(openCal);

    /*** Meeting location ***/

    var loc = x.location;

    function displayTimezone() {
      setupTimezoneLink(_view, locationForm, x);
    }

    function onTimezoneChange(oldTimezone, newTimezone) {
      displayTimezone();
      if (util.isNonEmptyString(oldTimezone)
          && util.isNonEmptyString(newTimezone))
        displayDates();
      updateSaveButton();
    }

    function onLocationSet(newLoc) {
      x.location = newLoc;
      if (util.isDefined(newLoc)) {
        displayTimezone();
        displayDates(dates);
      }
      updateSaveButton();
    }

    /* locationForm is defined earlier because we have a circular dependency */
    locationForm = locpicker.create({
      onTimezoneChange: onTimezoneChange,
      onLocationSet: onLocationSet
    });
    if (util.isDefined(loc)) {
      locationForm.setLocation(loc);
      locationForm.toggleForm();
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
      if (meetingType === "Call")
        loc = locationForm.getTimezoneLocation();
      else
        loc = locationForm.getCompleteLocation();

      if (util.isNotNull(meetingType)
          && util.isNotNull(loc)
          && hasDates()) {
        var oldCalOption = calOption;
        var notes = {
          public_notes: notesBoxPublic.val(),
          private_notes: notesBoxPrivate.val()
        };
        var calSlot = {
          meeting_type: meetingType,
          location: loc,
          on_site: true,
          start: dates.start,
          end: dates.end,
          duration: dates.duration,
          notes: notes
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

    function saveMe(action) {
      saveButton.addClass("disabled");
      saveCalOption(getCalOption(), action);
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

  function createMeetingOption(profs, saveCalOption, cancel, addMode) {
    var calOption = {
      label: util.randomString(),
      slot: {}
    };
    return editableViewOfOption(profs, calOption,
                                saveCalOption, cancel, addMode);
  }

  function saveOption(ta, calOption, action) {
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
    saveAndReload(ta, action);
  }

  function removeOption(ta, calOptionLabel) {
    var schedState = sched.getState(ta);
    schedState.calendar_options =
      list.filter(schedState.calendar_options, function(x) {
        return x.label !== calOptionLabel;
      });
    saveAndReload(ta, "removing");
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
  {{sched.viewOfOption(calOption.slot).view}}
</div>
'''
    edit.click(toggleEdit);
    editOption.click(toggleEdit);
    removeOption.click(remove);

    return view;
  }

  function insertViewOfOption(ta, profs, listView, calOption,
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
          editableViewOfOption(profs, calOption,
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

    letter.text(indexLabel(i));
    readOnlyContainer.append(readOnlyViewOfOption(calOption,
                                                  toggleEdit, removeOption));

    return view;
  }

  function loadMeetingOptions(v, profs, ta) {
    function save(calOption, action) { return saveOption(ta, calOption, action); }
    function remove(calOption) { return removeOption(ta, calOption); }

    function createAdderForm(cancelAdd) {
      var addMode = true;
      return createMeetingOption(profs, save, cancelAdd, addMode).view
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
      v.append(insertViewOfOption(ta, profs, listView,
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

  function createOptionsSection(profs, ta) {
'''
<div #view
     class="sched-module-view first-module collapsed">
  <div #connectorNub
       class="connector-nub"/>
  <div #module
       class="sched-module">
    <div #header
         class="sched-module-header">
      <span #showHide
            class="show-hide link">
        Hide
      </span>
      <div #headerIconContainer
           class="sched-module-icon create-icon"/>
      <div #headerTitle
           class="sched-module-title">
        Create up to 3 meeting options
      </div>
    </div>
    <div #content
         style="display:none"/>
  </div>
  <div #connectorArrow
       class="connector-arrow"/>
</div>
'''
    var headerIcon = $("<img class='svg-block'/>")
      .appendTo(headerIconContainer);
    svg.loadImg(headerIcon, "/assets/img/create-options.svg");

    var connectorArrowIcon = $("<img class='svg-block'/>")
      .appendTo(connectorArrow);
    svg.loadImg(connectorArrowIcon, "/assets/img/connector-arrow.svg");

    var leaderUid = login.leader();
    if (! list.mem(ta.task_participants.organized_for, leaderUid)) {
      deferred.defer(loadMeetingOptions(content, profs, ta));
    }
    else {
      var authLandingUrl = document.URL;
      api.getCalendarInfo(leaderUid, authLandingUrl)
        .then(function(calInfo) {
          if (!calInfo.has_calendar)
            promptForCalendar(profs[leaderUid], calInfo);
          else
            loadMeetingOptions(content, profs, ta);
        });
    }

    header.hover(
      function() {
        connectorArrow.addClass("hovering");
      }, function() {
        connectorArrow.removeClass("hovering");
      }
    );

    return _view;
  }

  mod.load = function(profs, ta, view) {
    var guests = sched.getAttendingGuests(ta);
    var options = createOptionsSection(profs, ta);
    var offer = createOfferSection(profs, ta, guests);
    var schedule = createScheduleSection(ta);

    options.header.click(function() {
      toggleModule(options, "options");
    })
    offer.header.click(function() {
      toggleModule(offer, "offer");
    })
    schedule.header.click(function() {
      toggleModule(schedule, "schedule");
    })

    function toggleModule(toggling, x) {
      if (toggling.view.hasClass("collapsed"))
        showModule(toggling, x);
      else
        hideModule(toggling, x);

      function showModule(toggling, x) {
        toggling.showHide.text("Hide");
        toggling.view.removeClass("collapsed");
        toggling.headerIconContainer.addClass("active");
        toggling.content.slideDown("fast");
        hideOthers(x);
      }

      function hideModule(toggling, x) {
        toggling.showHide.text("Show");
        toggling.view.addClass("collapsed");
        toggling.headerIconContainer.removeClass("active");
        toggling.content.slideUp("fast");
      }

      function hideOthers(x) {
        if ((x != "options") && (! options.view.hasClass("collapsed")))
          hideModule(options, "options");
        if ((x != "offer") && (! offer.view.hasClass("collapsed")))
          hideModule(offer, "offer");
        if ((x != "schedule") && (! schedule.view.hasClass("collapsed")))
          hideModule(schedule, "schedule");
      }
    }

    if (sched.getState(ta).calendar_options.length > 0) {
      offer.view.removeClass("disabled");
      schedule.view.removeClass("disabled");
    } else {
      offer.view.addClass("disabled");
      schedule.view.addClass("disabled");
    }

    /*
       Is there any offer message in the chat items
       whose options match the current value of calendar_options?
    */
    function sentAnyOffer() {
      var opts = sched.getState(ta).calendar_options;
      return list.exists(ta.task_chat_items, function(i) {
        if (i.chat_item_data[0] === "Scheduling_q") {
          return list.for_all(i.chat_item_data[1].choices, function(choice) {
            return list.exists(opts, function(opt) {
              return choice.label === opt.label;
            });
          });
        }
      });
    }

    /*
       For each attending guest, is there a response to our offer in chat,
       whose selections match the current value of calendar_options?
    */
    function receivedAllPreferences() {
      var opts = sched.getState(ta).calendar_options;
      return list.for_all(sched.getAttendingGuests(ta), function(uid) {
        return list.exists(ta.task_chat_items, function(i) {
          if (i.by === uid && i.chat_item_data[0] === "Scheduling_r") {
            return list.for_all(i.chat_item_data[1].selected, function(sel) {
              return list.exists(opts, function(opt) {
                return sel.label === opt.label;
              });
            });
          }
        });
      });
    }

    if (receivedAllPreferences()) {
      toggleModule(schedule, "schedule");
    } else if (sentAnyOffer()) {
      toggleModule(offer, "offer");
    } else {
      toggleModule(options, "options");
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
