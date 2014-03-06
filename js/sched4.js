/* Scheduling step 4 */

var sched4 = (function() {
  var mod = {};

  var chats = null;

  function getSlot(ta) {
    var state = sched.getState(ta);
    return state.reserved.slot;
  }

  function sentConfirmation(uid) {
    var chat = chats[uid];
    return chat && list.exists(chat.chat_items, function(x) {
      return (x.chat_item_data[0] === "Sched_confirm");
    });
  }

  function sentReminder(uid) {
    var chat = chats[uid];
    return chat && list.exists(chat.chat_items, function(x) {
      return (x.chat_item_data[0] === "Sched_remind");
    });
  }

  function reservedCalendarSlot(task) {
    var state = sched.getState(task);
    return util.isDefined(state.reserved) &&
      util.isDefined(state.reserved.google_event);
  }

  function loadRecipientRow(x, toObsProf) {
    var recipientCheckboxDiv = $("<div class='recipient-checkbox-div'/>")
      .appendTo(x);

    var recipientCheckbox = $("<img class='recipient-checkbox'/>")
      .appendTo(recipientCheckboxDiv);
    svg.loadImg(recipientCheckbox, "/assets/img/checkbox-sm.svg");

    var recipientName = $("<div class='recipient-name' />")
      .append(profile.fullName(toObsProf.prof))
      .appendTo(x);

    x.click(function() {
      if (x.hasClass("checkbox-selected")) {
        x.removeClass("checkbox-selected");
      } else {
        x.addClass("checkbox-selected");
      }
    })
  }

  function loadReminderRecipients(profs, guests) {
    $("#sched-reminder-to-list").children().remove();

    list.iter(guests, function(uid) {
      var toObsProf = profs[uid];
      var recipientRow = $("<div class='sched-reminder-to checkbox-selected'/>")
        .appendTo($("#sched-reminder-to-list"));
      loadRecipientRow(recipientRow, toObsProf);
    });
  }

  function loadConfirmRecipients(toObsProf) {
    $("#sched-confirm-to-list").children().remove();

    var recipientRow = $("<div class='sched-confirm-to checkbox-selected'/>")
      .appendTo($("#sched-confirm-to-list"));

    loadRecipientRow(recipientRow, toObsProf);
  }

  function preFillConfirmModal(profs, ta, toUid) {
    var toObsProf = profs[toUid];
    var slot = getSlot(ta);

    loadConfirmRecipients(toObsProf);

    $("#sched-confirm-subject")
      .val("Re: " + ta.task_status.task_title);

    var organizerName = profile.fullName(profs[login.me()].prof);
    var hostName = profile.fullName(profs[login.leader()].prof);
    var toName = profile.fullName(toObsProf.prof);
    var t1 = date.ofString(slot.start);
    var t2 = date.ofString(slot.end);
    var when =
      ta.task_data[1].hide_end_times ?
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
        ta.task_data[1].hide_end_times ?
        date.timeOnly(t1) :
        date.timeOnly(t1) + " to " + date.timeOnly(t2)
      )
    };
    var ea = sched.assistedBy(toUid, sched.getGuestOptions(ta));
    if (util.isNotNull(ea)) {
      parameters.guest_EA = profile.fullName(profs[ea].prof);
      parameters.template_kind = "Confirmation_to_guest_assistant";
      $("#sched-confirm-guest-addr").val("Address_to_assistant");
    } else {
      parameters.template_kind = "Confirmation_to_guest";
      $("#sched-confirm-guest-addr").val("Address_directly");
    }
    api.getConfirmationMessage(ta.tid, parameters)
      .done(function(confirmationMessage) {
        $("#sched-confirm-message").val(confirmationMessage.message_text);

        /*
        var schedConfirmShowEnd = $("#sched-confirm-show-end");
        schedConfirmShowEnd.children().remove();

        var showEndCheckboxDiv = $("<div class='footer-checkbox-div'/>")
          .appendTo(schedConfirmShowEnd);
        var showEndCheckbox = $("<img class='footer-checkbox'/>")
          .appendTo(showEndCheckboxDiv);
        svg.loadImg(showEndCheckbox, "/assets/img/checkbox-sm.svg");

        var timeOption = $("<div class='time-option' />")
          .append("Show end time of meeting")
          .appendTo(schedConfirmShowEnd);

        if (ta.task_data[1].hide_end_times)
          schedConfirmShowEnd.removeClass("checkbox-selected");
        else
          schedConfirmShowEnd.addClass("checkbox-selected");

        schedConfirmShowEnd.off("click");
        schedConfirmShowEnd.click(function() {
          var when = null;
          if (schedConfirmShowEnd.hasClass("checkbox-selected")) {
            schedConfirmShowEnd.removeClass("checkbox-selected");
            var when = "on " + date.justStartTime(t1);
          } else {
            schedConfirmShowEnd.addClass("checkbox-selected");
            var when = "on " + date.range(t1, t2);
          }
          var body = formalEmailBody(organizerName, hostName, toName, when, where);
          $("#sched-confirm-message").val(body);
        });
        */

        $("#sched-confirm-guest-addr")
          .unbind("change")
          .change(function(){refreshConfirmationMessage(ta.tid, parameters);});
    });
  }

  function refreshConfirmationMessage(tid, parameters) {
    if ($("#sched-confirm-guest-addr").val() === "Address_directly") {
      parameters.template_kind = "Confirmation_to_guest";
    } else {
      parameters.template_kind = "Confirmation_to_guest_assistant";
    }
    api.getConfirmationMessage(tid, parameters)
      .done(function(x) {
        $("#sched-confirm-message").val(x.message_text);
      });
  }

  function refreshReminderMessage(tid, parameters) {
    if ($("#sched-reminder-guest-addr").val() === "Address_directly") {
      parameters.template_kind = "Reminder_to_guest";
    } else {
      parameters.template_kind = "Reminder_to_guest_assistant";
    }
    api.getReminderMessage(tid, parameters)
      .done(function(x) {
        $("#sched-reminder-message").val(x.message_text);
      });
  }

  function preFillReminderModal(profs, ta, reserved, guests) {
    loadReminderRecipients(profs, guests);

    $("#sched-reminder-subject")
      .val("Re: " + ta.task_status.task_title);

    if (reserved.reminder_message) {
      $("#sched-reminder-message").val(reserved.reminder_message);
    }

    var parameters = {
      guest_name: $(".recipient-name").first().text()
    };
    var ea = sched.assistedBy(guests[0], sched.getGuestOptions(ta));
    if (util.isNotNull(ea)) {
      parameters.guest_EA = profile.fullName(profs[ea].prof);
      parameters.template_kind = "Reminder_to_guest_assistant";
      $("#sched-reminder-guest-addr").val("Address_to_assistant");
    } else {
      parameters.template_kind = "Reminder_to_guest";
      $("#sched-reminder-guest-addr").val("Address_directly");
    }
    api.getReminderMessage(ta.tid, parameters)
      .done(function(x) {
        if (! reserved.reminder_message) {
          $("#sched-reminder-message").val(x.message_text);
        }
        $("#sched-reminder-guest-addr")
          .unbind("change")
          .change(function(){refreshReminderMessage(ta.tid, parameters);});
      });
  }


  /* REMINDERS */

  function createReminderRow(profs, ta, uid, guests) {
    var view = $("<div class='sched-step4-row container'/>");

    var reminderModal = $("#sched-reminder-modal");
    var reserved = sched.getState(ta).reserved;
    function closeReminderModal() {
      reserved.reminder_message = $("#sched-reminder-message").val();
      api.postTask(ta);
      reminderModal.modal("hide");
    }

    function editReminderEmail() {
      preFillReminderModal(profs, ta, reserved, guests);
      reminderModal.modal({});
    }

    var okButton = $("#sched-reminder-update");
    okButton
      .unbind('click')
      .click(closeReminderModal);

    var editDiv = $("<div class='reminder-edit-div clickable'/>")
      .click(editReminderEmail);
    var edit = $("<img class='reminder-edit'/>")
      .appendTo(editDiv);
    svg.loadImg(edit, "/assets/img/compose.svg")
      .then(function(elt) { edit = elt; });

    var prof = profs[uid].prof;
    var guestName = profile.viewMediumFullName(prof)
      .addClass("reminder-guest-name");

    var guestStatusText = sentReminder(uid) ?
      "Reminder sent" :
      "Has not been sent a reminder";
    var guestStatus = $("<div class='reminder-guest-status'/>")
      .text(guestStatusText);

    return view
      .append(editDiv)
      .append(guestName)
      .append(guestStatus);
  }

  function createReminderScheduler(profs, task, guests) {
    var sel;
    var reserved = sched.getState(task).reserved;

    function saveTask() {
      var remind = sel.get();
      if (remind <= 0)
        delete reserved.remind;
      else
        reserved.remind = remind;
      api.postTask(task);
    }

    sel = select.create({
      buttonClass: "reminder-dropdown",
      defaultAction: saveTask,
      options: [
        { label: "24 hours before event", key: "24h", value: 2 * 43200 },
        { label: "36 hours before event", key: "36h", value: 3 * 43200 },
        { label: "48 hours before event", key: "48h", value: 4 * 43200 },
        { label: "Never", key: "no", value: -1 }
      ]
    });

    var initVal = reserved.remind;
    var key = "no";
    if (! util.isDefined(initVal))
      key = "no";
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
    var view = $("<div class='final-sched-div'/>");

    var header = $("<div class='sched-step4-section-header'/>")
      .appendTo(view);
    var reminderIcon = $("<img class='sched-step4-section-icon'/>")
      .appendTo(header);
    svg.loadImg(reminderIcon, "/assets/img/reminder.svg")
      .then(function(elt) { edit = elt; });
    var title = guests.length > 1 ?
      "Schedule a reminder for guests" :
      "Schedule a reminder";
    var headerText = $("<div class='sched-step4-section-title'/>")
      .text(title)
      .appendTo(header);

    var scheduler = $("<div id='reminder-scheduler'/>")
    var schedulerText = guests.length > 1 ?
      "Send reminders" :
      "Send the reminder";
    $("<span id='scheduler-text'/>")
      .text(schedulerText)
      .appendTo(scheduler);
    scheduler.append(createReminderScheduler(profs, task, guests))
             .appendTo(view);

    var content = $("<div/>")
      .appendTo(view);

    list.iter(guests, function(uid) {
      var x = createReminderRow(profs, task, uid, guests)
        .appendTo(content);
    });

    return view;
  }


  /* CONFIRMATION */

  function createConfirmRow(profs, ta, uid) {
    var view = $("<div class='sched-step4-row container'/>");

    var composeDiv = $("<div class='confirmation-compose-div clickable'/>")
      .click(composeConfirmationEmail);
    var compose = $("<img class='confirmation-compose'/>")
      .appendTo(composeDiv);
    svg.loadImg(compose, "/assets/img/compose.svg")
      .then(function(elt) { compose = elt; });

    var confirmModal = $("#sched-confirm-modal");
    function closeConfirmModal() {
      confirmModal.modal("hide");
    }

    var prof = profs[uid].prof;
    var guestName = profile.viewMediumFullName(prof)
      .addClass("confirmation-guest-name");

    var guestStatusText = sentConfirmation(uid) ?
      "Confirmation sent" :
      "Has not been sent a confirmation";
    var guestStatus = $("<div class='confirmation-guest-status'/>")
      .text(guestStatusText);

    view
      .append(composeDiv)
      .append(guestName)
      .append(guestStatus);

    function setupSendButton() {
      var sendButton = $("#sched-confirm-send");
      sendButton
        .removeClass("disabled")
        .unbind('click')
        .click(function() {
          if (! sendButton.hasClass("disabled")) {
            sendButton.addClass("disabled");
            var body = $("#sched-confirm-message").val();
            if ("Address_to_assistant"===$("#sched-confirm-guest-addr").val()) {
              var ea = sched.assistedBy(uid, sched.getGuestOptions(ta));
              if (util.isNotNull(ea)) {
                uid = ea;
              }
            }
            var chatid = chats[uid].chatid;
            var hideEnd = ta.task_data[1].hide_end_times;
            var chatItem = {
              chatid: chatid,
              by: login.me(),
              'for': login.me(),
              team: login.getTeam().teamid,
              chat_item_data: ["Sched_confirm", {
                body: body,
                'final': getSlot(ta),
                hide_end_time: hideEnd
              }]
            };
            chat.postChatItem(chatItem)
              .done(function(item) {
                closeConfirmModal();
              });
          }
        });
    }

    function composeConfirmationEmail() {
      preFillConfirmModal(profs, ta, uid);
      setupSendButton();
      confirmModal.modal({});
    }

    return {
      view: view,
      composeConfirmationEmail: composeConfirmationEmail
    };
  }

  function createConfirmSection(profs, ta, guests) {
    var view = $("<div class='final-sched-div'/>");

    var header = $("<div class='sched-step4-section-header'/>")
      .appendTo(view);
    var confirmationIcon = $("<img class='sched-step4-section-icon'/>")
      .appendTo(header);
    svg.loadImg(confirmationIcon, "/assets/img/confirmation.svg")
      .then(function(elt) { edit = elt; });
    var title = guests.length > 1 ?
      "Send guests a confirmation message" :
      "Send a confirmation message";
    var headerText = $("<div class='sched-step4-section-title'/>")
      .text(title)
      .appendTo(header);

    var content = $("<div/>")
      .appendTo(view);
    list.iter(guests, function(uid) {
      var x = createConfirmRow(profs, ta, uid);
      x.view.appendTo(content);
      if (guests.length == 1) {
        var uid = guests[0];
        if (! sentConfirmation(uid))
          x.composeConfirmationEmail();
      }
    });

    return view;
  }


  /* EDIT MEETING DETAILS */

  function enableEventEditSave(task, titleEdit, updateButton) {
    if (titleEdit.val().length > 0 && reservedCalendarSlot(task)) {
      updateButton.removeClass("disabled");
    }
  }

  function updateCalendarEvent(task, titleEdit, notesEdit, updateButton) {
    var taskState = sched.getState(task);
    taskState.calendar_event_title.title_text = titleEdit.val();
    taskState.calendar_event_title.is_generated = false;
    taskState.calendar_event_notes = notesEdit.val();
    api.postTask(task).done(function() {
      api.updateCalendar(task.tid, {
        event_id: sched.getState(task).reserved.google_event,
        event_title: titleEdit.val(),
        event_notes: notesEdit.val()
      })
        .done(function() { updateButton.addClass("disabled"); });
    });
  }

  function createEventEditSection(task) {
    var view = $("<div id='edit-meeting-div' class='final-sched-div'/>");

    var header = $("<div class='sched-step4-section-header'/>")
      .appendTo(view);
    var calendarIcon = $("<img class='sched-step4-section-icon'/>")
      .appendTo(header);
    svg.loadImg(calendarIcon, "/assets/img/calendar.svg")
      .then(function(elt) { edit = elt; });
    var headerText = $("<div class='sched-step4-section-title'/>")
      .text("Edit meeting details")
      .appendTo(header);

    var content = $("<div id='meeting-content'/>")
      .appendTo(view);

    var titleEdit =
      $("<input type='text' id='edit-calendar-title' class='form-control'/>");
    var notesEdit = $("<textarea id='edit-event-notes' rows=5 class='form-control'/>");
    var updateButton =
      $("<button id='event-edit-update' class='btn btn-primary'/>");
    var state = sched.getState(task);

    $("<div id='calendar-title' class='text-field-label'/>")
      .text("Title")
      .appendTo(content);
    titleEdit
      .val(state.calendar_event_title.title_text)
      .on("input", function() {
        enableEventEditSave(task, titleEdit, updateButton)
      })
      .appendTo(content);

    $("<div class='text-field-label'/>")
      .text("Notes")
      .appendTo(content);
    notesEdit
      .val(state.calendar_event_notes)
      .on("input", function() {
        enableEventEditSave(task, titleEdit, updateButton)
      })
      .appendTo(content);

    updateButton
      .addClass("disabled")
      .text("Update calendar")
      .click(function() {
        updateCalendarEvent(task, titleEdit, notesEdit, updateButton)
      })
      .appendTo(content);

    return view;
  }


  function createConnector(idName) {
    var connector = $("<img id='" + idName + "' class='connector'/>");
    svg.loadImg(connector, "/assets/img/connector.svg");
    return connector;
  }

  mod.load = function(profs, ta, view) {
    var tid = ta.tid;
    var guests = sched.getAttendingGuests(ta);
    chats = sched.chatsOfTask(ta);

    view
      .append($("<h3>Finalize and confirm the meeting.</h3>"))
      .append(createEventEditSection(ta))
      .append(createConnector("step4-1to2"))
      .append(createConfirmSection(profs, ta, guests))
      .append(createConnector("step4-2to3"))
      .append(createReminderSection(profs, ta, guests));

    observable.onTaskParticipantsChanged.observe("step4", function(ta) {
      chats = sched.chatsOfTask(ta);
    });
    /* Task is always saved when remind changes. */
    observable.onSchedulingStepChanging.stopObserve("step");
  };

  return mod;
}());
