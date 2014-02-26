/* Scheduling - step 3 */

var sched3 = (function() {
  var mod = {};

  function sentEmail(chats, uid) {
    var chat = chats[uid];
    return list.exists(chat.chat_items, function(x) {
      return (x.chat_item_data[0] === "Scheduling_q");
    });
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

  function eqSlot(x, y) {
    return !x && !y
        || x && y
           && x.start === y.start
           && x.end === y.end
           && x.on_site === y.on_site
           && x.location.address === y.location.address;
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
      var x_view = viewOfOption(x);
      x_view.click(function() {
          selector.show(x.label);
          onSelect(x);
        })
        .appendTo(view);

      if (state.reserved && eqSlot(x.slot, state.reserved.slot)) {
        x_view.addClass("radio-selected");
        onSelect(x);
      }
    });

    return view;
  }

  function emailViewOfOption(calOption, i) {
    var option = sched.viewOfSuggestion(calOption.slot)
      .addClass("email-option-details");

    return $("<div class='email-option'/>")
      .append($("<div class='option-letter option-letter-modal unselectable' />")
      .text(util.letterOfInt(i)))
      .append(option);
  }

  function emailViewOfOptions(options) {
    var view = $("<div class='email-options'/>");
    list.iter(options, function(x, i) {
      emailViewOfOption(x, i)
        .appendTo(view);
    });
    return view;
  }

  function updateTaskState(state, calOption) {
    if (calOption) {
      if (! state.reserved) {
        state.reserved = {
          /* reminders may be set later by the user */
          notifs: []
        };
      }
      state.reserved.slot = calOption.slot;
    }
  }

  function saveTask(ta, calOption) {
    updateTaskState(sched.getState(ta), calOption);
    api.postTask(ta);
  }

  function reserveCalendar(tid) {
    return api.reserveCalendar(tid, { notified: [] })
      .then(function(eventInfo) {
        return api.getTask(tid);
      });
  }

  function updateTask(ta, calOption) {
    var state = sched.getState(ta);
    ta.task_status.task_progress = "Confirmed"; // status in the task list
    state.scheduling_stage = "Confirm";         // step in the scheduling page
    updateTaskState(state, calOption);
    api.postTask(ta)
      .done(function(ta) {
        reserveCalendar(ta.tid)
          .done(function(eventInfo) {
            api.getTask(ta.tid)
              .done(sched.loadTask);
          });
      });
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

  function showEndTime() {
    $("#sched-availability-message-readonly .time-text")
      .removeClass("hide");
    $("#sched-availability-message-readonly .time-text-short")
      .addClass("hide");
  }

  function hideEndTime() {
    $("#sched-availability-message-readonly .time-text")
      .addClass("hide");
    $("#sched-availability-message-readonly .time-text-short")
      .removeClass("hide");
  }

  function loadRecipients(toObsProf) {
    $("#sched-availability-to-list").children().remove();

    var recipientRow = $("<div class='sched-availability-to checkbox-selected'/>")
      .appendTo($("#sched-availability-to-list"));

    var recipientCheckboxDiv = $("<div class='recipient-checkbox-div'/>")
      .appendTo(recipientRow);

    var recipientCheckbox = $("<img class='recipient-checkbox'/>")
      .appendTo(recipientCheckboxDiv);
    svg.loadImg(recipientCheckbox, "/assets/img/checkbox-sm.svg");

    var recipientName = $("<div class='recipient-name' />")
      .append(profile.fullName(toObsProf.prof))
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

    var organizerName = profile.fullName(profs[login.me()].prof);
    var hostName = profile.fullName(profs[login.leader()].prof);
    var toName = profile.fullName(toObsProf.prof);
    var howSoon = textOfHowSoon(howSoon);

    var footerOption = $("#footer-option");
    footerOption.children().remove();

    var footerCheckboxDiv = $("<div class='footer-checkbox-div'/>")
      .appendTo(footerOption);
    var footerCheckbox = $("<img class='footer-checkbox'/>")
      .appendTo(footerCheckboxDiv);
    svg.loadImg(footerCheckbox, "/assets/img/checkbox-sm.svg");

    var timeOption = $("<div class='time-option' />")
      .append("Show end time of meeting options")
      .appendTo(footerOption);

    var footer = $("#sched-availability-message-readonly");
    footer.children().remove();
    footer.append(emailViewOfOptions(options));
    if (footer.hasClass("short")) {
      hideEndTime();
    } else {
      showEndTime();
    }

    footerOption.off("click");
    footerOption.click(function() {
      if (footerOption.hasClass("checkbox-selected")) {
        footerOption.removeClass("checkbox-selected");
        footer.addClass("short");
        hideEndTime();
      } else {
        footerOption.addClass("checkbox-selected");
        footer.removeClass("short");
        showEndTime();
      }
    })

    $("#sched-options-guest-addr").val("Address_directly");
    var parameters = {
      template_kind: "Options_to_guest",
      exec_name: hostName,
      guest_name: toName
    };
    api.getOptionsMessage(task.tid, parameters)
      .done(function(optionsMessage) {
        $("#sched-availability-message").val(optionsMessage.message_text);
        $("#sched-options-guest-addr")
          .unbind("change")
          .change(function(){refreshOptionsMessage(task.tid, parameters);});
      });
  }

  function refreshOptionsMessage(tid, parameters) {
    if ($("#sched-options-guest-addr").val() === "Address_directly") {
      parameters.template_kind = "Options_to_guest";
    } else {
      parameters.template_kind = "Options_to_guest_assistant";
    }
    api.getOptionsMessage(tid, parameters)
      .done(function(x) {
        $("#sched-availability-message").val(x.message_text);
      });
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

    var prof = profs[uid].prof;
    profile.viewMediumCirc(prof)
      .appendTo(guest);

    $("<div class='pref-guest-name ellipsis'>" + name + "</div>")
      .appendTo(guest);

    var requiredDiv = $("<div class='required clearfix checkbox-selected'/>")
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
          var hideEnd = $("#sched-availability-message-readonly")
            .hasClass("short");
          task.task_data[1].hide_end_times = hideEnd;
          api.postTask(task).done(function() {
            var chatItem = {
              chatid: chatid,
              by: login.me(),
              'for': login.me(),
              team: login.getTeam().teamid,
              chat_item_data: ["Scheduling_q", {
                body: body,
                choices: options,
                hide_end_times: hideEnd
              }]
            };
            chat.postChatItem(chatItem)
              .done(closeAvailabilityModal);
          });
        }
      });

    return { view: view,
             composeEmail: composeEmail };
  }

  mod.load = function(profs, ta, view) {
    var view = $("#sched-step3-table");
    $("<h3>Select a final time.</h3>")
      .appendTo(view);

    var chats = sched.chatsOfTask(ta);
    var next = $(".sched-step3-next");
    var selected;

    next
      .addClass("disabled")
      .unbind('click')
      .click(function() {
        updateTask(ta, selected);
      });

    function onSelect(x) {
      selected = x;
      next.removeClass("disabled");
    }

    viewOfOptions(ta, onSelect)
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
    var guests = sched.getGuests(ta);
    var numGuests = guests.length;
    list.iter(guests, function(uid) {
      var x =
        rowViewOfParticipant(chats, profs, ta, uid);
      x.view
        .appendTo(guestsContainer);
      if (numGuests == 1 && ! sentEmail(chats, uid))
        x.composeEmail();
    });

    guestsContainer.appendTo(view);

    task.onSchedulingStepChanging.observe("step", function() {
      saveTask(ta, selected);
    });
  };

  return mod;
}());
