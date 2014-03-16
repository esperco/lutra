var guestTask = function() {
  var mod = {};

  function viewOfFeedback() {
    var view = $("<div id='feedback'/>");

    var checkCircle = $("<div id='check-circle' class='animated'/>");
    var check = $("<img id='submitted-check'/>");
    checkCircle.append(check);
    svg.loadImg(check, "/assets/img/check.svg");

    var message = $("<div id='feedback-message'/>")
      .append(checkCircle)
      .append("Your selections have been submitted.")
      .appendTo(view);

    // var editButton = $("<div id='edit-selections-btn'/>")
    //   .appendTo(view);
    var editIcon = $("<img id='edit-selections-icon'/>");
    edit = $("<div id='edit-selections' class='btn btn-primary'/>")
      .append(editIcon)
      .append($("<div id='edit-selections-text'>Edit selections</div>"))
      .appendTo(view);
    svg.loadImg(editIcon, "/assets/img/edit.svg");

    edit.click(function() {
      $("#check-circle").removeClass("pulse");
      $("#feedback").addClass("hide");
      $("#guest-select").removeClass("hide");
    })

    return view;
  }

  function getGuestOptions(state) {
    return list.toTable(state.participant_options,
                        function(x){return x.uid;});
  }

  function assistedBy(uid, guestOptions) {
    var options = guestOptions[uid];
    return util.isNotNull(options) ? options.assisted_by : null;
  }

  function guestMayAttend(uid, guestOptions) {
    var options = guestOptions[uid];
    return ! util.isNotNull(options)
        || false !== options.may_attend;
  }

  function join(x, sep, y) {
    if (x.length <= 0) {
      return y;
    } else if (y.length <= 0) {
      return x;
    } else {
      return x + sep + y;
    }
  }

  function indexLabel(i) {
    var a = "A".charCodeAt(0);
    var label = "";
    do {
      label = String.fromCharCode(i % 26 + a) + label;
      i = Math.floor(i / 26);
    } while (i > 0);
    return label;
  }

  function viewOfGuestRow(x, guestOptions) {
    var view = $("<div class='guest-row clearfix'/>");

    var main = $("<div class='guest-main col-sm-5'/>")
      .appendTo(view);
    var name = profile.fullName(x);
    var nameDiv = $("<div class='guest-name ellipsis'/>")
      .append(name)
      .appendTo(main);
    var me = login.me();
    if (me === x.profile_uid) {
      nameDiv.append($("<span id='me-label'>me</span>"));
    } else if (me === assistedBy(x.profile_uid, guestOptions)) {
      nameDiv.append($("<span id='me-label'>my boss</span>"));
    }
    // var linkedinIcon = $("<img class='linkedin-icon'/>");
    // var linkedin = $("<div class='linkedin-title'/>")
    //   .append(linkedinIcon)
    //   .append($("<div class='linkedin-text ellipsis'/>")
    //     .text("Designer at Esper"));
    // svg.loadImg(linkedinIcon, "/assets/img/linkedin-sq.svg");
    // linkedin.click(function() {
    //   window.open("http://www.linkedin.com/vsearch/f?type=all&keywords=" + name);
    // })
    // main.append(linkedin);

    // var emailIcon = $("<img class='email-icon'/>");
    // var email = $("<div class='guest-email col-sm-4'/>")
    //   .append(emailIcon)
    //   .append($("<div class='email-address ellipsis'/>")
    //     .text("nick@esper.com"));
    // svg.loadImg(emailIcon, "/assets/img/email.svg");
    // email.click(function() {
    //   window.open("http://www.linkedin.com/vsearch/f?type=all&keywords=" + name);
    // })
    // view.append(email);

    // var phoneIcon = $("<img class='phone-icon'/>");
    // var phone = $("<div class='guest-phone col-sm-3'/>")
    //   .append(phoneIcon)
    //   .append($("<div class='phone-number ellipsis'/>")
    //     .text("(555) 555-5555"));
    // svg.loadImg(phoneIcon, "/assets/img/phone.svg");
    // view.append(phone);

    return view;
  }

  function wordify(time) {
    if (time === "12:00 am") {
      return "Midnight";
    } else if (time === "12:00 pm") {
      return "Noon";
    } else {
      return time;
    }
  }

  function describeTimeSlot(start, end, hideEndTime) {
    var fromTime = wordify(date.timeOnly(start));
    if (hideEndTime) {
      return "at " + fromTime;
    } else {
      var toTime = wordify(date.timeOnly(end));
      return fromTime + " to " + toTime;
    }
  }

  function viewOfTimeAndPlace(x, hideEndTime) {
    var view = $("<div id='time-and-place'/>");

    var meetingTime = $("<div id='meeting-time'/>")
      .appendTo(view);
    var clock = $("<img id='clock'/>")
        .appendTo(meetingTime);
    svg.loadImg(clock, "/assets/img/clock.svg");
    var time1 = $("<div id='time1'/>")
      .appendTo(meetingTime);
    var time2 = $("<div id='time2' class='start-end'/>")
      .appendTo(meetingTime);

    var t1 = date.ofString(x.start);
    var t2 = date.ofString(x.end);

    time1
      .append(date.weekDay(t1) + ", ")
      .append(date.dateOnly(t1))
    time2
      .append(describeTimeSlot(t1, t2, hideEndTime));

    var meetingLoc = $("<div id='meeting-location'/>")
      .appendTo(view);
    var pin = $("<img id='pin'/>")
        .appendTo(meetingLoc);
    svg.loadImg(pin, "/assets/img/pin.svg");
    var loc = $("<div id='loc'/>")
      .appendTo(meetingLoc);

    var locText = chat.locationText(x.location);
    if (locText) {
      loc.append(html.text(locText));
    } else {
      loc.append("Location TBD")
         .addClass("tbd")
    }

    loc.click(function() {
      window.open("http://www.google.com/maps/search/" + encodeURIComponent(locText));
    });

    return view;
  }

  function stripTimestamp(d, local) {
    var s;
    if (util.isNotNull(d)) {
      // Normalize timezone to UTC.
      s = new Date(Date.parse(d)).toISOString();
    } else {
      // Backward compatibility, in case the *_utc fields are not available.
      // Remove the ending 'Z'. According to Util_localtime.create,
      // "the timezone suffix 'Z' is for compliance only".
      s = local.replace(/Z$/, "");
    }
    // Remove the fraction of second.
    // Remove the '-' and ':' separators, to turn it into ISO 8601 basic
    // format.
    return s.replace(/-|:|\.\d+/g, "");
  }

  function googleCalendarURL(text1, text2, slot, hideEndTime) {
    var fromTime = stripTimestamp(slot.start_utc, slot.start);
    var toTime = hideEndTime ? fromTime : stripTimestamp(slot.end_utc,slot.end);
    return "http://www.google.com/calendar/event?"
         + ["action=TEMPLATE",
            "text=" + encodeURIComponent(text1),
            "dates=" + fromTime + "/" + toTime,
            "details=" + encodeURIComponent("For meeting details, click here: " + text2),
            "location=" + encodeURIComponent(chat.locationText(slot.location)),
            "trp=true",             // show as busy
            "sprop=Esper",          // website name
            "sprop=name:esper.com"] // website address
            .join("&");
  }
    var saveICS = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, fileName) {
            var blob = new Blob([data], {type: "text/calendar"});
            var url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
        //    window.URL.revokeObjectURL(url);
        };
    }());

  function addToCalendar(ta, x) {
    var addCal = $("<img id='add-cal'/>");
    var button = $("<button/>", {
      "id": "add-to-calendar",
      "class": "btn btn-primary",
      "data-contentwrapper": "#calendar-types",
      "data-toggle": "popover",
    })
      .append(addCal)
      .append($("<div id='add-cal-text'>ADD TO CALENDAR</div>"));
    svg.loadImg(addCal, "/assets/img/plus-sm.svg");

    var google = $("#google");
    $(document).on("click", "#google", function() {
      $('[data-toggle="popover"]').click();
      window.open(googleCalendarURL(sched.getCalendarTitle(x),
                                    window.location,
                                    x.reserved.slot,
                                    x.hide_end_times));
    });
    var outlook = $("#outlook");
    var apple = $("#apple");

    var getICS = function () {
      $('[data-toggle="popover"]').click();
      api.getTaskICS().done(function (ics) {
          log(ics);
          saveICS(ics.content,'calendar-invitation.ics');
      });
      button.click();
    }
    $("#outlook")
          .off("click")
          .click(getICS);
    $("#apple")
          .off("click")
          .click(getICS);

    button.popover({
      html:true,
      placement:'bottom',
      content:function(){
        return $($(this).data('contentwrapper')).html();
      }
    });

    $('body').on('click', function (e) {
      if ($(e.target).data('toggle') !== 'popover'
        && $(e.target).parents('[data-toggle="popover"]').length === 0
        && $(e.target).parents('.popover.in').length === 0
        && button.next('div.popover:visible').length) {
        button.click();
      }
    });

    return button;
  }

  function viewOfMeetingHeader(task, ta, state) {
    var view = $("<div id='meeting-header'/>");
    var title = $("<div id='meeting-title'/>")
      .text(sched.getCalendarTitle(state))
      .appendTo(view);

    if (! list.mem(task.guest_hosts, task.guest_uid)) {
      view.append(addToCalendar(ta, state));
    } else {
      title.addClass("exec-view");
    }

    return view;
  }

  function calendarIcon(x) {
    var view = $("<div id='cal-icon'/>");
    var month = $("<div id='month'/>")
      .appendTo(view);
    var day = $("<div id='day'/>")
      .appendTo(view);

    var t1 = date.ofString(x.start);
    month.append(date.month(t1).substr(0,3).toUpperCase());
    day.append(date.day(t1));

    return view;
  }

  function recoverCalendarSelection(ta) {
    var msgItem = null;
    for (var i = ta.task_chat_items.length; --i >= 0; ) {
      var item = ta.task_chat_items[i];
      if (item.by === login.me()) {
        switch (variant.cons(item.chat_item_data)) {

        case "Message":
          var r = /^None of the above(?:\n+|$)(.*)/i
                  .exec(item.chat_item_data[1]);
          if (r) {
            return {comment:r[1], noneWorks:true, answers:{}};
          }
          msgItem = item;
          break;

        case "Scheduling_r":
          var comment = util.isNotNull(msgItem)
                     && item.id === msgItem.in_reply_to
                     && item.by === msgItem.by
            ? msgItem.chat_item_data[1]
            : "";
          return {comment:comment, noneWorks:false,
                  answers:list.toTable(item.chat_item_data[1].selected,
                                       function(sel){return sel.label})};
        default: break;
        }
      }
    }
    return {comment:"", noneWorks:false, answers:{}};
  }

  mod.loadTask = function(task) {
    var ta = task.guest_task;

    var myLast = recoverCalendarSelection(ta);
    var answers = {};

    function submitButton() {
      var submitButton = $("<button/>", {
        "id":"submit-selections",
        "class":"btn btn-primary btn-primary-disabled",
        "text":"Submit"
      });
      submitButton.click(function() {
        var data = null;
        var sel = list.ofTable(answers);
        if (sel.length > 0) {
          data = ["Scheduling_r", {selected:sel}];
        } else if ($("#option-none").hasClass("checkbox-selected")) {
          data = ["Message", $("#option-none-text").text().trim()];
        }
        if (util.isNotNull(data)) {
          var item = {
            tid: ta.tid,
            to:  ta.task_participants.organized_by,
            by:  login.me(),
            chat_item_data: data
          };
          chat.postChatItem(item);
        }
        $("html, body").animate({ scrollTop: 0 }, 350);
        $("#guest-select").addClass("hide");
        $("#feedback").removeClass("hide");
        $("#check-circle").addClass("pulse");
      });
      return submitButton;
    }

    function viewOfNoneWorks(options) {
      var slotView = $("<tr id='option-none'/>");
      if (myLast.noneWorks) {
        slotView.addClass("checkbox-selected");
      }
      var select = $("<td class='option-select'/>")
        .appendTo(slotView);
      var info = $("<td id='option-none-text'/>")
        .append("None of the above")
        .appendTo(slotView);

      if (list.mem(task.guest_hosts, task.guest_uid)) {
        select.addClass("exec-view");
      }

      var checkboxContainer = $("<div class='checkbox-container'/>");
      var checkbox = $("<img/>");
      select.append(checkboxContainer.append(checkbox));
      svg.loadImg(checkbox, "/assets/img/checkbox.svg");

      var frownBox = $("<div id='frown'/>");
      var frown = $("<img/>");
      frownBox.append(frown)
              .appendTo(select);
      svg.loadImg(frown, "/assets/img/frown.svg");

      checkboxContainer.click(function() {
        if (slotView.hasClass("checkbox-selected")) {
          slotView.removeClass("checkbox-selected");
          $("#submit-selections").addClass("btn-primary-disabled");
        } else {
          slotView.addClass("checkbox-selected");
          $("#submit-selections").removeClass("btn-primary-disabled");
          answers = {};
          $(".option").removeClass("checkbox-selected");
        }
      });

      return slotView;
    }

    function viewOfCalendarOption(choice, label, typ, hideEndTime) {
      var slotView = $("<tr class='option'/>");
      var select = $("<td class='option-select'/>")
        .appendTo(slotView);

      if (! list.mem(task.guest_hosts, task.guest_uid)) {
        if (answers[choice.label]) {
          slotView.addClass("checkbox-selected");
        }
        var checkboxContainer = $("<div class='checkbox-container'/>");
        var checkbox = $("<img/>");
        select.append(checkboxContainer.append(checkbox));
        svg.loadImg(checkbox, "/assets/img/checkbox.svg");

        checkboxContainer.click(function() {
          if (slotView.hasClass("checkbox-selected")) {
            slotView.removeClass("checkbox-selected");
            delete answers[choice.label];
            if (jQuery.isEmptyObject(answers)) {
              $("#submit-selections").addClass("btn-primary-disabled");
            }
          } else {
            slotView.addClass("checkbox-selected");
            $("#submit-selections").removeClass("btn-primary-disabled");
            answers[choice.label] = choice;
            $("#option-none").removeClass("checkbox-selected");
          }
        });
      } else {
        select.addClass("exec-view");
      }

      var optionLetter = $("<div class='option-letter'/>")
        .text(label)
        .appendTo(select);

      var info = sched.viewOfOption(choice, typ, hideEndTime)
        .appendTo(slotView);

      return slotView;
    }

    profile.profilesOfTaskParticipants(ta).done(function(profs) {
      var taskView = $("#meeting-content");
      taskView.children().remove();
      var taskWelcome = $("#meeting-welcome");
      var myName = profile.fullName(profs[login.me()].prof);
      taskWelcome.text("Hello, " + myName);

      if ("Scheduling" === variant.cons(ta.task_data)) {
        var state = ta.task_data[1];

        if (list.mem(task.guest_hosts, task.guest_uid)) {
          var taskImpersonator = $("#meeting-impersonator");
          var viewAs = $("<span id='view-as'>View as</span>");
          // Create impersonation selector

          taskWelcome.addClass("exec-view");
          taskImpersonator.append(viewAs);
        }

        if (state.reserved) {
          var guestsIcon = $("<img id='guests-icon'/>");
          var notesIcon = $("<img id='notes-icon'/>");
          var messagesIcon = $("<img id='messages-icon'/>");
          taskView.append(calendarIcon(state.reserved.slot))
                  .append(viewOfMeetingHeader(task, ta, state))
                  .append(viewOfTimeAndPlace(state.reserved.slot,
                                             state.hide_end_times))
                  .append($("<div class='task-section-header'/>")
                    .append(guestsIcon)
                    .append("<div class='task-section-text'>GUESTS</div>"));
          var guestOptions = getGuestOptions(state);
          var participantListView = $("<div id='guests'/>");
          list.iter(ta.task_participants.organized_for, function(uid) {
            if (guestMayAttend(uid, guestOptions)) {
              participantListView.append(
                  viewOfGuestRow(profs[uid].prof, guestOptions));
            }
          });
          taskView.append(participantListView)
          var publicNotes = $("<div id='public-notes'/>")
            .text(state.public_notes);
          var privateNotes = $("<div id='private-notes'/>")
            .text(state.private_notes);
          if (state.public_notes != "" || state.private_notes != "") {
            taskView.append($("<div class='task-section-header'/>")
              .append(notesIcon)
              .append("<div class='task-section-text'>NOTES</div>"));
            if (state.private_notes != "") {
              taskView.append(privateNotes);
            }
            if (state.public_notes != "") {
              taskView.append(publicNotes);
            }
          }
          taskView.append($("<div class='task-section-header'/>")
                  .append(messagesIcon)
                  .append("<div class='task-section-text'>MESSAGES</div>"));
          svg.loadImg(guestsIcon, "/assets/img/group.svg");
          svg.loadImg(notesIcon, "/assets/img/edit.svg");
          svg.loadImg(messagesIcon, "/assets/img/chat.svg");
        } else if (state.calendar_options.length > 0) {
          var hostName = list.map(task.guest_hosts, function(uid) {
                  return profile.fullName(profs[uid].prof);
                }).join(" & ");

          var title = $("<div id='options-title'/>")
            .appendTo(taskView);
          if (list.mem(task.guest_hosts, task.guest_uid)) {
            var inProgress = $("<img id='in-progress'/>");
            svg.loadImg(inProgress, "/assets/img/in-progress.svg");
            title.append(inProgress)
                 .append($("<div class='in-progress-text'/>")
                   .text("This meeting is still being scheduled."))
                 .append($("<div class='in-progress-text helper-text'/>")
                   .text("Below are the meeting options in consideration."));
          } else {
            title.text("When can you meet with " + hostName + "?");
          }

          var select = $("<div id='guest-select'/>")
            .appendTo(taskView);
          var options = $("<table id='options'/>")
            .appendTo(select);
          list.iter(state.calendar_options, function(choice, i) {
            if (util.isNotNull(myLast.answers[choice.label])) {
              answers[choice.label] = choice;
            }
            var label = indexLabel(i);
            var typ = sched.formatMeetingType(choice.slot);
            options.append(viewOfCalendarOption(choice, label, typ,
                                                state.hide_end_times));
          });
          if (! list.mem(task.guest_hosts, task.guest_uid)) {
            options.append(viewOfNoneWorks(state.calendar_options));
            select.append(submitButton());
          }

          var feedback = $("<div id='feedback' class='hide'/>")
            .append(viewOfFeedback)
            .appendTo(taskView);

          var messagesIcon = $("<img id='messages-icon'/>");
          taskView.append($("<div id='messages-header'/>")
                  .append(messagesIcon)
                  .append("<div class='task-section-text'>MESSAGES</div>"));
          svg.loadImg(messagesIcon, "/assets/img/chat.svg");
        }
      }

      observable.onTaskModified.observe("guest-task", mod.loadTask);
    });
  }

  return mod;
}();
