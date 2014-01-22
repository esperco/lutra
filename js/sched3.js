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
    var radio = $("<img class='suggestion-radio'/>")
      .appendTo(view);
    svg.loadImg(radio, "/assets/img/radio.svg");
    sched.viewOfSuggestion(calOption.slot)
      .appendTo(view);
    return view;
  }

  function viewOfOptions(task, onSelect) {
    var view = $("<div class='options-container'/>");
    var state = sched.getState(task);
    var options = state.calendar_options;

    var idList = list.map(options, function(x) {
      return { k: x.label, ids: [x.label] };
    });
    var idTbl = list.toTable(idList, function(x) { return x.k; });
    var selector = show.create(idTbl, {
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
      .append($("<div class='option-letter option-letter-modal unselectable' />")
      .text(util.letterOfInt(i)))
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

  function updateTask(ta, calOption) {
    var state = sched.getState(ta);
    ta.task_status.task_progress = "Confirmed"; // status in the task list
    state.scheduling_stage = "Confirm";         // step in the scheduling page
    state.reserved = {
      slot: calOption.slot,
      remind: 3*43200,
      notifs: []
    };
    api.postTask(ta)
      .done(function (task) { sched.loadTask(task); });
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

  function loadRecipients(toObsProf) {
    $("#sched-availability-to-list").children().remove();

    var recipientRow = $("<div class='sched-availability-to'/>")
      .appendTo($("#sched-availability-to-list"));

    var recipientCheckboxDiv = $("<div class='recipient-checkbox-div'/>")
      .appendTo(recipientRow);

    var recipientCheckbox = $("<img class='recipient-checkbox'/>")
      .appendTo(recipientCheckboxDiv);
    svg.loadImg(recipientCheckbox, "/assets/img/checkbox-sm.svg");

    var recipientName = $("<div class='recipient-name' />")
      .append(toObsProf.prof.full_name)
      .appendTo(recipientRow);

    recipientRow.click(function() {
      if (recipientRow.hasClass("checkbox-selected")) {
        recipientRow.removeClass("checkbox-selected");
      } else {
        recipientRow.addClass("checkbox-selected");
      }
    })
  }

  function preFillAvailabilityModal(chats, profs, task,
                                    howSoon, options, toUid) {
    var toObsProf = profs[toUid];

    loadRecipients(toObsProf);

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
    var view = $("<div class='sched-step3-row clearfix'>");
    var dragDiv = $("<div class='guest-drag-div hide'></div>")
      .appendTo(view);
    var drag = $("<img class='drag'/>")
      .appendTo(dragDiv);
    svg.loadImg(drag, "/assets/img/drag.svg");

    var state = sched.getState(task);
    var howSoon = state.meeting_request.how_soon;
    var options = state.calendar_options;

    var availabilityModal = $("#sched-availability-modal");
    function closeAvailabilityModal(item) {
      availabilityModal.modal("hide");
    }

    function composeEmail() {
      preFillAvailabilityModal(chats, profs, task, howSoon, options, uid);
      availabilityModal.modal({});
    }

    var guest = $("<div class='col-xs-6'></div>")
      .appendTo(view);
    var chatHead = $("<div class='list-prof-circ pref-prof-circ'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;
    var name = prof.full_name;
    var initials = $("<p class='initials unselectable'/>")
      .text(profile.veryShortNameOfProfile(prof));

    initials.appendTo(chatHead);
    chatHead.appendTo(guest);

    $("<div class='pref-guest-name ellipsis'>" + name + "</div>")
      .appendTo(guest);

    var requiredDiv = $("<div class='required clearfix'/>")
      .appendTo(guest);
    var required = $("<img class='required-checkbox'/>")
      .appendTo(requiredDiv);
    svg.loadImg(required, "/assets/img/checkbox-sm.svg");
    var requiredLabel = $("<div/>", {
      'class': "required-label ellipsis unselectable",
      'text': "Required"
    });
    requiredDiv.append(requiredLabel);

    requiredDiv.click(function () {
      if (requiredDiv.hasClass("checkbox-selected")) {
        requiredDiv.removeClass("checkbox-selected");
      } else {
        requiredDiv.addClass("checkbox-selected");
      }
    });

    var responseA = $("<div class='hide col-xs-2 pref-guest-response third'>3</div>")
      .appendTo(view);
    var responseB = $("<div class='hide col-xs-2 pref-guest-response first'>1</div>")
      .appendTo(view);
    var responseC = $("<div class='hide col-xs-2 pref-guest-response second'>2</div>")
      .appendTo(view);

    var guestActions = $("<div class='col-xs-6 pref-guest-actions'></div>")
      .appendTo(view);
    $("<div class='pref-request'>Request preferences</div>")
      .click(composeEmail)
      .appendTo(guestActions);
    $("<hr class='guest-actions-divider'></hr>")
      .appendTo(guestActions);
    $("<div class='pref-answer'>Answer for guest</div>")
      .appendTo(guestActions);

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
            team: login.getTeam().teamid,
            chat_item_data: ["Scheduling_q", {
              body: body,
              choices: options
            }]
          };
          chat.postChatItem(chatItem)
            .done(closeAvailabilityModal);
        }
      });

    return { view: view,
             composeEmail: composeEmail };
  }

  mod.load = function(profs, task, view) {
    var view = $("#sched-step3-table");
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

    $("<h4 class='guest-prefs-title'>Guest Preferences</h4>")
      .appendTo(view);

    $("<div class='score-info'></div>")
      .appendTo(view);

    var guestPrefsHeader = $("<div class='guest-prefs-header clearfix'></div>")
      .append($("<div class='col-xs-6'></div>"))
      .appendTo(view);

    var ABlock = $("<div class='hide option-letter-block col-xs-2'></div>")
      .append($("<div class='option-letter unselectable'>A</div>"))
      .append($("<div class='option-score unselectable'>63</div>"))
      .appendTo(guestPrefsHeader);
    var BBlock = $("<div class='hide option-letter-block col-xs-2'></div>")
      .append($("<div class='option-letter recommended unselectable'>B</div>"))
      .append($("<div class='option-score recommended unselectable'>84</div>"))
      .appendTo(guestPrefsHeader);
    var CBlock = $("<div class='hide option-letter-block col-xs-2'></div>")
      .append($("<div class='option-letter unselectable'>C</div>"))
      .append($("<div class='option-score unselectable'>81</div>"))
      .appendTo(guestPrefsHeader);

    var guestsContainer = $("<div class='guests-container guests-only'>")
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
        updateTask(task, selected);
      });
  };

  return mod;
}());
