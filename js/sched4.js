/* Scheduling step 4 */

var sched4 = (function() {
  var mod = {};

  function getSlot(ta) {
    var state = sched.getState(ta);
    return state.reserved.slot;
  }

  function sentConfirmation(chats, uid) {
    var chat = chats[uid];
    return list.exists(chat.chat_items, function(x) {
      return (x.chat_item_data[0] === "Sched_confirm");
    });
  }

  function sentReminder(chats, uid) {
    var chat = chats[uid];
    return list.exists(chat.chat_items, function(x) {
      return (x.chat_item_data[0] === "Sched_remind");
    });
  }

  function reservedCalendarSlot(task) {
    var state = sched.getState(task);
    return util.isDefined(state.reserved) &&
      util.isDefined(state.reserved.google_event);
  }

  function sentInvitations(task) {
    var state = sched.getState(task);
    return util.isDefined(state.reserved) &&
      util.isDefined(state.reserved.notifs) &&
      state.reserved.notifs.length > 0;
  }

  function formalEmailBody(organizerName, hostName, toName, when, where) {
    return "Dear "+toName+",\n\n"+

    "You are confirmed for a meeting with "+hostName+
    " "+when+" "+where+".\n\n"+

    "If you have any questions/comments, please do not hesitate to reply "+
    "to this e-mail.\n\n"+

    "Regards,\n\n"+

    organizerName+"\n";
  }

  function loadRecipientRow(x, toObsProf) {
    var recipientCheckboxDiv = $("<div class='recipient-checkbox-div'/>")
      .appendTo(x);

    var recipientCheckbox = $("<img class='recipient-checkbox'/>")
      .appendTo(recipientCheckboxDiv);
    svg.loadImg(recipientCheckbox, "/assets/img/checkbox-sm.svg");

    var recipientName = $("<div class='recipient-name' />")
      .append(toObsProf.prof.full_name)
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

  function preFillConfirmModal(chats, profs, ta, toUid) {
    var toObsProf = profs[toUid];
    var slot = getSlot(ta);

    loadConfirmRecipients(toObsProf);

    $("#sched-confirm-subject")
      .val("Re: " + ta.task_status.task_title);

    var organizerName = profs[login.me()].prof.full_name;
    var hostName = profs[login.leader()].prof.full_name;
    var toName = toObsProf.prof.full_name;
    var t1 = date.ofString(slot.start);
    var t2 = date.ofString(slot.end);
    var when =
      $("#sched-availability-message-readonly").hasClass("short") ?
      "on " + date.justStartTime(t1) :
      "on " + date.range(t1, t2);
    var place = slot.location.address;
    if (slot.location.instructions)
      place += " (" + slot.location.instructions + ")";
    var where = "at " + (place == "" ? "a place to be determined" : place);
    var body = formalEmailBody(organizerName, hostName, toName, when, where);
    $("#sched-confirm-message")
      .val(body);
  }

  function refreshReminderMessage(cannedMessages) {
    var conditions = [];
    function add_cond(cond) {
      if (cond.length > 0) {
        conditions.push(cond);
      }
    }
    add_cond($("#sched-reminder-meeting-kind").val());
    add_cond($("#sched-reminder-guest-addr").val());

    var x = list.find(cannedMessages, function(x) {
      return list.diff(x.message_conditions, conditions).length <= 0;
    });
    if (x) {
      $("#sched-reminder-message").val(x.message_text);
    }
  }

  function preFillReminderModal(profs, task, reserved, toUid) {
    var toObsProf = profs[toUid];

    loadReminderRecipients(toObsProf);

    $("#sched-reminder-subject")
      .val("Re: " + task.task_status.task_title);

    if (reserved.reminder_message) {
      $("#sched-reminder-message").val(reserved.reminder_message);
    }

    api.getReminderMessage(task.tid, {guest_name:toObsProf.prof.full_name})
      .done(function(x) {
        if (! reserved.reminder_message) {
          refreshReminderMessage(x);
        }
        $("#sched-reminder-meeting-kind")
          .unbind("change")
          .change(function(){refreshReminderMessage(x);});
        $("#sched-reminder-guest-addr")
          .unbind("change")
          .change(function(){refreshReminderMessage(x);});
      });
  }

  function editEventDetails(tid, chats, uid) {
    /* This function doesn't do anything right now,
      but it should be a function accessed on click (or automatically popped).
      It should accomplish the following:
      1. Auto-filling event details
      2. Allowing editing of event details */
  }

  function updateInviteAction(task, inviteAction) {
    var state = sched.getState(task);
    if (util.isDefined(state.reserved.google_event))
      inviteAction.attr("disabled", true);
  }

  function markChecked(elt) {
    elt.addClass("checked"); // does not work on SVG elements
  }

  function step4RowViewOfParticipant(chats, profs, task, uid) {
    var view = $("<div/>");
    var divDetails = $("<div class='final-sched-div clearfix'>");
    var divConfirmation = $("<div class='final-sched-div clearfix'>");
    var divInvitation = $("<div class='final-sched-div clearfix'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;

    var state = sched.getState(task);
    var slot = state.reserved.slot;

    /*** Edit event details ***/

    // $("<a class='final-sched-actions'>Edit event details</a>")
    //   .click(function() {
    //     editEventDetails(task.tid, chats, uid, obsProf);
    //   })
    //   .appendTo(divDetails);

    // var checkDetails = $("<img class='check'/>");
    // svg.loadImg(checkDetails, "/assets/img/check.svg");
    // checkDetails.appendTo(divDetails);
    // $("<a class='final-sched-action'>Edit event details</a>").appendTo(divDetails);

    /*** Send a confirmation ***/

        /* OLD VERSION REMOVED */

    /*** Reserve event in Google Calendar, maybe send invitations ***/

    var divInvitationCheck = $("<div class='check-div col-xs-1'>")
      .appendTo(divInvitation);
    var checkInvitation = $("<img class='check'/>");
    if (sentInvitations(task))
      markChecked(divInvitationCheck);
    checkInvitation.appendTo(divInvitationCheck);
    svg.loadImg(checkInvitation, "/assets/img/check.svg")
      .then(function(elt) { checkInvitation = elt; });

    var divInviteAction = $("<div class='col-xs-11'/>");
    var inviteAction = $("<a class='final-sched-action'/>")
      .text("Send Google Calendar invitations");

    /* disable button if invite was already sent */
    updateInviteAction(task, inviteAction);

    var wasInviteSent = function(uid) {
      if (sentInvitations(task)) {
        var notifs = state.reserved.notifs;
        for (var i = 0; i < notifs.length; i++) {
          if (state.reserved.notifs[i].participant === uid) return true;
        }
      }
      return false;
    };

    var divParticipantCheckboxes = $("<div/>");
    var otherEmailInput;
    $("<span/>").text("Invite: ").appendTo(divParticipantCheckboxes);
    var participantCheckboxes = [];
    var leader = login.leader();
    profile.mget(task.task_participants.organized_for)
      .done(function(participants) {
        list.iter(participants, function(profile) {
          var prof = profile.prof;
          var uid = prof.profile_uid;
          if (uid !== leader) {
            var name = "sched-step4-invite-" + uid;
            $("<label/>", {
              "for": name,
              "class": "checkbox-inline"
            })
              .text(prof.full_name)
              .appendTo(divParticipantCheckboxes);
            var checkbox = $("<input/>", {
              "type": "checkbox",
              name: name,
              checked: wasInviteSent(uid)
            })
              .data("uid", uid)
              .appendTo(divParticipantCheckboxes);
            participantCheckboxes.push(checkbox);
          }
        });
        $("<label for='sched-step4-invite-custom' class='checkbox-inline'/>")
          .text("Other Email: ")
          .appendTo(divParticipantCheckboxes);
        otherEmailInput =
          $("<input type='text' name='sched-step4-invite-custom'/>")
            .appendTo(divParticipantCheckboxes);
      });


    inviteAction
      .click(function() {
        /* This writes the event into the host's calendar
           and sends calendar invites to selected participants */
        var participantsToNotify = [];
        list.iter(participantCheckboxes, function(checkbox) {
          if (checkbox.is(":checked")) {
            participantsToNotify.push(checkbox.data("uid"));
          }
        });
        // TODO Email address validation, allow multiple inputs
        var otherEmail = otherEmailInput.val();
        // This is probably not the best way to accomplish what I want...
        var deferredUid =
          otherEmail ?
          api.getProfileByEmail(otherEmail) :
          deferred.defer(null);
        deferredUid.done(function(prof) {
          if (prof && prof !== null) {
            participantsToNotify.push(prof.profile_uid);
          }
          api.reserveCalendar(task.tid, { notified: participantsToNotify })
            .done(function(eventInfo) {
              api.getTask(task.tid)
                .done(function(updatedTask) {
                  updateInviteAction(updatedTask, inviteAction);
                  markChecked(divInvitationCheck);
                });
            });
        });
      })
      .appendTo(divInviteAction);

    divParticipantCheckboxes.appendTo(divInviteAction);
    divInviteAction.appendTo(divInvitation);

    // divDetails.appendTo(view);
    divConfirmation.appendTo(view);
    divInvitation.appendTo(view);

    return {
      view: view
    };
  }

  /*** Reminders (same message sent to everyone) ***/

  function createReminderSelector(chats, profs, task, uid) {
    var sel;
    var reserved = sched.getState(task).reserved;

    var reminderModal = $("#sched-reminder-modal");
    function closeReminderModal() {
      reserved.reminder_message = $("#sched-reminder-message").val();
      api.postTask(task);
      reminderModal.modal("hide");
    }

    function composeReminderEmail() {
      preFillReminderModal(profs, task, reserved, uid);
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
    // if (! util.isDefined(initVal))
    //   key = "no";
    // else if (initVal < 24 * 3600 + 0.5)
    //   key = "24h";
    // else if (initVal < 36 * 3600 + 0.5)
    //   key = "36h";
    // else
    //   key = "48h";
    sel.set(key);

    var divReminder = $("<div class='final-sched-div clearfix'>");

    var divReminderCheck = $("<div class='check-div col-xs-1'>")
      .appendTo(divReminder);
    var checkReminder = $("<img class='check'/>");
    if (sentReminder(chats, uid))
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
    $("<h3 class='final-sched-text'>Send a reminder</h3>")
      .appendTo(divReminderInstr);
    divReminderInstr
      .append(sel.view)
      .append(previewLink);

    return divReminder;
  }

  function createConfirmRow(chats, profs, ta, uid) {
    var view = $("<div class='sched-step4-row container clickable'/>");

    var divConfirmationCheck = $("<div class='check-div'/>");
    var checkConfirmation = $("<img class='check'/>");
    if (sentConfirmation(chats, uid))
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

    view
      .append(divConfirmationCheck)
      .append(circView)
      .append(nameView)
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
      preFillConfirmModal(chats, profs, ta, uid);
      setupSendButton();
      confirmModal.modal({});
    }

    return {
      view: view,
      composeConfirmationEmail: composeConfirmationEmail
    };
  }

  function createConfirmSection(chats, profs, ta, guests) {
    var view = $("<div class='final-sched-div clearfix'>");

    var title = guests.length > 1 ?
      "Send confirmation messages." :
      "Send a confirmation message.";
    $("<h3 class='final-sched-text'/>")
      .text(title)
      .appendTo(view);

    list.iter(guests, function(uid) {
      var x = createConfirmRow(chats, profs, ta, uid);
      x.view
        .appendTo(view);

      if (guests.length == 1) {
        var uid = guests[0];
        if (! sentConfirmation(chats, uid))
          x.composeConfirmationEmail();
      }
    });

    return view;
  }

  function createInviteSection(guests) {
    var view = $("<div class='final-sched-div clearfix'/>");

    var title = guests.length > 1 ?
      "Send Google Calendar invitations." :
      "Send a Google Calendar invitation.";
    $("<h3 class='final-sched-text'/>")
      .text(title)
      .appendTo(view);

    list.iter(guests, function(uid) {
    });
    return view;
  }

  function createRemindSection(guests) {
    var view = $("<div class='final-sched-div clearfix'/>");

    var title = guests.length > 1 ?
      "Send reminders." :
      "Send a reminder.";
    $("<h3 class='final-sched-text'/>")
      .text(title)
      .appendTo(view);

    list.iter(guests, function(uid) {
    });
    return view;
  }

  mod.load = function(profs, ta, view) {
    var tid = ta.tid;
    var chats = sched.chatsOfTask(ta);
    var guests = sched.getGuests(ta);

    view
      .append(createConfirmSection(chats, profs, ta, guests))
      .append(createInviteSection(guests))
      .append(createRemindSection(guests));

    var numGuests = guests.length;
    list.iter(guests, function(uid) {
      var x = step4RowViewOfParticipant(chats, profs, ta, uid);
      view.append(x.view);
      var reminderSelector =
        createReminderSelector(chats, profs, ta, uid).appendTo(view);
    });
    // Task is always saved when remind changes.
    task.onSchedulingStepChanging.stopObserve("step");
  };

  return mod;
}());
