/* Scheduling step 3 */

var sched3 = (function() {
  var mod = {};

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

  function updateInviteButton(task, inviteButton) {
    var state = sched.getState(task);
    if (util.isDefined(state.reserved.google_event))
      inviteButton.attr("disabled", true);
  }

  function step3RowViewOfParticipant(chats, profs, task, uid) {
    var view = $("<div class='sched-step3-row'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;

    var state = sched.getState(task);
    var slot = state.reserved.slot;

/*
    $("<button class='btn btn-default'>Edit event details</button>")
      .click(function() {
        editEventDetails(task.tid, chats, uid, obsProf);
      })
      .appendTo(view);
*/

    var confirmModal = $("#sched-confirm-modal");
    function closeConfirmModal() {
      confirmModal.modal("hide");
    }

    $("<button class='btn btn-default'>Send a confirmation message</button>")
      .click(function() {
        preFillConfirmModal(chats, profs, task, slot, uid);
        confirmModal.modal({});
      })
      .appendTo(view);

    $("#sched-confirm-send")
      .click(function() {
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
      });

    var inviteButton =
      $("<button class='btn btn-default'>Send a Calendar Invite</button>");

    /* disable button if invite was already sent */
    updateInviteButton(task, inviteButton);

    inviteButton
      .click(function() {
        /* Warning: currently this writes the event into the host's calendar
           and sends calendar invites to _all_ other participants */
        api.reserveCalendar(task.tid)
          .done(function(eventInfo) {
            api.getTask(task.tid)
              .done(function(updatedTask) {
                task = updatedTask;
                updateInviteButton(updatedTask, inviteButton);
              });
          });
      })
      .appendTo(view);

/*
    $("#sched-confirm-send")
      .click(function(ev) {
          var state = task.task_data[1];
          state.... = ...;
          api.postTask(task)
            .done(function(chat)  {

            }

      )
      } //close the modal
*/
    return view;

  }


  mod.load = function(profs, task, view) {

    var tid = task.tid;
    var chats = sched.chatsOfTask(task);
    sched.forEachParticipant(task, function(uid) {
      if (sched.isGuest(uid)) {
        var rowView =
          step3RowViewOfParticipant(chats, profs, task, uid)
          .appendTo(view);
      }
    });
  };

  return mod;
}());
