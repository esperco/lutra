/* Scheduling step 4 */

var sched4 = (function() {
  var mod = {};

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

  function sentInvitations(task) {
    var state = sched.getState(task);
    return util.isDefined(state.reserved) && util.isDefined(state.reserved.google_event);
  }

  function formalEmailBody(organizerName, hostName, toName, when, where) {
    return "Dear "+toName+",\n\n"+

    "You are confirmed for a meeting with "+hostName+
    " "+when+" "+where+".\n\n"+

    "If you have any questions/comments, please do not hesitate to reply "+
    "to this e-mail.\n\n"+

    "Best,\n\n"+

    organizerName+"\n";
  }

  function preFillConfirmModal(chats, profs, task, slot, toUid) {
    var toObsProf = profs[toUid];

    $("#sched-confirm-to")
      .val(toObsProf.prof.full_name);

    $("#sched-confirm-subject")
      .val("Re: " + task.task_status.task_title);

    var organizerName = profs[login.me()].prof.full_name;
    var hostName = profs[login.leader()].prof.full_name;
    var toName = toObsProf.prof.full_name;
    var t1 = date.ofString(slot.start);
    var t2 = date.ofString(slot.end);
    var when = "on " + date.range(t1, t2);
    var where = "at " + slot.location.title;
    var body = formalEmailBody(organizerName, hostName, toName, when, where);
    $("#sched-confirm-message")
      .val(body);
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
    elt.addClass("checked");
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

    /* Edit event details */

    // $("<a class='final-sched-actions'>Edit event details</a>")
    //   .click(function() {
    //     editEventDetails(task.tid, chats, uid, obsProf);
    //   })
    //   .appendTo(divDetails);
    
    // var checkDetails = $("<img class='check'/>");
    // svg.loadImg(checkDetails, "/assets/img/check.svg");
    // checkDetails.appendTo(divDetails);
    // $("<a class='final-sched-action'>Edit event details</a>").appendTo(divDetails);

    /* Send a confirmation */

    var divConfirmationCheck = $("<div class='check-div col-xs-1'>")
      .appendTo(divConfirmation);
    var checkConfirmation = $("<img class='check'/>");
    svg.loadImg(checkConfirmation, "/assets/img/check.svg");
    if (sentConfirmation(chats, uid))
      markChecked(checkConfirmation);
    checkConfirmation.appendTo(divConfirmationCheck);

    var confirmModal = $("#sched-confirm-modal");
    function closeConfirmModal() {
      confirmModal.modal("hide");
    }

    $("<a class='final-sched-action col-xs-11'>Send a confirmation message</a>")
      .unbind('click')
      .click(function() {
        preFillConfirmModal(chats, profs, task, slot, uid);
        confirmModal.modal({});
      })
      .appendTo(divConfirmation);

    var sendButton = $("#sched-confirm-send");
    sendButton
      .removeClass("disabled")
      .unbind('click')
      .click(function() {
        if (! sendButton.hasClass("disabled")) {
          sendButton.addClass("disabled");
          var body = $("#sched-confirm-message").val();
          var chatid = chats[uid].chatid;
          var chatItem = {
            chatid: chatid,
            by: login.me(),
            'for': login.leader(),
            team: login.team().teamid,
            chat_item_data: ["Sched_confirm", {
              body: body,
              'final': slot
            }]
          };
          api.postChatItem(chatItem)
            .done(closeConfirmModal);
        }
      });

    /* Send a Google Calendar invitation */

    var divInvitationCheck = $("<div class='check-div col-xs-1'>")
      .appendTo(divInvitation);
    var checkInvitation = $("<img class='check'/>");
    svg.loadImg(checkInvitation, "/assets/img/check.svg");
    if (sentInvitations(task))
      markChecked(checkInvitation);
    checkInvitation.appendTo(divInvitationCheck);

    var inviteAction = $("<a class='final-sched-action col-xs-11'/>")
      .text("Send a Google Calendar invitation");

    /* disable button if invite was already sent */
    updateInviteAction(task, inviteAction);

    inviteAction
      .click(function() {
        /* Warning: currently this writes the event into the host's calendar
           and sends calendar invites to _all_ other participants */
        api.reserveCalendar(task.tid)
          .done(function(eventInfo) {
            api.getTask(task.tid)
              .done(function(updatedTask) {
                task = updatedTask;
                updateInviteAction(updatedTask, inviteAction);
              });
          });
      })
      .appendTo(divInvitation);

    // divDetails.appendTo(view);
    divConfirmation.appendTo(view);
    divInvitation.appendTo(view);

    return view;
  }

  function createReminderSelector(chats, task, uid) {
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
    var key = "24h";
    if (! util.isDefined(initVal))
      key = "no";
    else if (initVal < 100000)
      key = "24h";
    else
      key = "48h";
    sel.set(key);

    var divReminder = $("<div class='final-sched-div clearfix'>");

    var divReminderCheck = $("<div class='check-div col-xs-1'>")
      .appendTo(divReminder);
    var checkReminder = $("<img class='check'/>");
    svg.loadImg(checkReminder, "/assets/img/check.svg");
    if (sentReminder(chats, uid))
      markChecked(checkReminder);
    checkReminder.appendTo(divReminderCheck);

    var divReminderInstr = $("<div class='instr-div col-xs-11'>")
      .appendTo(divReminder);
    $("<h3 class='final-sched-text'>Send a reminder</h3>")
      .appendTo(divReminderInstr);
    divReminderInstr.append(sel.view);

    return divReminder;
  }

  mod.load = function(profs, task, view) {

    var tid = task.tid;
    var chats = sched.chatsOfTask(task);
    sched.forEachParticipant(task, function(uid) {
      if (sched.isGuest(uid)) {
        var rowView =
          step4RowViewOfParticipant(chats, profs, task, uid)
          .appendTo(view);
        var reminderSelector = createReminderSelector(chats, task, uid).appendTo(view);
      }
    })
  };

  return mod;
}());
