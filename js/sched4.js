/* Scheduling step 4 */

var sched4 = (function() {
  var mod = {};

  function getSlot(ta) {
    var state = sched.getState(ta);
    return state.reserved.slot;
  }

  function sentConfirmation(ta, uid) {
    return sched.sentEmail(ta, uid, "Sched_confirm");
  }

  function sentReminder(ta, uid) {
    return sched.sentEmail(ta, uid, "Sched_remind");
  }

  function reservedCalendarSlot(task) {
    var state = sched.getState(task);
    return util.isDefined(state.reserved) &&
      util.isDefined(state.reserved.google_event);
  }

  function eventTimeHasPassed(task) {
    var slot = getSlot(task);
    var startTimeLocal = date.ofString(slot.start);
    var tz = slot.location.timezone;
    var startTimeUTC = date.utcOfLocal(tz, startTimeLocal);
    var nowUTC = date.ofString(date.now());
    return startTimeUTC.getTime() < nowUTC.getTime();
  }

  /* REMINDERS */

  function closeReminderModal(reminderModal, ta, options) {
    var state = sched.getState(ta);
    options.reminder_message = reminderModal.messageEditable.val();
    state.participant_options =
      list.replace(state.participant_options, options, function(x) {
        return x.uid === options.uid;
      });
    api.postTask(ta);
    reminderModal.view.modal("hide");
  }

  function createReminderModal() {
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
             class="modal-icon reminder-modal-icon"/>
        <div #closeContainer
             class="modal-close"
             data-dismiss="modal"/>
        <div #title
            class="modal-title">
          Edit the reminder message.
        </div>
      </div>
      <table class="email-info-table">
        <tr class="email-info-row">
          <td class="email-info-label">TO</td>
          <td class="email-info ellipsis bold">
            <div #recipient
                 class="recipient-name"/>
            <select #meetingKind
                    class="hide">
              <option value="">Meeting</option>
              <option value="Phone_meeting">Phone Call</option>
            </select>
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
      <button #save
              type="button" class="btn btn-primary"
              style="float:right">
        Save
      </button>
    </div>
  </div>
</div>
'''
    var icon = $("<img class='svg-block'/>")
      .appendTo(iconContainer);
    svg.loadImg(icon, "/assets/img/reminder.svg");

    var close = $("<img class='svg-block'/>")
      .appendTo(closeContainer);
    svg.loadImg(close, "/assets/img/x.svg");

    messageEditable.autosize();

    return _view;
  }

  function editReminderEmail(profs, ta, options, guestUid) {
    var reminderModal = createReminderModal();
    var guestName = profile.fullName(profs[guestUid].prof);
    var guestEmail = profile.email(profs[guestUid].prof);
    var slot = getSlot(ta);

    reminderModal.recipient.text(guestName + " <" + guestEmail + ">");
    reminderModal.subject.text("Re: " + ta.task_status.task_title);

    var parameters = {
      guest_name: guestName,
      guest_uid: guestUid
    };

    var eaUid = sched.assistedBy(guestUid, sched.getGuestOptions(ta));
    var receiverOptions = options;
    if (util.isNotNull(eaUid)) {
      var eaName = profile.fullName(profs[eaUid].prof);
      var eaEmail = profile.email(profs[eaUid].prof);
      receiverOptions = sched.getGuestOptions(ta)[eaUid];
      reminderModal.recipient.text(eaName + " <" + eaEmail + ">");
      parameters.guest_EA = eaName;
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_reminder_to_guest_assistant";
      } else {
        parameters.template_kind = "Reminder_to_guest_assistant";
      }
    } else {
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_reminder_to_guest";
      } else {
        parameters.template_kind = "Reminder_to_guest";
      }
    }

    api.getReminderMessage(ta.tid, parameters)
      .done(function(x) {
        if (! receiverOptions.reminder_message) {
          reminderModal.messageEditable
            .val(x.message_text)
            .trigger("autosize.resize");
        } else {
          reminderModal.messageEditable
            .val(receiverOptions.reminder_message)
            .trigger("autosize.resize");
        }
      });

    var saveButton = reminderModal.save;
    saveButton
      .off("click")
      .click(function() {
        mp.track("Save reminder");
        closeReminderModal(reminderModal, ta, receiverOptions);
      });

    reminderModal.view.modal({});
  }

  function getReminderStatus(ta, uid) {
    var slot = getSlot(ta);
    var options = sched.getGuestOptions(ta)[uid];
    var startTimeLocal = date.ofString(slot.start);
    var tz = slot.location.timezone;
    var startTimeUTC = date.utcOfLocal(tz, startTimeLocal);
    var beforeSecs = sched.getState(ta).reserved.remind;
    if (util.isNotNull(beforeSecs)) {
      startTimeLocal.setTime(startTimeLocal.getTime() - (beforeSecs * 1000));
      startTimeUTC.setTime(startTimeUTC.getTime() - (beforeSecs * 1000));
      var reminderIntent =
        util.isNotNull(options.reminder_message) ?
        "Will receive a reminder on " + date.justStartTime(startTimeLocal) :
        "Not scheduled to receive a reminder";
      return sentReminder(ta, uid) ?
        "Reminder sent on " + date.justStartTime(startTimeLocal) :
        reminderIntent;
    } else if (eventTimeHasPassed(ta)) {
      return "Did not receive a reminder";
    } else {
      return "Not scheduled to receive a reminder";
    }
  }

  function createReminderRow(profs, ta, uid, guests) {
'''
<div #view
     class="module-row">
  <div #edit
       class="btn btn-primary edit-reminder-btn"/>
</div>
'''
    var prof = profs[uid].prof;

    var eaUID = sched.assistedBy(uid, sched.getGuestOptions(ta));

    var editIcon = $("<img class='edit-reminder-icon'/>")
      .appendTo(edit);
    svg.loadImg(editIcon, "/assets/img/edit.svg");
    edit.append($("<span class='edit-reminder-text'/>")
          .text("Edit draft"));

    var chatHead = profile.viewMediumCirc(prof)
      .addClass("list-prof-circ")
      .appendTo(view);

    var sent = util.isNotNull(eaUID) ?
      sentReminder(ta, eaUID) :
      sentReminder(ta, uid);
    if (sent) {
      chatHead.addClass("sent");
      edit.addClass("hide");
    } else {
      chatHead.addClass("not-sent");
    }

    var guestName = $("<div/>")
      .addClass("reminder-guest-name")
      .text(profile.fullNameOrEmail(prof))
      .appendTo(view);

    var reminderStatus = util.isNotNull(eaUID) ?
      getReminderStatus(ta, eaUID) :
      getReminderStatus(ta, uid);
    var guestStatus = $("<div class='reminder-guest-status'/>")
      .text(reminderStatus)
      .appendTo(view);

    var reminderModal = $("#sched-reminder-modal");
    var state = sched.getState(ta);
    var options = sched.getGuestOptions(ta)[uid];

    // Allow editing reminders only if event time is not already past
    if (eventTimeHasPassed(ta)) {
      edit.addClass("hide");
    }

    edit.click(function() {
      mp.track("Edit reminder");
      editReminderEmail(profs, ta, options, uid);
    });

    return { row: view, statusText: guestStatus };
  }

  function createReminderScheduler(profs, task, guests, statuses) {
    var sel;
    var reserved = sched.getState(task).reserved;

    function saveTask() {
      var remind = sel.get();
      if (remind <= 0)
        delete reserved.remind;
      else
        reserved.remind = remind;
      list.iter(statuses, function(stat) {
        var uid = stat.uid;
        var statusText = stat.text;
        var eaUID = sched.assistedBy(uid, sched.getGuestOptions(task));
        util.isNotNull(eaUID) ?
          statusText.text(getReminderStatus(task, eaUID)) :
          statusText.text(getReminderStatus(task, uid));
      });
      api.postTask(task);
    }

    /*
       Is task starting time minus duration (seconds) in the past?
       If so, disable the option to use that duration for reminders.
    */
    function disableIfPast(duration) {
      var slot = getSlot(task);
      var startTimeLocal = date.ofString(getSlot(task).start);
      var tz = slot.location.timezone;
      var startTimeUTC = date.utcOfLocal(tz, startTimeLocal);
      startTimeUTC.setTime(startTimeUTC.getTime() - (duration * 1000));
      var nowUTC = date.ofString(date.now());
      if (startTimeUTC.getTime() < nowUTC.getTime())
        return "disabled";
      else
        return null;
    }

    var hrb4 = " hours beforehand";
    var hr = 3600; // seconds
    sel = select.create({
      buttonClass: "reminder-dropdown",
      defaultAction: saveTask,
      options: [
        { label: "1 hour beforehand", key: "hr", value: hr, cls: disableIfPast(hr) },
        { label: "3"+hrb4, key: "3h", value: 3*hr, cls: disableIfPast(3*hr) },
        { label: "6"+hrb4, key: "6h", value: 6*hr, cls: disableIfPast(6*hr) },
        { label: "12"+hrb4, key: "12h", value: 12*hr, cls: disableIfPast(12*hr) },
        { label: "24"+hrb4, key: "24h", value: 24*hr, cls: disableIfPast(24*hr) },
        { label: "36"+hrb4, key: "36h", value: 36*hr, cls: disableIfPast(36*hr) },
        { label: "48"+hrb4, key: "48h", value: 48*hr, cls: disableIfPast(48*hr) },
        { label: "Never", key: "no", value: -1 }
      ]
    });

    var initVal = reserved.remind;
    var key = "no";
    if (! util.isDefined(initVal))
      key = "no";
    else if (initVal < 3600 + 0.5)
      key = "1h";
    else if (initVal < 3 * 3600 + 0.5)
      key = "3h";
    else if (initVal < 6 * 3600 + 0.5)
      key = "6h";
    else if (initVal < 12 * 3600 + 0.5)
      key = "12h";
    else if (initVal < 24 * 3600 + 0.5)
      key = "24h";
    else if (initVal < 36 * 3600 + 0.5)
      key = "36h";
    else
      key = "48h";
    sel.set(key);

    return sel.view;
  }

  function createReminderSection(profs, task, guests) {
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
           class="sched-module-icon reminder-icon"/>
      <div #headerTitle
           class="sched-module-title"/>
    </div>
    <div #content
         style="display:none">
      <div #scheduler
           class="reminder-scheduler">
        <span #schedulerTitle/>
      </div>
      <div #guestList/>
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
    svg.loadImg(headerIcon, "/assets/img/reminder.svg");

    var headerText = guests.length > 1 ?
      "Schedule a reminder for guests" :
      "Schedule a reminder";
    headerTitle.text(headerText);

    var schedulerText = guests.length > 1 ?
      "Send reminders" :
      "Send the reminder";
    schedulerTitle.text(schedulerText)
                  .attr("style","margin-right:10px");

    var allRemindersSent = true;
    var statuses = [];
    list.iter(guests, function(uid) {
      var reminderRow = createReminderRow(profs, task, uid, guests);
      guestList.append(reminderRow.row);
      statuses.push({uid: uid, text: reminderRow.statusText});
      allRemindersSent = allRemindersSent && sentReminder(task, uid);
    });

    var schedulerView = createReminderScheduler(profs, task, guests, statuses);
    scheduler.append(schedulerView);
    if (allRemindersSent)
      scheduler.addClass("hide");

    header.hover(
      function() {
        connectorNub.addClass("hovering");
      }, function() {
        connectorNub.removeClass("hovering");
      }
    );

    return _view;
  }


  /* CONFIRMATION */

  function createConfirmModal() {
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
             class="modal-icon confirmation-modal-icon"/>
        <div #closeContainer
             class="modal-close"
             data-dismiss="modal"/>
        <div #title
            class="modal-title">
          Send a confirmation message.
        </div>
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
         class="modal-footer clearfix" style="float:right">
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
  </div>
</div>
'''
    var icon = $("<img class='svg-block'/>")
      .appendTo(iconContainer);
    svg.loadImg(icon, "/assets/img/confirmation.svg");

    var close = $("<img class='svg-block'/>")
      .appendTo(closeContainer);
    svg.loadImg(close, "/assets/img/x.svg");

    messageEditable.autosize();

    return _view;
  }

  function confirmationDraftKey(ta, uid) {
    return ta.tid + "|" + uid + "|CONFIRM";
  }

  function composeConfirmEmail(profs, ta, toUid) {
    var confirmModal = createConfirmModal();
    var ea = sched.assistedBy(toUid, sched.getGuestOptions(ta));
    var hostName = profile.fullNameOrEmail(profs[login.leader()].prof);
    var toName = profile.fullName(profs[toUid].prof);
    var toEmail = profile.email(profs[toUid].prof);
    var slot = getSlot(ta);

    confirmModal.recipient.text(toName + " <" + toEmail + ">");
    confirmModal.subject.text("Re: " + ta.task_status.task_title);

    var t1 = date.ofString(slot.start);
    var t2 = date.ofString(slot.end);
    var hideEndTimes = sched.optionsForGuest(sched.getGuestOptions(ta), toUid)
                       .hide_end_times;
    var when =
      hideEndTimes ?
      date.justStartTime(t1) :
      date.range(t1, t2);
    var place = slot.location.address;
    if (slot.location.instructions)
      place += " (" + slot.location.instructions + ")";
    var where = "at " + (place == "" ? "a place to be determined" : place);

    var parameters = {
      exec_name: hostName,
      guest_name: toName,
      guest_uid: toUid,
      meet_date: date.weekDay(t1) + ", " + date.dateOnly(t1),
      meet_time: (
        hideEndTimes ?
        date.timeOnly(t1) :
        date.timeOnly(t1) + " to " + date.timeOnly(t2)
      )
    };

    if (util.isNotNull(ea)) {
      var eaName = profile.fullName(profs[ea].prof);
      confirmModal.recipient.text(eaName);
      parameters.guest_EA = eaName;
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_confirmation_to_guest_assistant";
      } else {
        parameters.template_kind = "Confirmation_to_guest_assistant";
      }
    } else {
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_confirmation_to_guest";
      } else {
        parameters.template_kind = "Confirmation_to_guest";
      }
    }

    var localStorageKey = confirmationDraftKey(ta, toUid);

    var draft = store.get(localStorageKey);
    if (util.isDefined(draft)) {
      confirmModal.discardDraft.show();
      confirmModal.messageEditable
        .val(draft)
        .trigger("autosize.resize");
    } else {
      confirmModal.discardDraft.hide();
      api.getConfirmationMessage(ta.tid, parameters)
        .done(function(confirmationMessage) {
          confirmModal.messageEditable
            .val(confirmationMessage.message_text)
            .trigger("autosize.resize");
        });
    }

    confirmModal.saveDraft
      .click(function() {
        mp.track("Save confirmation draft");
        var draft = confirmModal.messageEditable.val();
        store.set(localStorageKey, draft);
        confirmModal.view.modal("hide");
      });

    confirmModal.discardDraft
      .click(function() {
        mp.track("Discard confirmation draft");
        store.remove(localStorageKey);
        confirmModal.view.modal("hide");
      });

    var sendButton = confirmModal.send;
    sendButton
      .removeClass("disabled")
      .off("click")
      .click(function() {
        if (! sendButton.hasClass("disabled")) {
          sendButton.addClass("disabled");
          var body = confirmModal.messageEditable.val();
          var ea = sched.assistedBy(toUid, sched.getGuestOptions(ta));
          if (util.isNotNull(ea)) {
            toUid = ea;
          }
          var chatItem = {
            tid: ta.tid,
            by: login.me(),
            to: [toUid],
            chat_item_data: ["Sched_confirm", {
              body: body,
              'final': getSlot(ta)
            }]
          };
          spinner.spin("Sending...", chat.postChatItem(chatItem))
            .done(function(item) {
              mp.track("Send confirmation");
              confirmModal.view.modal("hide");
            });
        }
      });

    confirmModal.view.modal({});
  }

  function createConfirmRow(profs, ta, uid) {
'''
<div #view
     class="module-row">
  <div #compose
       class="btn compose-confirmation-btn"/>
</div>
'''
    var prof = profs[uid].prof;

    var composeIcon = $("<img class='compose-confirmation-icon'/>")
      .appendTo(compose);
    svg.loadImg(composeIcon, "/assets/img/compose.svg");
    compose.append($("<span class='compose-confirmation-text'/>")
             .text("Write message"));

    var chatHead = profile.viewMediumCirc(prof)
      .addClass("list-prof-circ")
      .appendTo(view);

    if (sentConfirmation(ta, uid)) {
      chatHead.addClass("sent");
      compose.addClass("btn-default");
      composeIcon.addClass("sent");
    } else {
      chatHead.addClass("not-sent");
      compose.addClass("btn-primary");
      composeIcon.addClass("not-sent");
    }

    var guestName = $("<div/>")
      .text(profile.fullNameOrEmail(prof))
      .addClass("confirmation-guest-name")
      .appendTo(view);

    var guestStatusText = sentConfirmation(ta, uid) ?
      "Confirmation sent" :
      "Has not received a confirmation";
    var guestStatus = $("<div class='confirmation-guest-status'/>")
      .text(guestStatusText)
      .appendTo(view);

    compose.click(function() {
      mp.track("Write confirmation");
      composeConfirmEmail(profs, ta, uid);
    })

    return view;
  }

  function createConfirmSection(profs, ta, guests) {
'''
<div #view
     class="sched-module-view collapsed">
  <div #connectorNub
       class="connector-nub"/>
  <div #module
       class="sched-module">
    <div #header
         class="sched-module-header collapsed">
      <span #showHide
            class="show-hide link">
        Show
      </span>
      <div #headerIconContainer
           class="sched-module-icon confirm-icon"/>
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
    svg.loadImg(headerIcon, "/assets/img/confirmation.svg");

    var connectorArrowIcon = $("<img class='svg-block'/>")
      .appendTo(connectorArrow);
    svg.loadImg(connectorArrowIcon, "/assets/img/connector-arrow.svg");

    var headerText = guests.length > 1 ?
      "Send guests a confirmation message" :
      "Send a confirmation message";
    headerTitle.text(headerText);

    list.iter(guests, function(uid) {
      content.append(createConfirmRow(profs, ta, uid));
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


  /* EDIT MEETING DETAILS */

  function saveAndReload(ta) {
    spinner.spin(
      "Updating calendar...",
      api.postTask(ta).done(sched.loadTask)
    );
  }

  function saveReserved(ta, calOption, googleDescription, savedPlaceID) {
    var schedState = sched.getState(ta);
    schedState.reserved = calOption;
    if (
      util.isNotNull(calOption.slot)
      && util.isNotNull(googleDescription)
      && calOption.slot.location.title !== ""
    ) {
      places.saveNamedPlace(calOption, googleDescription, savedPlaceID)
        .done(function() {
          mp.track("Update reserved");
          saveAndReload(ta);
        });
    } else {
      mp.track("Update reserved");
      saveAndReload(ta);
    }
  }

  function createReviewSection(profs, task) {
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
        Show
      </span>
      <div #headerIconContainer
           class="sched-module-icon review-icon"/>
      <div class="sched-module-title">
        Review meeting details
      </div>
    </div>
    <div #content
         class="review-content"
         style="display:none">
      <div #summary>
        <div #editButton
             class="btn-group edit-meeting">
          <button #edit
                  type="button"
                  class="btn btn-default edit-meeting-btn">
            Edit
          </button>
          <button type="button"
                  class="btn btn-default dropdown-toggle"
                  data-toggle="dropdown">
            <span class="caret"/>
            <span class="sr-only">Toggle Dropdown</span>
          </button>
          <ul class="dropdown-menu pull-right"
              role="menu">
            <li #editDetails>
              <a>Edit details</a>
            </li>
            <li #reschedule>
              <a>Reschedule</a>
            </li>
            <li #cancel>
              <a class="danger-list-item">Cancel & archive</a>
            </li>
          </ul>
        </div>
        {{sched.viewOfOption(sched.getState(task).reserved.slot).view}}
      </div>
    </div>
  </div>
  <div #connectorArrow
       class="connector-arrow"/>
</div>
'''
    var headerIcon = $("<img class='svg-block'/>")
      .appendTo(headerIconContainer);
    svg.loadImg(headerIcon, "/assets/img/calendar.svg");

    var connectorArrowIcon = $("<img class='svg-block'/>")
      .appendTo(connectorArrow);
    svg.loadImg(connectorArrowIcon, "/assets/img/connector-arrow.svg");

    var tid = task.tid;
    var state = sched.getState(task);

    function save(calOption, action, desc, savedID) {
      return saveReserved(task, calOption, desc, savedID);
    }

    var cancelEditMode =
      $("<span class='cancel-edit-mode link'>Cancel</span>")
        .click(toggleEditMode);
    var addMode = false;
    var editMode = editevent.create(profs, state.reserved,
                                     save, cancelEditMode, addMode);
    editMode = editMode.view;
    editMode.appendTo(content);
    editMode.addClass("hide");

    function toggleEditMode() {
      if (summary.hasClass("hide")) {
        mp.track("Show meeting details editor");
        summary.removeClass("hide");
        editMode.addClass("hide");
      } else {
        mp.track("Hide meeting details editor");
        summary.addClass("hide");
        editMode.removeClass("hide");
      }
    }

    function goBackToStep2() {
      task.task_status.task_progress = "Coordinating";
      state.scheduling_stage = "Coordinate";
      state.calendar_options = [];
      delete state.reserved;
    }

    function rescheduleClick() {
      var async = api.cancelCalendar(tid).then(function() {
        goBackToStep2();
        return api.postTask(task).done(function() {
          mp.track("Reschedule");
          sched.loadTask(task);
        });
      });
      spinner.spin("Removing from calendar...", async);
    }

    function cancelAndArchiveClick() {
      var async = api.cancelCalendar(tid).then(function() {
        goBackToStep2();
        return api.postTask(task).done(function() {
          mp.track("Cancel and archive");
          api.archiveTask(tid);
          window.location.hash = "#!";
        });
      });
      spinner.spin("Removing from calendar...", async);
    }

    header.hover(
      function() {
        connectorArrow.addClass("hovering");
      }, function() {
        connectorArrow.removeClass("hovering");
      }
    );

    edit.click(toggleEditMode);
    editDetails.click(toggleEditMode);
    reschedule.click(rescheduleClick);
    cancel.click(cancelAndArchiveClick);

    return _view;
  }

  mod.load = function(profs, ta, view) {
    var tid = ta.tid;
    var guests = sched.getAttendingGuests(ta);

    var review = createReviewSection(profs, ta);
    var confirm = createConfirmSection(profs, ta, guests);
    var reminder = createReminderSection(profs, ta, guests);

    function toggleByClick(toggling, x) {
      if (toggling.view.hasClass("collapsed")) {
        mp.track("Show " + x);
      } else {
        mp.track("Hide " + x);
      }
      toggleModule(toggling, x);
    }

    review.header.click(function() {
      toggleModule(review, "review");
    })
    confirm.header.click(function() {
      toggleModule(confirm, "confirm");
    })
    reminder.header.click(function() {
      toggleModule(reminder, "reminder");
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
        if ((x != "review") && (! review.view.hasClass("collapsed")))
          hideModule(review, "review");
        if ((x != "confirm") && (! confirm.view.hasClass("collapsed")))
          hideModule(confirm, "confirm");
        if ((x != "reminder") && (! reminder.view.hasClass("collapsed")))
          hideModule(reminder, "reminder");
      }
    }

    var confirmationSent = false;
    var reminderSent = false;
    list.iter(guests, function(uid) {
      if (sentConfirmation(ta, uid))
        confirmationSent = true;
      if (sentReminder(ta, uid))
        reminderSent = true;
    });

    if ((reminderSent) || (confirmationSent && !reminderSent)) {
      toggleModule(reminder, "reminder");
    } else {
      toggleModule(confirm, "confirm");
    }

    view
      .append($("<h3>Finalize and confirm the meeting.</h3>"))
      .append(review.view)
      .append(confirm.view)
      .append(reminder.view);

    /* Task is always saved when remind changes. */
    observable.onSchedulingStepChanging.stopObserve("step");
  };

  return mod;
}());
