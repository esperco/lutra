/* Scheduling - step 2 */

var sched2 = (function() {
  var mod = {};

  function formalEmailBody(organizerName, hostName, toName, howSoon) {
    return "Dear "+toName+",\n\n"+

    "I'm writing on behalf of "+hostName+" who respectfully requests "+
    "a meeting with you. "+
    hostName+"'s schedule has the below open times "+howSoon+". "+
    "If any of these times are agreeable, please respond to this e-mail "+
    "with your choice.";
  }

  function viewOfOption(profs, calOption) {
    var view = $("<div/>")
      .attr("id", calOption.label);
    sched.viewOfSuggestion(calOption.slot)
      .appendTo(view);
    return view;
  }

  function viewOfOptions(profs, task, onSelect) {
    var view = $("<div/>");
    var state = sched.getState(task);

    var options = state.calendar_options;

    function showOne(id) {
      $("#" + id)
        .addClass("sched-highlight");
    }

    function hideOne(id) {
      $("#" + id)
        .removeClass("sched-highlight");
    }

    var idList = list.map(options, function(x) { return x.label; });
    var selector = show.create(idList, showOne, hideOne);

    list.iter(options, function(x) {
      viewOfOption(profs, x)
        .click(function() {
          selector.show(x.label);
          onSelect(x);
        })
        .appendTo(view);
    });

    return view;
  }

  function updateTask(profs, task, calOption) {
    var state = sched.getState(task);
    task.task_progress = "Confirmed";
    state.scheduling_stage = "Confirm";
    state.reserved = {
      slot: calOption.slot,
      notifs: []
    };
    api.postTask(task)
      .done(function () { sched.loadStep3(profs, task); });
  }

  function textOfHowSoon(x) {
    var days = x / 86400;
    if (days > 9.5)
      return "within two weeks";
    else if (days >= 5.5)
      return "within one week";
    else if (days >= 1.5)
      return "within "+Math.floor(days + 0.5)+" days";
    else
      return "within one day";
  }

  function preFillAvailabilityModal(chats, profs, task,
                                    howSoon, options, toUid) {
    var toObsProf = profs[toUid];

    $("#sched-availability-to")
      .val(toObsProf.prof.full_name);

    $("#sched-availability-subject")
      .val("Re: " + task.task_status.task_title);

    var organizerName = profs[login.me()].prof.full_name;
    var hostName = profs[login.leader()].prof.full_name;
    var toName = toObsProf.prof.full_name;
    var howSoon = textOfHowSoon(howSoon);
    var body = formalEmailBody(organizerName, hostName, toName, howSoon);
    $("#sched-availability-message")
      .val(body);
  }


  function rowViewOfParticipant(chats, profs, task, uid) {
    var view = $("<div class='sched-step2-row'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;

    var state = sched.getState(task);
    var howSoon = state.meeting_request.how_soon;
    var options = state.calendar_options;

    var availabilityModal = $("#sched-availability-modal");
    function closeAvailabilityModal() {
      availabilityModal.modal("hide");
    }

    function composeEmail() {
      preFillAvailabilityModal(chats, profs, task, howSoon, options, uid);
      availabilityModal.modal({});
    }

    $("<button class='btn btn-default'>Ask about availability</button>")
      .click(composeEmail)
      .appendTo(view);

    $("#sched-availability-send")
      .click(function() {
        var body = $("#sched-availability-message").val();
        var chatid = chats[uid].chatid;
        var chatItem = {
          chatid: chatid,
          by: login.me(),
          'for': login.leader(),
          team: login.team().teamid,
          chat_item_data: ["Scheduling_q", {
            body: body,
            choices: options
          }]
        };
        api.postChatItem(chatItem)
          .done(closeAvailabilityModal);
      });

    return { view: view,
             composeEmail: composeEmail };
  }

  mod.load = function(profs, task, view) {
    $("<h3>Select a final time.</h3>")
      .appendTo(view);

    var chats = sched.chatsOfTask(task);
    var radio = $("<object class='esper-radio' data='/assets/img/radio.svg' type='image/svg+xml'></object>");
    var next = $("<button disabled class='btn btn-default'>Next</button>");
    var selected;

    function onSelect(x) {
      selected = x;
      next.attr("disabled", false);
    }

    viewOfOptions(profs, task, onSelect)
      .appendTo(view);

    var guests = sched.getGuests(task);
    var numGuests = guests.length;
    list.iter(guests, function(uid) {
      var x =
        rowViewOfParticipant(chats, profs, task, uid);
      x.view
        .appendTo(view);
      if (numGuests == 1)
        x.composeEmail();
    });

    next
      .appendTo(view)
      .click(function() {
        updateTask(profs, task, selected);
      });
  };

  return mod;
}());
