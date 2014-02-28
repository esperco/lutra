var guestTask = function() {
  var mod = {};

  function wordify(time) {
    if (time === "12:00 am") {
      return "Midnight";
    } else if (time === "12:00 pm") {
      return "Noon";
    } else {
      return time;
    }
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

  function googleCalendarLink(url) {
    var buttonImg = "//www.google.com/calendar/images/ext/gc_button6.gif";
      // It can be gc_button[1..6].gif
    return $("<a/>", {href:url, target:"_blank"})
           .append($("<img/>", {src:buttonImg, border:0}));
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

  function viewOfTimeAndPlace(x) {
    var view = $("<div/>");

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
    svg.loadImg(addCal, "/assets/img/add-to-calendar.svg");

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

  function viewOfCalendarOption(answers, choice, label, typ) {
    var slotView = $("<div class='option'/>");

    var checkboxContainer = $("<div class='checkbox-container clearfix'/>");
    var checkbox = $("<img class='option-checkbox'/>");
    slotView.append(checkboxContainer.append(checkbox));
    svg.loadImg(checkbox, "/assets/img/checkbox.svg");

    var optionLetter = $("<div class='option-letter'/>")
      .text(label)
      .appendTo(slotView);

    var what = $("<div class='info-row ellipsis'/>")
      .appendTo(slotView);
    var whatLabel = $("<div id='what' class='info-label'/>")
      .text("WHAT")
      .appendTo(what);
    var meetingType = $("<div class='info ellipsis'/>")
      .text(typ)
      .appendTo(what);

    var when = $("<div class='info-row ellipsis'/>")
      .appendTo(slotView);
    var whenLabel = $("<div id='when' class='info-label'/>")
      .text("WHEN")
      .appendTo(when);
    var time = viewOfTimeOnly(choice.slot)
      .addClass("info ellipsis")
      .appendTo(when);

    var where = $("<div class='info-row ellipsis'/>")
      .appendTo(slotView);
    var whereLabel = $("<div id='where' class='info-label'/>")
      .text("WHERE")
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

  function meetingType(state) {
    if (state.meeting_request && state.meeting_request.meeting_type) {
      var typ = variant.cons(state.meeting_request.meeting_type);
      switch (typ) {
        case "Call":      return "Phone Call";
        case "Nightlife": return "Night Life";
        default:          return typ;
      }
    } else {
      return "Meeting";
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
          taskView.append($("<p id='meeting-title'/>").text(ta.task_calendar_title))
                  .append(addToCalendar(ta, state.reserved.slot))
                  .append(viewOfTimeAndPlace(state.reserved.slot))
                  .append($("<div class='task-section-header'/>").text("GUESTS"));
          var participantListView = $("<ul/>");
          list.iter(ta.task_participants.organized_for, function(uid) {
            var name = profile.fullName(profs[uid].prof);
            participantListView.append($("<li class='guest-name-row'/>").text(name));
          });
          taskView.append(participantListView);
          // taskView.append($("<div class='task-section-header'/>").text("NOTES"));
          taskView.append($("<div class='task-section-header'/>").text("MESSAGES"));
          $("#messages").removeClass("hide");
        } else if (state.calendar_options.length > 0) {
          var select = $("<div id='guest-select'/>")
            .append($("<p id='meeting-title'/>")
            .text("Select the meeting options that work for you."))
            .appendTo(taskView);
          var answers = {};
          var options = $("<div id='options'/>")
            .appendTo(select);
          var typ = meetingType(state);
          list.iter(state.calendar_options, function(choice, i) {
            var label = indexLabel(i);
            options.append(viewOfCalendarOption(answers, choice, label, typ));
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
