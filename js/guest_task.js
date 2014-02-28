var guestTask = function() {
  var mod = {};

  function submitButton(answers) {
    var submitButton = $("<button/>", {
      "id":"submit-selections",
      "class":"btn btn-primary",
      "text":"Submit"
    });
    submitButton.click(function() {
      var sel = [];
      for (var label in answers) {
        sel.push(answers[label]);
      }
      var item = {
        chatid: login.myChatid(),
        by:     login.me(),
        "for":  login.me(),
        chat_item_data: ["Scheduling_r", {selected:sel}]
      };
      chat.postChatItem(item);
    });
    return submitButton;
  }

  function viewOfCalendarOption(choice, answers) {
    var slotView = $("<div class='option'/>");

    var checkboxContainer = $("<div class='checkbox-container clearfix'/>");
    var checkbox = $("<img class='option-checkbox'/>");
    slotView.append(checkboxContainer.append(checkbox));
    svg.loadImg(checkbox, "/assets/img/checkbox.svg");

    var optionLetter = $("<div class='option-letter'/>")
      .append("A")
      .appendTo(slotView);

    var what = $("<div class='info-row ellipsis'/>")
      .appendTo(slotView);
    var whatLabel = $("<div id='what' class='info-label'/>")
      .append("WHAT")
      .appendTo(what);
    var meetingType = $("<div class='info ellipsis'/>")
      .append("Phone Call")
      .appendTo(what);

    var when = $("<div class='info-row ellipsis'/>")
      .appendTo(slotView);
    var whenLabel = $("<div id='when' class='info-label'/>")
      .append("WHEN")
      .appendTo(when);
    var time = viewOfTimeOnly(choice.slot)
      .addClass("info ellipsis")
      .appendTo(when);

    var where = $("<div class='info-row ellipsis'/>")
      .appendTo(slotView);
    var whereLabel = $("<div id='where' class='info-label'/>")
      .append("WHERE")
      .appendTo(where);
    var loc = viewOfLocationOnly(choice.slot)
      .addClass("info ellipsis")
      .appendTo(where);

    checkboxContainer.click(function() {
      if (slotView.hasClass("checkbox-selected")) {
        slotView.removeClass("checkbox-selected");
        delete answers[choice.label];
      } else {
        slotView.addClass("checkbox-selected");
        answers[choice.label] = choice;
      }
    });
    return slotView;
  }

  function getDirections(x) {
    return "http://maps.google.com/?daddr="
      + x.location.coord.lat + "," + x.location.coord.lon;
  }

  function viewOfLocationOnly(x) {
    var view = $("<span id='address'/>");

    var locText = chat.locationText(x.location);
    if (locText) {
      view.append(html.text(locText));
    } else {
      view.append("TBD")
          .addClass("tbd")
    }

    view.click(function() {
      window.open("http://www.google.com/maps/search/" + encodeURIComponent(locText));
    });

    return view;
  }

  function viewOfTimeOnly(x) {
    var view = $("<div/>");
    var time1 = $("<div/>")
      .appendTo(view);
    var time2 = $("<div class='start-end'/>")
      .appendTo(view);

    var t1 = date.ofString(x.start);
    var t2 = date.ofString(x.end);

    var fromTime = wordify(date.timeOnly(t1));
    var toTime = wordify(date.timeOnly(t2));

    if (fromTime.charAt(fromTime.length-2) === toTime.charAt(toTime.length-2))
      fromTime = fromTime.substr(0, fromTime.length-3);

    time1
      .append(date.weekDay(t1) + ", ")
      .append(date.dateOnly(t1))
    time2
      .append(fromTime + " to " + toTime);

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

  function viewOfTimeAndPlace(x) {
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

    var fromTime = wordify(date.timeOnly(t1));
    var toTime = wordify(date.timeOnly(t2));

    if (fromTime.charAt(fromTime.length-2) === toTime.charAt(toTime.length-2))
      fromTime = fromTime.substr(0, fromTime.length-3);

    time1
      .append(date.weekDay(t1) + ", ")
      .append(date.dateOnly(t1))
    time2
      .append(fromTime + " to " + toTime);

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

  function stripTimestamp(d) {
    // Remove the '-' and ':' separators, to turn it into ISO 8601 basic format.
    // Remove the fraction of second.
    // Remove the ending 'Z'. According to Util_localtime.create,
    // "the timezone suffix 'Z' is for compliance only".
    return d.replace(/-|:|\.000|Z$/g, "");
  }

  function googleCalendarURL(text1, text2, slot) {
    return "http://www.google.com/calendar/event?"
         + ["action=TEMPLATE",
            "text=" + encodeURIComponent(text1),
            "dates=" + stripTimestamp(slot.start)
               + "/" + stripTimestamp(slot.end),
            "details=" + encodeURIComponent("For meeting details, click here: " + text2),
            "location=" + encodeURIComponent(chat.locationText(slot.location)),
            "trp=true",             // show as busy
            "sprop=Esper",          // website name
            "sprop=name:esper.com"] // website address
            .join("&");
  }

  function addToCalendar(ta, x) {
    var addCal = $("<img id='add-cal'/>");
    var button = $("<button/>", {
      "id": "add-to-calendar",
      "class": "btn btn-primary",
      "data-contentwrapper": "#calendar-types",
      "data-toggle": "popover",
    })
      .append(addCal)
      .append($("<div id='add-cal-text'>Add to my calendar</div>"));
    svg.loadImg(addCal, "/assets/img/plus-sm.svg");

    var google = $("#google");
    $(document).on("click", "#google", function() {
      $('[data-toggle="popover"]').click();
      window.open(googleCalendarURL(ta.task_calendar_title,
                                    window.location,
                                    x));
    })

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

  function viewOfMeetingHeader(ta, state) {
    return view = $("<div id='meeting-header'/>")
      .append($("<div id='meeting-title'/>").text(state.calendar_event_title))
      .append(addToCalendar(ta, state.reserved.slot));
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

  mod.loadTask = function(ta) {
    profile.profilesOfTaskParticipants(ta).done(function(profs) {
      var taskView = $("#meeting-content");
      taskView.children().remove();
      var taskWelcome = $("#meeting-welcome");
      taskWelcome.children().remove();

      var myName = profile.fullName(profs[login.me()].prof);
      taskWelcome.append($("<p/>").text("Hello, " + myName));

      if ("Scheduling" === variant.cons(ta.task_data)) {
        var state = ta.task_data[1];
        if (state.reserved) {
          var guestsIcon = $("<img id='guests-icon'/>");
          var notesIcon = $("<img id='notes-icon'/>");
          var messagesIcon = $("<img id='messages-icon'/>");
          taskView.append(calendarIcon(state.reserved.slot))
                  .append(viewOfMeetingHeader(ta, state))
                  .append(viewOfTimeAndPlace(state.reserved.slot))
                  .append($("<div class='task-section-header'/>")
                    .append(guestsIcon)
                    .append("<div class='task-section-text'>GUESTS</div>"));
          var participantListView = $("<ul/>");
          list.iter(ta.task_participants.organized_for, function(uid) {
            var name = profile.fullName(profs[uid].prof);
            if (name != myName) {
              participantListView.append($("<li class='guest-name-row'/>").text(name));
            } else {
              participantListView.append($("<li class='guest-name-row'/>").text("Me"));
            }
          });
          taskView.append(participantListView)
          var notes = $("<div id='notes'/>")
            .text(state.calendar_event_notes);
          if (notes.text() != "") {
            taskView.append($("<div class='task-section-header'/>")
                      .append(notesIcon)
                      .append("<div class='task-section-text'>NOTES</div>"))
                    .append(notes);
          }
          taskView.append($("<div class='task-section-header'/>")
            .append(messagesIcon)
            .append("<div class='task-section-text'>MESSAGES</div>"));
          $("#messages").removeClass("hide");
          svg.loadImg(guestsIcon, "/assets/img/group.svg");
          svg.loadImg(notesIcon, "/assets/img/edit.svg");
          svg.loadImg(messagesIcon, "/assets/img/chat.svg");
        } else if (state.calendar_options.length > 0) {
          var select = $("<div id='guest-select'/>")
            .append($("<div id='options-title'/>")
            .text("Select the meeting options that work for you."))
            .appendTo(taskView);
          var answers = {};
          var options = $("<div id='options'/>")
            .appendTo(select);
          list.iter(state.calendar_options, function(choice) {
            options.append(viewOfCalendarOption(choice, answers));
          });
          // select.append($("<div id='comment-header' class='task-section-header'/>")
          //       .text("COMMENT"))
          //       .append($("<textarea id='comment' class='form-control'/>"))
          select.append(submitButton(answers));

          var feedback = $("<div id='guest-select' class='hide'/>")
            .appendTo(taskView);

          $("#messages").addClass("hide");
        }
      }

      observable.onTaskModified.observe("guest-task", mod.loadTask);
    });
  }

  return mod;
}();
