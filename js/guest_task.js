var guestTask = function() {
  var mod = {};

  function viewOfFeedback() {
    var view = $("<div/>");

    var checkCircle = $("<div id='check-circle' class='animated'/>");
    var check = $("<img id='submitted-check'/>");
    checkCircle.append(check);
    svg.loadImg(check, "/assets/img/check.svg");

    var message = $("<div id='feedback-message'/>")
      .append(checkCircle)
      .append("Your selections have been submitted.")
      .appendTo(view);

    var back = $("<img id='submitted-back'/>");
    var change = $("<div id='edit-selections'/>")
      .append(back)
      .append($("<span id='edit-selections-text'>Edit selections</span>"))
      .appendTo(view);
    svg.loadImg(back, "/assets/img/back.svg");

    change.click(function() {
      $("#check-circle").removeClass("pulse");
      $("#feedback").addClass("hide");
      $("#guest-select").removeClass("hide");
    })

    return view;
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

  function getDirections(x) {
    return "http://maps.google.com/?daddr="
      + x.location.coord.lat + "," + x.location.coord.lon;
  }

  function viewOfLocationOnly(x) {
    var view = $("<div id='address'/>");

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

  function viewOfGuestRow(x, myName) {
    var view = $("<div class='guest-row clearfix'/>");

    var main = $("<div class='guest-main col-sm-5'/>")
      .appendTo(view);
    var name = profile.fullName(x);
    var nameDiv = $("<div class='guest-name ellipsis'/>")
      .append(name)
      .appendTo(main);
    if (name === myName) {
      nameDiv.append($("<span id='me-label'>me</span>"));
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

    var locText = "hello";
    // chat.locationText(x.location);
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

  function googleCalendarURL(text1, text2, slot) {
    return "http://www.google.com/calendar/event?"
         + ["action=TEMPLATE",
            "text=" + encodeURIComponent(text1),
            "dates=" + stripTimestamp(slot.start_utc, slot.start)
               + "/" + stripTimestamp(slot.end_utc,   slot.end),
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
      .append($("<div id='add-cal-text'>ADD TO CALENDAR</div>"));
    svg.loadImg(addCal, "/assets/img/plus-sm.svg");

    var google = $("#google");
    $(document).on("click", "#google", function() {
      $('[data-toggle="popover"]').click();
      window.open(googleCalendarURL(x.calendar_event_title,
                                    window.location,
                                    x.reserved.slot));
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
      .append(addToCalendar(ta, state));
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
    var answers = {};

    function submitButton() {
      var submitButton = $("<button/>", {
        "id":"submit-selections",
        "class":"btn btn-primary btn-primary-disabled",
        "text":"Submit"
      });
      submitButton.click(function() {
        var noneWorks = $("#option-none").hasClass("checkbox-selected")
                        ? $("#option-none-text").text().trim() : "";
        var message = join(noneWorks, "\n\n", $("#comment").val().trim());
        function postMessage(reply) {
          if (message.length > 0) {
            var item = {
              chatid: login.myChatid(),
              by:     login.me(),
              "for":  login.me(),
              in_reply_to: reply,
              chat_item_data: ["Message", message]
            };
            chat.postChatItem(item);
          }
        }

        var sel = list.ofTable(answers);
        if (sel.length <= 0) {
          postMessage(null);
        } else {
          var item = {
            chatid: login.myChatid(),
            by:     login.me(),
            "for":  login.me(),
            chat_item_data: ["Scheduling_r", {selected:sel}]
          };
          chat.postChatItem(item).done(function(item) {
            postMessage(item.id);
          });
        }

        $("#guest-select").addClass("hide");
        $("#feedback").removeClass("hide");
        $("#check-circle").addClass("pulse");
      });
      return submitButton;
    }

    function viewOfNoneWorks(options) {
      var slotView = $("<tr id='option-none'/>");
      var select = $("<td class='option-select'/>")
        .appendTo(slotView);
      var info = $("<td id='option-none-text'/>")
        .append("None of the above")
        .appendTo(slotView);

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

    function viewOfCalendarOption(choice, label, typ) {
      var slotView = $("<tr class='option'/>");
      var select = $("<td class='option-select'/>")
        .appendTo(slotView);
      var info = $("<td class='option-info'/>")
        .appendTo(slotView);

      var checkboxContainer = $("<div class='checkbox-container'/>");
      var checkbox = $("<img/>");
      select.append(checkboxContainer.append(checkbox));
      svg.loadImg(checkbox, "/assets/img/checkbox.svg");

      var optionLetter = $("<div class='option-letter'/>")
        .text(label)
        .appendTo(select);

      var what = $("<div class='info-row'/>")
        .appendTo(info);
      var whatLabel = $("<div class='info-label'/>")
        .text("WHAT")
        .appendTo(what);
      var meetingType = $("<div class='info'/>")
        .text(typ)
        .appendTo(what);

      var when = $("<div class='info-row'/>")
        .appendTo(info);
      var whenLabel = $("<div class='info-label'/>")
        .text("WHEN")
        .appendTo(when);
      var time = viewOfTimeOnly(choice.slot)
        .addClass("info")
        .appendTo(when);

      var where = $("<div class='info-row'/>")
        .appendTo(info);
      var whereLabel = $("<div class='info-label'/>")
        .text("WHERE")
        .appendTo(where);
      var loc = viewOfLocationOnly(choice.slot)
        .addClass("info")
        .appendTo(where);

      var notes = $("<div class='info-row hide'/>")
        .appendTo(info);
      var notesLabel = $("<div class='info-label'/>")
        .text("NOTES")
        .appendTo(notes);
      var notesText = $("<div class='info'/>")
        // .text("Test")
        .appendTo(notes);
      if (notesText.text() != "") {
        notes.removeClass("hide");
      }

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

      return slotView;
    }

    profile.profilesOfTaskParticipants(ta).done(function(profs) {
      var taskView = $("#meeting-content");
      taskView.children().remove();
      var taskWelcome = $("#meeting-welcome");
      taskWelcome.text("");

      var myName = profile.fullName(profs[login.me()].prof);
      taskWelcome.text("Hello, " + myName);

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
          var participantListView = $("<div id='guests'/>");
          list.iter(ta.task_participants.organized_for, function(uid) {
            participantListView.append(viewOfGuestRow(profs[uid].prof, myName));
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
          $("#chat").removeClass("hide");
          svg.loadImg(guestsIcon, "/assets/img/group.svg");
          svg.loadImg(notesIcon, "/assets/img/edit.svg");
          svg.loadImg(messagesIcon, "/assets/img/chat.svg");
        } else if (state.calendar_options.length > 0) {
          var select = $("<div id='guest-select'/>")
            .append($("<div id='options-title'/>")
              .text("When can you meet with " + "HOST_NAME" + "?"))
            .appendTo(taskView);
          var options = $("<table id='options'/>")
            .appendTo(select);
          var typ = meetingType(state);
          list.iter(state.calendar_options, function(choice, i) {
            var label = indexLabel(i);
            options.append(viewOfCalendarOption(choice, label, typ));
          });
          options.append(viewOfNoneWorks(state.calendar_options));
          select.append($("<div id='comment-header'/>")
                .text("COMMENT"))
                .append($("<textarea id='comment' class='form-control'/>"))
          select.append(submitButton());

          var feedback = $("<div id='feedback' class='hide'/>")
            .append(viewOfFeedback)
            .appendTo(taskView);

          $("#chat").addClass("hide");
        }
      }

      observable.onTaskModified.observe("guest-task", mod.loadTask);
    });
  }

  return mod;
}();
