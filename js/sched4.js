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
      "Has not received a reminder";
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
    var view = $("<div class='sched-module'/>");

    var header = $("<div class='sched-module-header'/>")
      .appendTo(view);
    var showHide = $("<span class='show-hide link'/>")
      .text("Hide")
      .appendTo(header);
    var reminderIcon = $("<img class='sched-module-icon'/>")
      .appendTo(header);
    svg.loadImg(reminderIcon, "/assets/img/reminder.svg");
    var title = guests.length > 1 ?
      "Schedule a reminder for guests" :
      "Schedule a reminder";
    var headerText = $("<div class='sched-module-title'/>")
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

    showHide.click(function() {
      if (content.hasClass("hide")) {
        header.removeClass("collapsed");
        scheduler.removeClass("hide");
        content.removeClass("hide");
        showHide.text("Hide");
      } else {
        header.addClass("collapsed");
        scheduler.addClass("hide");
        content.addClass("hide");
        showHide.text("Show");
      }
    })

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
      "Has not received a confirmation";
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
    var confirmationIcon = $("<img class='sched-module-icon'/>")
      .appendTo(header);
    svg.loadImg(confirmationIcon, "/assets/img/confirmation.svg");
    var title = guests.length > 1 ?
      "Send guests a confirmation message" :
      "Send a confirmation message";
    var headerText = $("<div class='sched-module-title'/>")
      .text(title)
      .appendTo(header);

    var content = $("<div/>")
      .appendTo(module);
    list.iter(guests, function(uid) {
      var x = createConfirmRow(profs, ta, uid);
      x.view.appendTo(content);
      if (guests.length == 1) {
        var uid = guests[0];
        if (! sentConfirmation(uid))
          x.composeConfirmationEmail();
      }
    });

    showHide.click(function() {
      if (content.hasClass("hide")) {
        header.removeClass("collapsed");
        content.removeClass("hide");
        connector.removeClass("collapsed");
        showHide.text("Hide");
      } else {
        header.addClass("collapsed");
        content.addClass("hide");
        connector.addClass("collapsed");
        showHide.text("Show");
      }
    })

    return view;
  }


  /* EDIT MEETING DETAILS */

  function enableEventEditSave(task, titleEdit, updateButton) {
    if (titleEdit.val().length > 0 && reservedCalendarSlot(task)) {
      updateButton.removeClass("disabled");
    }
  }

  function updateCalendarEvent(param) {
    var task = param.task;
    var taskState = sched.getState(task);
    taskState.calendar_event_title.title_text = param.titleEdit.val();
    taskState.calendar_event_title.is_generated = false;
    taskState.public_notes = param.notesBoxPublic.val();
    taskState.private_notes = param.notesBoxPrivate.val();
    api.postTask(task).done(function() {
      api.updateCalendar(param.task.tid, {
        event_id: sched.getState(task).reserved.google_event,
        event_title: param.titleEdit.val(),
        event_notes: {
          public_notes: param.notesBoxPublic.val(),
          private_notes: param.notesBoxPrivate.val()
        }
      })
        .done(function() { param.updateButton.addClass("disabled"); });
    });
  }

  function createEditMode(profs, task, summary) {
    var view = $("<div id='meeting-edit' class='hide'/>");
    var state = sched.getState(task);


    var updateButton = $("<button id='event-edit-update' class='btn btn-primary'/>");
    var cancelEditMode = $("<span class='cancel-edit-mode link'>Cancel</span>");

    /* TITLE */
    var title = $("<div class='meeting-detail-row'/>")
      .appendTo(view);

    var titleEditTitle = $("<div id='calendar-title' class='meeting-detail-label'/>")
      .text("TITLE")
      .appendTo(title);

    var titleEditBox = $("<div class='meeting-detail'/>")
      .appendTo(title);
    var titleEdit = $("<input type='text' class='form-control'/>")
      .val(state.calendar_event_title.title_text)
      .on("input", function() {
        enableEventEditSave(task, titleEdit, updateButton)
      })
      .appendTo(titleEditBox);

    /* LOCATION */
    var location = $("<div class='meeting-detail-row'/>")
      .appendTo(view);

    var locEditTitle = $("<div id='calendar-title' class='meeting-detail-label'/>")
      .text("LOCATION")
      .appendTo(location);

    var locEditBox = $("<div class='meeting-detail'/>")
      .appendTo(location);
    var locEdit = $("<input type='text' class='form-control' disabled/>")
      .val("COMING SOON")
      .on("input", function() {
        enableEventEditSave(task, titleEdit, updateButton)
      })
      .appendTo(locEditBox);

    /* NOTES */
    var notes = $("<div class='meeting-detail-row'/>")
      .appendTo(view);

    var notesEditTitle = $("<div class='meeting-detail-label'/>")
      .text("NOTES")
      .appendTo(notes);

    var notesEditorPublic = $("<div class='notes-editor-public'/>");
    var notesBoxPublic = $("<textarea class='notes-entry'></textarea>")
      .val(state.public_notes)
      .on("input", function() {
        enableEventEditSave(task, titleEdit, updateButton)
      })
      .appendTo(notesEditorPublic);
    var publicEye = $("<img class='viewable-by-eye'/>");
    svg.loadImg(publicEye, "/assets/img/eye.svg");
    var publicText = $("<span class='viewable-by-text'/>")
      .text("ALL GUESTS");
    var notesLabelPublic = $("<div class='viewable-by-label'/>")
      .append(publicEye)
      .append(publicText)
      .appendTo(notesEditorPublic);

    var hostName = profile.firstName(profs[login.leader()].prof);
    var notesEditorPrivate = $("<div class='notes-editor-private'/>");
    var notesBoxPrivate = $("<textarea class='notes-entry'></textarea>")
      .val(state.private_notes)
      .on("input", function() {
        enableEventEditSave(task, titleEdit, updateButton)
      })
      .appendTo(notesEditorPrivate);
    var privateEye = $("<img class='viewable-by-eye'/>");
    svg.loadImg(privateEye, "/assets/img/eye.svg");
    var privateText = $("<span class='viewable-by-text'/>")
      .text(hostName.toUpperCase() + " ONLY");
    var notesLabelPrivate = $("<div class='viewable-by-label'/>")
      .append(privateEye)
      .append(privateText)
      .appendTo(notesEditorPrivate);

    var addPrivateNotes = $("<span class='add-private-notes link'/>")
      .text("Add private notes for " + hostName + " only")
      .click(function() {
        addPrivateNotes.addClass("hide");
        notesEditorPrivate.removeClass("hide");
      });
    if (notesBoxPrivate.val() === "") {
      notesEditorPrivate.addClass("hide");
    } else {
      addPrivateNotes.addClass("hide");
    }

    var notesEditor = $("<div class='meeting-detail'/>")
      .append(notesEditorPublic)
      .append(notesEditorPrivate)
      .append(addPrivateNotes)
      .appendTo(notes);

    function toggleEditMode() {
      if (summary.hasClass("hide")) {
        summary.removeClass("hide");
        view.addClass("hide");
      } else {
        summary.addClass("hide");
        view.removeClass("hide");
      }
    }

    var editActions = $("<div id='edit-meeting-actions' class='clearfix'/>").appendTo(view);
    updateButton
      .addClass("disabled")
      .text("Update calendar")
      .click(function() {
        updateCalendarEvent({
          "task": task,
          "titleEdit": titleEdit,
          "notesBoxPublic": notesBoxPublic,
          "notesBoxPrivate": notesBoxPrivate,
          "updateButton": updateButton
        })
      })
      .appendTo(editActions);
    cancelEditMode
      .click(toggleEditMode)
      .appendTo(editActions);

    return view;
  }

  function createReviewSection(profs, task) {
    var view = $("<div/>");
    var module = $("<div id='edit-meeting-div' class='sched-module'/>")
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
      .text("Review meeting details")
      .appendTo(header);

    var content = $("<div id='meeting-content' class='hide'/>")
      .appendTo(module);
    var summary = $("<div id='meeting-summary'/>")
      .appendTo(content);

    var edit = $("<button type='button' class='btn btn-default edit-meeting-btn'>Edit</button>");
    var editDetails = $("<li class='edit-details'><a>Edit details</a></li>");
    var reschedule = $("<li><a id='reschedule-meeting'>Reschedule</a></li>");
    var cancel = $("<li><a id='cancel-meeting'>Cancel & archive</a></li>");
    var editButton = $("<div class='btn-group edit-meeting'/>")
      .append(edit)
      .append($("<button type='button' class='btn btn-default dropdown-toggle' data-toggle='dropdown'/>")
        .append($("<span class='caret'/>"))
        .append($("<span class='sr-only'>Toggle Dropdown</span>")))
      .append($("<ul class='dropdown-menu pull-right edit-guest-dropdown' role='menu'/>")
        .append(editDetails)
        .append(reschedule)
        .append(cancel))
      .appendTo(summary);

    var details = $("<tr/>")
      .appendTo(summary);
    var state = sched.getState(task);
    var choice = state.reserved;
    var typ = sched.meetingType(state);
    var hideEndTime = state.hide_end_times;
    var info = sched.viewOfOption(choice, typ, hideEndTime)
      .attr("id","meeting-details")
      .appendTo(summary);

    var editMode = createEditMode(profs, task, summary)
      .appendTo(content);

    showHide.click(function() {
      if (content.hasClass("hide")) {
        header.removeClass("collapsed");
        content.removeClass("hide");
        connector.removeClass("collapsed");
        showHide.text("Hide");
      } else {
        header.addClass("collapsed");
        content.addClass("hide");
        connector.addClass("collapsed");
        showHide.text("Show");
      }
    })

    function toggleEditMode() {
      if (summary.hasClass("hide")) {
        summary.removeClass("hide");
        editMode.addClass("hide");
      } else {
        summary.addClass("hide");
        editMode.removeClass("hide");
      }
    }

    edit.click(toggleEditMode);
    editDetails.click(toggleEditMode);

    return view;
  }


  function createConnector() {
    var connectorBox = $("<div class='connector'/>");
    var connector = $("<img/>")
      .appendTo(connectorBox);
    svg.loadImg(connector, "/assets/img/connector.svg");
    return connectorBox;
  }

  mod.load = function(profs, ta, view) {
    var tid = ta.tid;
    var guests = sched.getAttendingGuests(ta);
    chats = sched.chatsOfTask(ta);

    view
      .append($("<h3>Finalize and confirm the meeting.</h3>"))
      .append(createReviewSection(profs, ta))
      .append(createConfirmSection(profs, ta, guests))
      .append(createReminderSection(profs, ta, guests));

    observable.onTaskParticipantsChanged.observe("step4", function(ta) {
      chats = sched.chatsOfTask(ta);
    });
    /* Task is always saved when remind changes. */
    observable.onSchedulingStepChanging.stopObserve("step");
  };

  return mod;
}());
