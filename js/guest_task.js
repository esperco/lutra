var guestTask = function() {
  var mod = {};

  function locationText(loc) {
    if (loc.address) {
      if (loc.instructions)
        return loc.address + " (" + loc.instructions + ")";
      else
        return loc.address;
    }
    else if (loc.title)
      return loc.title;
    else if (loc.instructions)
      return loc.instructions;
    else
      return "";
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

  function stripTimestamp(d) {
    // Remove the '-' and ':' separators, to turn it into ISO 8601 basic format.
    return d.replace(/-|:|\.000/g, "");
  }

  function googleCalendarURL(text1, text2, slot) {
    return "http://www.google.com/calendar/event?"
         + ["action=TEMPLATE",
            "text=" + encodeURIComponent(text1),
            "dates=" + stripTimestamp(slot.start)
               + "/" + stripTimestamp(slot.end),
            "details=" + encodeURIComponent("For meeting details, click here: " + text2),
            "location=" + encodeURIComponent(locationText(slot.location)),
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

  function viewOfTimeAndPlace(x) {
    var view = $("<div/>");

    var meetingTime = $("<div id='meeting-time'/>")
      .appendTo(view);
    var clock = $("<img id='clock'/>")
        .appendTo(meetingTime);
    svg.loadImg(clock, "/assets/img/clock.svg");
    var time1 = $("<div id='time1'/>")
      .appendTo(meetingTime);
    var time2 = $("<div id='time2'/>")
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

    var locText = locationText(x.location);
    if (locText) {
      loc.append(html.text(locText));
    } else {
      loc.append("Location TBD")
         .addClass("tbd")
    }

    meetingLoc.click(function() {
      window.open("http://maps.google.com");
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

    var googleIcon = $("<img id='google-icon'/>");
    var google = $("#google")
      .append(googleIcon)
      .append("<div class='calendar-type'>Google Calendar</div>");
    svg.loadImg(googleIcon, "/assets/img/google.svg");
    $(document).on("click", "#google", function() {
      $('[data-toggle="popover"]').click();
      window.open(googleCalendarURL(ta.task_calendar_title,
                                    window.location,
                                    x));
    })

    var outlookIcon = $("<img id='outlook-icon'/>");
    var outlook = $("#outlook")
      .append(outlookIcon)
      .append("<div class='calendar-type'>Outlook Calendar</div>");
    svg.loadImg(outlookIcon, "/assets/img/outlook.svg");

    var apple = $("#apple")
      .append($("<img id='apple-icon' src='/assets/img/apple.png'/>"))
      .append("<div class='calendar-type'>Apple Calendar</div>");

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

  function viewOfCalendarOption(choice, answers) {
    var slotView = $("<div class='suggestion'/>");
    var checkbox = $("<img class='suggestion-checkbox'/>");
    slotView.append(checkbox);
    svg.loadImg(checkbox, "/assets/img/checkbox.svg");
    slotView.append(viewOfTimeAndPlace(choice.slot));
    slotView.click(function() {
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
    var submitButton = $("<button class='btn btn-primary'>Submit</button>");
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
      api.postChatItem(item);
    });
    return submitButton;
  }

/*** SAVE FOR MEETING OPTIONS ***/

  // function viewOfCalendarSlot(x) {
  //   var view = $("<div class='sug-details'/>");

  //   var t1 = date.ofString(x.start);
  //   var t2 = date.ofString(x.end);

  //   var row1 = $("<div class='day-text'/>")
  //     .text(date.weekDay(t1) + " ")
  //     .appendTo(view);

  //   var row2 = $("<div class='date-text'/>")
  //     .text(date.dateOnly(t1))
  //     .appendTo(view);

  //   var fromTime = wordify(date.timeOnly(t1));
  //   var toTime = wordify(date.timeOnly(t2));

  //   if (fromTime.charAt(fromTime.length-2) === toTime.charAt(toTime.length-2))
  //     fromTime = fromTime.substr(0, fromTime.length-3);

  //   var row3 = $("<div class='time-text'/>")
  //     .append(html.text("from "))
  //     .append($("<b>").text(fromTime))
  //     .append(html.text(" to "))
  //     .append($("<b>").text(toTime))
  //     .appendTo(view);

  //   var row4 = $("<div class='time-text-short hide'/>")
  //     .append(html.text("at "))
  //     .append($("<b>").text(date.timeOnly(t1)))
  //     .appendTo(view);

  //   var locText = locationText(x.location);
  //   var locDiv = $("<div class='loc-text'/>");
  //   var pin = $("<img class='pin'/>");
  //     pin.appendTo(locDiv);
  //   svg.loadImg(pin, "/assets/img/pin.svg");
  //   if (locText) {
  //     locDiv.append(html.text(locText))
  //           .appendTo(view);
  //   } else {
  //     locDiv.append("Location TBD")
  //           .addClass("tbd")
  //           .appendTo(view);
  //   }

  //   return view;
  // }

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
                  // .append(googleCalendarLink(
                  //               googleCalendarURL(ta.task_calendar_title,
                  //               window.location,
                  //               state.reserved.slot)))
                  .append($("<div class='task-section-header'/>").text("GUESTS"));
          var participantListView = $("<ul/>");
          list.iter(ta.task_participants.organized_for, function(uid) {
            var name = profile.fullName(profs[uid].prof);
            participantListView.append($("<li class='guest-name-row'/>").text(name));
          });
          taskView.append(participantListView);
          taskView.append($("<div class='task-section-header'/>").text("NOTES"));
          taskView.append("This feature is coming soon.");
          taskView.append($("<div class='task-section-header'/>").text("MESSAGES"));
          $("#messages").removeClass("hide");
        } else if (state.calendar_options.length > 0) {
          taskView.append($("<p id='meeting-title'/>").text("Select the options that work for you."))
          var answers = {};
          list.iter(state.calendar_options, function(choice) {
            taskView.append(viewOfCalendarOption(choice, answers));
          });
          taskView.append(submitButton(answers));
          $("#messages").addClass("hide");
        }
      }

      observable.onTaskModified.observe("guest-task", mod.loadTask);
    });
  }

  return mod;
}();
