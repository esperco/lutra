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

    $("#sched-confirm-guest-addr").val("Address_directly");
    var parameters = {
      template_kind: "Confirmation_to_guest",
      exec_name: hostName,
      guest_name: toName,
      meet_date: date.dateOnly(t1),
      meet_time: (
        ta.task_data[1].hide_end_times ?
        date.timeOnly(t1) :
        date.timeOnly(t1) + " to " + date.timeOnly(t2)
      )
    };
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
      template_kind: "Reminder_to_guest",
      guest_name: $(".recipient-name").first().text()
    };
    $("#sched-reminder-guest-addr").val("Address_directly");
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

  function editEventDetails(tid, uid) {
    /* This function doesn't do anything right now,
      but it should be a function accessed on click (or automatically popped).
      It should accomplish the following:
      1. Auto-filling event details
      2. Allowing editing of event details */
  }

  function markChecked(elt) {
    elt.addClass("checked"); // does not work on SVG elements
  }

  function createConfirmRow(profs, ta, uid) {
    var view = $("<div class='sched-step4-row container clickable'/>");

    var divConfirmationCheck = $("<div class='check-div col-xs-1'/>");
    var checkConfirmation = $("<img class='check'/>");
    if (sentConfirmation(uid))
      markChecked(divConfirmationCheck);

    checkConfirmation.appendTo(divConfirmationCheck);
    svg.loadImg(checkConfirmation, "/assets/img/check.svg")
      .then(function(elt) { checkConfirmation = elt; });

    var confirmModal = $("#sched-confirm-modal");
    function closeConfirmModal() {
      confirmModal.modal("hide");
    }

    var prof = profs[uid].prof;
    var circView = profile.viewMediumCirc(prof);
    var nameView = profile.viewMediumFullName(prof);
    var divGuest = $("<div class='col-xs-11'/>")
      .append(circView)
      .append(nameView);

    view
      .append(divConfirmationCheck)
      .append(divGuest)
      .click(composeConfirmationEmail);

    function setupSendButton() {
      var sendButton = $("#sched-confirm-send");
      sendButton
        .removeClass("disabled")
        .unbind('click')
        .click(function() {
          if (! sendButton.hasClass("disabled")) {
            sendButton.addClass("disabled");
            var body = $("#sched-confirm-message").val();
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
                markChecked(divConfirmationCheck);
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

    var title = guests.length > 1 ?
      "Send confirmation messages." :
      "Send a confirmation message.";
    $("<h3 class='final-sched-text'/>")
      .text(title)
      .appendTo(view);

    list.iter(guests, function(uid) {
      var x = createConfirmRow(profs, ta, uid);
      x.view
        .appendTo(view);

      if (guests.length == 1) {
        var uid = guests[0];
        if (! sentConfirmation(uid))
          x.composeConfirmationEmail();
      }
    });

    return view;
  }

  function sentInvite(ta, uid) {
    var state = sched.getState(ta);
    return list.exists(state.reserved.notifs, function(notif) {
      return uid === notif.participant;
    });
  }

  function createInviteRow(profs, ta, uid) {
    var view = $("<div class='sched-step4-row container clickable'>");

    var divInvitationCheck = $("<div class='check-div col-xs-1'>")
      .appendTo(view);
    var checkInvitation = $("<img class='check'/>");
    checkInvitation.appendTo(divInvitationCheck);
    svg.loadImg(checkInvitation, "/assets/img/check.svg")
      .then(function(elt) { checkInvitation = elt; });

    function updateInviteAction(ta) {
      if (sentInvite(ta, uid)) {
        markChecked(divInvitationCheck);
      }
    }

    updateInviteAction(ta);

    var prof = profs[uid].prof;
    var circView = profile.viewMediumCirc(prof);
    var nameView = profile.viewMediumFullName(prof);
    var divGuest = $("<div class='col-xs-11'/>")
      .append(circView)
      .append(nameView);

    function sendGoogleInvite() {
      api.reserveCalendar(ta.tid, { notified: [uid] })
        .done(function(eventInfo) {
          api.getTask(ta.tid)
            .done(function(updatedTask) {
              updateInviteAction(updatedTask);
            });
        });
    }

    view
      .append(divInvitationCheck)
      .append(divGuest)
      .click(sendGoogleInvite);

    return view;
  }

  function createReminderSelector(profs, task, guests) {
    var sel;
    var reserved = sched.getState(task).reserved;

    var reminderModal = $("#sched-reminder-modal");
    function closeReminderModal() {
      reserved.reminder_message = $("#sched-reminder-message").val();
      api.postTask(task);
      reminderModal.modal("hide");
    }

    function composeReminderEmail() {
      preFillReminderModal(profs, task, reserved, guests);
      reminderModal.modal({});
    }

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

    var divReminder = $("<div class='final-sched-div'>");

    var divReminderCheck = $("<div class='check-div col-xs-1'>")
      .appendTo(divReminder);
    var checkReminder = $("<img class='check'/>");
    if (sentReminder(guests[0] /* unclean; assumes all the guests
                                  receive the same reminder at the
                                  same time */))
      markChecked(divReminderCheck);
    checkReminder.appendTo(divReminderCheck);
    svg.loadImg(checkReminder, "/assets/img/check.svg")
      .then(function(elt) { checkReminder = elt; });

    var previewLink = $("<button class='btn btn-primary'>Preview</button>")
      .unbind('click')
      .click(function() {
        composeReminderEmail();
      });

    var okButton = $("#sched-reminder-update");
    okButton
      .unbind('click')
      .click(closeReminderModal);

    var divReminderInstr = $("<div class='instr-div col-xs-11'>")
      .appendTo(divReminder);
    divReminderInstr
      .append(sel.view)
      .append(previewLink);

    return divReminder;
  }

  function createInviteSection(profs, ta, guests) {
    var view = $("<div class='final-sched-div'/>");

    var title = guests.length > 1 ?
      "Send Google Calendar invitations." :
      "Send a Google Calendar invitation.";
    $("<h3 class='final-sched-text'/>")
      .text(title)
      .appendTo(view);

    list.iter(guests, function(uid) {
      createInviteRow(profs, ta, uid)
        .appendTo(view);
    });
    return view;
  }

  function createRemindSection(profs, task, guests) {
    var view = $("<div class='final-sched-div'/>");

    var title = guests.length > 1 ?
      "Send reminders." :
      "Send a reminder.";
    $("<h3 class='final-sched-text'/>")
      .text(title)
      .appendTo(view);

    createReminderSelector(profs, task, guests)
      .appendTo(view);

    return view;
  }

  mod.load = function(profs, ta, view) {
    var tid = ta.tid;
    var guests = sched.getGuests(ta);
    chats = sched.chatsOfTask(ta);

    view
      .append(createConfirmSection(profs, ta, guests))
      .append(createInviteSection(profs, ta, guests))
      .append(createRemindSection(profs, ta, guests));

    task.onTaskParticipantsChanged.observe("step4", function(ta) {
      chats = sched.chatsOfTask(ta);
    });
    /* Task is always saved when remind changes. */
    task.onSchedulingStepChanging.stopObserve("step");
  };

  return mod;
}());
