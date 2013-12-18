/* Scheduling - step 3 */

var sched3 = (function() {
  var mod = {};

  function sentEmail(chats, uid) {
    var chat = chats[uid];
    return list.exists(chat.chat_items, function(x) {
      return (x.chat_item_data[0] === "Scheduling_q");
    });
  }

  function formalEmailBody(organizerName, hostName, toName, howSoon) {
    return "Dear "+toName+",\n\n"+

    "I'm writing on behalf of "+hostName+" who respectfully requests "+
    "a meeting with you. "+
    hostName+"'s schedule has the below open times "+howSoon+". "+
    "If any of these times are agreeable, please respond to this e-mail "+
    "with your choice.";
  }

  function viewOfOption(calOption) {
    var view = $("<div class='suggestion'/>")
      .attr("id", calOption.label);
    var radio = $("<img class='suggestion-radio'/>");
    radio.appendTo(view);
    svg.loadImg(radio, "/assets/img/radio.svg");
    sched.viewOfSuggestion(calOption.slot)
      .appendTo(view);
    return view;
  }

  function viewOfOptions(task, onSelect) {
    var view = $("<div class='options-container'/>");
    var state = sched.getState(task);
    var options = state.calendar_options;

    var idList = list.map(options, function(x) { return x.label; });
    var selector = show.create(idList, {
      onClass: "radio-selected",
      offClass: ""
    });

    list.iter(options, function(x) {
      viewOfOption(x)
        .click(function() {
          selector.show(x.label);
          onSelect(x);
        })
        .appendTo(view);
    });

    return view;
  }

  function emailViewOfOption(calOption, i) {
    return $("<div class='email-option'/>")
      .append($("<div/>").text("Option " + util.letterOfInt(i)))
      .append(sched.viewOfSuggestion(calOption.slot));
  }

  function emailViewOfOptions(options) {
    var view = $("<div class='email-options'/>");
    list.iter(options, function(x, i) {
      emailViewOfOption(x, i)
        .appendTo(view);
    });
    return view;
  }

  function updateTask(profs, ta, calOption) {
    task.dont_change_task_type();

    var state = sched.getState(ta);
    ta.task_status.task_progress = "Confirmed"; // status in the task list
    state.scheduling_stage = "Confirm";           // step in the scheduling page
    state.reserved = {
      slot: calOption.slot,
      remind: 3*43200,
      notifs: []
    };
    api.postTask(ta)
      .done(function (task) { sched.loadStep4(profs, task); });
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

    var footer = $("#sched-availability-message-readonly");
    footer.children().remove();
    footer.append(emailViewOfOptions(options));
  }


  function rowViewOfParticipant(chats, profs, task, uid) {
    var view = $("<div class='sched-step3-row'>");
    var chatHead = $("<div class='chat-head'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;
    var name = prof.full_name;
    var firstInitial = $("<p class='first-initial'/>")
      .text(profile.firstInitialOfProfile(prof));

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

    firstInitial.appendTo(chatHead);
    chatHead.appendTo(view);

    $("<p class='guest-name'>" + name + "</p>")
      .appendTo(view);

    $("<a class='send-message'>Send a message</a>")
      .click(composeEmail)
      .appendTo(view);

    var sendButton = $("#sched-availability-send");
    sendButton
      .removeClass("disabled")
      .unbind('click')
      .click(function() {
        if (! sendButton.hasClass("disabled")) {
          sendButton.addClass("disabled");
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
        }
      });

    return { view: view,
             composeEmail: composeEmail };
  }

  mod.load = function(profs, task, view) {
    $("<h3>Select a final time.</h3>")
      .appendTo(view);

    var chats = sched.chatsOfTask(task);
    var next = $(".sched-step3-next");
    var selected;

    function onSelect(x) {
      selected = x;
      next.removeClass("disabled");
    }

    viewOfOptions(task, onSelect)
      .appendTo(view);

    $("<h4 class='guest-statuses-title'>Guest Statuses</h4>")
      .appendTo(view);

    var guestsContainer = $("<div class='guests-container'>")
    var guests = sched.getGuests(task);
    var numGuests = guests.length;
    list.iter(guests, function(uid) {
      var x =
        rowViewOfParticipant(chats, profs, task, uid);
      x.view
        .appendTo(guestsContainer);
      if (numGuests == 1 && ! sentEmail(chats, uid))
        x.composeEmail();
    });

    guestsContainer.appendTo(view);

    next
      .addClass("disabled")
      .unbind('click')
      .click(function() {
        updateTask(profs, task, selected);
      });
  };

  return mod;
}());
