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

  function loadReminderRecipients(toObsProf) {
    $("#sched-reminder-to-list").children().remove();

    var recipientRow = $("<div class='sched-reminder-to checkbox-selected'/>")
      .appendTo($("#sched-reminder-to-list"));

    loadRecipientRow(recipientRow, toObsProf);
  }

  function loadConfirmRecipients(toObsProf) {
    $("#sched-confirm-to-list").children().remove();

    var recipientRow = $("<div class='sched-confirm-to checkbox-selected'/>")
      .appendTo($("#sched-confirm-to-list"));

    loadRecipientRow(recipientRow, toObsProf);
  }

  function preFillConfirmModal(profs, ta, toUid) {
    var ea = sched.assistedBy(toUid, sched.getGuestOptions(ta));
    var toObsProf = util.isNotNull(ea) ? profs[ea] : profs[toUid];
    var slot = getSlot(ta);

    loadConfirmRecipients(toObsProf);

    $("#sched-confirm-subject")
      .val("Re: " + ta.task_status.task_title);

    var organizerName = profile.fullName(profs[login.me()].prof);
    var hostName = profile.fullName(profs[login.leader()].prof);
    var toName = profile.fullName(profs[toUid].prof);
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

    if (util.isNotNull(ea)) {
      parameters.guest_EA = profile.fullName(profs[ea].prof);
      $("#sched-confirm-guest-addr").val("Address_to_assistant");
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_confirmation_to_guest_assistant";
      } else {
        parameters.template_kind = "Confirmation_to_guest_assistant";
      }
    } else {
      $("#sched-confirm-guest-addr").val("Address_directly");
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_confirmation_to_guest";
      } else {
        parameters.template_kind = "Confirmation_to_guest";
      }
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
          .change(function() {
            refreshConfirmationMessage(ta.tid, parameters, slot);
          });
    });
  }

  function refreshConfirmationMessage(tid, parameters, slot) {
    if ($("#sched-confirm-guest-addr").val() === "Address_directly") {
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_confirmation_to_guest";
      } else {
        parameters.template_kind = "Confirmation_to_guest";
      }
    } else {
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_confirmation_to_guest_assistant";
      } else {
        parameters.template_kind = "Confirmation_to_guest_assistant";
      }
    }
    api.getConfirmationMessage(tid, parameters)
      .done(function(x) {
        $("#sched-confirm-message").val(x.message_text);
      });
  }

  function refreshReminderMessage(tid, parameters, slot) {
    if ($("#sched-reminder-guest-addr").val() === "Address_directly") {
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_reminder_to_guest";
      } else {
        parameters.template_kind = "Reminder_to_guest";
      }
    } else {
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_reminder_to_guest_assistant";
      } else {
        parameters.template_kind = "Reminder_to_guest_assistant";
      }
    }
    api.getReminderMessage(tid, parameters)
      .done(function(x) {
        $("#sched-reminder-message").val(x.message_text);
      });
  }

  function preFillReminderModal(profs, ta, options, toUid) {
    var ea = sched.assistedBy(toUid, sched.getGuestOptions(ta));
    var toObsProf = util.isNotNull(ea) ? profs[ea] : profs[toUid];
    var slot = getSlot(ta);

    loadReminderRecipients(toObsProf);

    $("#sched-reminder-subject")
      .val("Re: " + ta.task_status.task_title);

    if (options.reminder_message) {
      $("#sched-reminder-message").val(options.reminder_message);
    }

    var parameters = {
      guest_name: profile.fullName(profs[toUid].prof),
      guest_uid: toUid
    };
    var ea = sched.assistedBy(toUid, sched.getGuestOptions(ta));
    if (util.isNotNull(ea)) {
      parameters.guest_EA = profile.fullName(profs[ea].prof);
      $("#sched-reminder-guest-addr").val("Address_to_assistant");
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_reminder_to_guest_assistant";
      } else {
        parameters.template_kind = "Reminder_to_guest_assistant";
      }
    } else {
      $("#sched-reminder-guest-addr").val("Address_directly");
      if (slot.meeting_type === "Call") {
        parameters.template_kind = "Phone_reminder_to_guest";
      } else {
        parameters.template_kind = "Reminder_to_guest";
      }
    }
    api.getReminderMessage(ta.tid, parameters)
      .done(function(x) {
        if (! options.reminder_message) {
          $("#sched-reminder-message").val(x.message_text);
        }
        $("#sched-reminder-guest-addr")
          .unbind("change")
          .change(function() {
            refreshReminderMessage(ta.tid, parameters, slot);
          });
      });
  }


  /* REMINDERS */

  function closeReminderModal(ta, options, uid, reminderModal) {
    var state = sched.getState(ta);
    options.reminder_message = $("#sched-reminder-message").val();
    state.participant_options =
      list.replace(state.participant_options, options, function(x) {
        return x.uid === options.uid;
      });
    api.postTask(ta);
    reminderModal.modal("hide");
  }

  function getReminderStatus(ta) {
    var startTime = date.ofString(getSlot(ta).start);
    var beforeSecs = sched.getState(ta).reserved.remind;
    if (util.isNotNull(beforeSecs)) {
      startTime.setSeconds(startTime.getSeconds() - beforeSecs);
      return "Will receive a reminder on " + date.justStartTime(startTime);
    } else {
      return "Not scheduled to receive a reminder";
    }
  }

  function createReminderRow(profs, ta, uid, guests) {
'''
<div #view
     class="sched-step4-row">
  <div #edit
       class="btn edit-reminder-btn">
</div>
'''
    var prof = profs[uid].prof;

    var editIcon = $("<img class='edit-reminder-icon'/>")
      .appendTo(edit);
    svg.loadImg(editIcon, "/assets/img/edit.svg");
    edit.append($("<span class='edit-reminder-text'/>")
          .text("Edit draft"));

    var chatHead = profile.viewMediumCirc(prof)
      .addClass("list-prof-circ")
      .appendTo(view);

    if (sentReminder(ta, uid)) {
      chatHead.addClass("sent");
      edit.addClass("btn-default disabled");
      editIcon.addClass("sent");
    } else {
      chatHead.addClass("not-sent");
      edit.addClass("btn-primary");
      editIcon.addClass("not-sent");
    }

    var guestName = profile.viewMediumFullName(prof)
      .addClass("reminder-guest-name")
      .appendTo(view);

    var guestStatusText = sentReminder(ta, uid) ?
      "Reminder sent" :
      getReminderStatus(ta);
    var guestStatus = $("<div class='reminder-guest-status'/>")
      .text(guestStatusText)
      .appendTo(view);

    var reminderModal = $("#sched-reminder-modal");
    var state = sched.getState(ta);
    var options = sched.getGuestOptions(ta)[uid];

    edit.click(function() {
      preFillReminderModal(profs, ta, options, uid);

      var okButton = $("#sched-reminder-update");
      okButton
        .off("click")
        .click(function() {
          closeReminderModal(ta, options, uid, reminderModal)
        });

      reminderModal.modal({});
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
      list.iter(statuses, function(statusText) {
        statusText.text(getReminderStatus(task));
      });
      api.postTask(task);
    }

    sel = select.create({
      buttonClass: "reminder-dropdown",
      defaultAction: saveTask,
      options: [
        { label: "1 hour beforehand", key: "1h", value: 3600 },
        { label: "3 hours beforehand", key: "3h", value: 3 * 3600 },
        { label: "6 hours beforehand", key: "6h", value: 6 * 3600 },
        { label: "12 hours beforehand", key: "12h", value: 12 * 3600 },
        { label: "24 hours beforehand", key: "24h", value: 24 * 3600 },
        { label: "36 hours beforehand", key: "36h", value: 36 * 3600 },
        { label: "48 hours beforehand", key: "48h", value: 48 * 3600 },
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
<div #view>
  <div #module
       class="sched-module">
    <div #header
         id="reminder-header"
         class="sched-module-header collapsed">
      <span #showHide
            id="reminder-show-hide"
            class="show-hide link">
        Show
      </span>
      <img class="sched-module-icon"
           src="/assets/img/reminder.svg"/>
      <div #headerTitle
           class="sched-module-title"/>
    </div>
    <div #scheduler
         id="reminder-scheduler"
         class="hide">
      <span #schedulerTitle/>
    </div>
    <div #content
         id="reminder-content"
         class="hide"/>
  </div>
</div>
'''
    var headerText = guests.length > 1 ?
      "Schedule a reminder for guests" :
      "Schedule a reminder";
    headerTitle.text(headerText);

    var schedulerText = guests.length > 1 ?
      "Send reminders" :
      "Send the reminder";
    schedulerTitle.text(schedulerText);

    var reminderSent = false;
    var statuses = [];
    list.iter(guests, function(uid) {
      var reminderRow = createReminderRow(profs, task, uid, guests);
      content.append(reminderRow.row);
      statuses.push(reminderRow.statusText);
      if (sentReminder(task, uid))
        reminderSent = true;
    });

    scheduler.append(createReminderScheduler(profs, task, guests, statuses));

    showHide.click(function() {
      toggleModule("reminder");
    })

    return view;
  }


  /* CONFIRMATION */

  function createConfirmRow(profs, ta, uid) {
'''
<div #view
     class="sched-step4-row">
  <div #compose
       class="btn compose-confirmation-btn">
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

    var guestName = profile.viewMediumFullName(prof)
      .addClass("confirmation-guest-name")
      .appendTo(view);

    var guestStatusText = sentConfirmation(ta, uid) ?
      "Confirmation sent" :
      "Has not received a confirmation";
    var guestStatus = $("<div class='confirmation-guest-status'/>")
      .text(guestStatusText)
      .appendTo(view);

    compose.click(composeConfirmationEmail);

    var confirmModal = $("#sched-confirm-modal");
    function closeConfirmModal() {
      confirmModal.modal("hide");
    }

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
            var hideEnd = ta.task_data[1].hide_end_times;
            var chatItem = {
              tid: ta.tid,
              by: login.me(),
              to: [uid],
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
'''
<div #view>
  <div #module
       class="sched-module">
    <div #header
         id="confirm-header"
         class="sched-module-header collapsed">
      <span #showHide
            id="confirm-show-hide"
            class="show-hide link">
        Show
      </span>
      <img id="confirm-icon"
           class="sched-module-icon"
           src="/assets/img/confirmation.svg"/>
      <div #headerTitle
           class="sched-module-title"/>
    </div>
    <div #content
         id="confirm-content"
         class="hide"/>
  </div>
</div>
'''
    var connector = createConnector()
      .addClass("collapsed")
      .attr("id","confirm-connector")
      .appendTo(view);

    var headerText = guests.length > 1 ?
      "Send guests a confirmation message" :
      "Send a confirmation message";
    headerTitle.text(headerText);

    list.iter(guests, function(uid) {
      var x = createConfirmRow(profs, ta, uid);
      x.view.appendTo(content);
      // if (guests.length == 1) {
      //   var uid = guests[0];
      //   if (! sentConfirmation(ta, uid))
      //     x.composeConfirmationEmail();
      // }
    });

    showHide.click(function() {
      toggleModule("confirm");
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
    taskState.calendar_event_title.custom = param.titleEdit.val();
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
      .val(sched.getCalendarTitle(state))
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
'''
<div #view>
  <div #module
       id="edit-meeting-div"
       class="sched-module">
    <div #header
         id="review-header"
         class="sched-module-header collapsed">
      <span #showHide
            id="review-show-hide"
            class="show-hide link">
        Show
      </span>
      <img class="sched-module-icon"
           src="/assets/img/calendar.svg"/>
      <div class="sched-module-title">
        Review meeting details
      </div>
    </div>
    <div #content
         id="review-content"
         class="hide">
      <div #summary
           id="meeting-summary">
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
              <a id="cancel-meeting">Cancel & archive</a>
            </li>
          </ul>
        </div>
        <tr #info/>
      </div>
    </div>
  </div>
</div>
'''
    var tid = task.tid;
    var state = sched.getState(task);
    var choice = state.reserved;
    var typ = sched.formatMeetingType(choice.slot);
    var hideEndTime = state.hide_end_times;
    info.append(sched.viewOfOption(choice, typ, hideEndTime));

    var editMode = createEditMode(profs, task, summary)
      .appendTo(content);
    var connector = createConnector()
      .addClass("collapsed")
      .attr("id","review-connector")
      .appendTo(view);

    showHide.click(function() {
      toggleModule("review");
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

    function rescheduleClick() {
      api.cancelCalendar(tid).done(function() {
        task.task_status.task_progress = "Coordinating";
        state.scheduling_stage = "Find_availability";
        state.calendar_options = [];
        delete state.reserved;
        api.postTask(task).done(function() {
          observable.onTaskModified.notify(task);
          sched.loadTask(task);
        });
      });
    }

    function cancelAndArchiveClick() {
      api.cancelCalendar(tid).done(function() {
        task.task_status.task_progress = "Closed";
        delete state.reserved;
        api.postTask(task).done(function() {
          api.archiveTask(tid);
          observable.onTaskArchived.notify(tid);
          page.home.load();
        });
      });
    }

    edit.click(toggleEditMode);
    editDetails.click(toggleEditMode);
    reschedule.click(rescheduleClick);
    cancel.click(cancelAndArchiveClick);

    return view;
  }

  function createConnector() {
    var connectorBox = $("<div class='connector'/>");
    var connector = $("<img/>")
      .appendTo(connectorBox);
    svg.loadImg(connector, "/assets/img/connector.svg");
    return connectorBox;
  }

  function toggleModule(x) {
    var content = $("#" + x + "-content");
    var showHide = $("#" + x + "-show-hide");
    var header = $("#" + x + "-header");
    var connector, scheduler;
    if (x != "reminder")
      connector = $("#" + x + "-connector");
    if (x == "reminder")
      scheduler = $("#" + x + "-scheduler");

    if (content.hasClass("hide")) {
      showHide.text("Hide");
      header.removeClass("collapsed");
      content.removeClass("hide");
      if (connector != null)
        connector.removeClass("collapsed");
      if (scheduler != null)
        scheduler.removeClass("hide");
      hideOthers(x);
    } else {
      showHide.text("Show");
      header.addClass("collapsed");
      content.addClass("hide");
      if (connector != null)
        connector.addClass("collapsed");
      if (scheduler != null)
        scheduler.addClass("hide");
    }

    function hideOthers(x) {
      if ((x != "review") && (! $("#review-content").hasClass("hide")))
        toggleModule("review");
      if ((x != "confirm") && (! $("#confirm-content").hasClass("hide")))
        toggleModule("confirm");
      if ((x != "reminder") && (! $("#reminder-content").hasClass("hide")))
        toggleModule("reminder");
    }
  }

  mod.load = function(profs, ta, view) {
    var tid = ta.tid;
    var guests = sched.getAttendingGuests(ta);

    view
      .append($("<h3>Finalize and confirm the meeting.</h3>"))
      .append(createReviewSection(profs, ta))
      .append(createConfirmSection(profs, ta, guests))
      .append(createReminderSection(profs, ta, guests));

    var confirmationSent = false;
    var reminderSent = false;
    list.iter(guests, function(uid) {
      if (sentConfirmation(ta, uid))
        confirmationSent = true;
      if (sentReminder(ta, uid))
        reminderSent = true;
    });

    if ((reminderSent) || (confirmationSent && !reminderSent)) {
      toggleModule("reminder");
    } else {
      toggleModule("confirm");
    }

    /* Task is always saved when remind changes. */
    observable.onSchedulingStepChanging.stopObserve("step");
  };

  return mod;
}());
