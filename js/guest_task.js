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
    return d.replace(/[\-:]|\.000/g, "");
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


  function googleMapsLink(x) {
    // var getDirections = $("<div>Get directions</div>");

    // var directionsURL = "http://maps.google.com/?daddr="
    //   + x.location.coord.lat + "," + x.location.coord.lon;

    // var directions =
    //   $("<a/>", {
    //     href: directionsURL,
    //     "class": ""
    //   }).appendTo(getDirections);

    // getDirections.click(function() { this.target = "_blank"; });

    // return getDirections;
  }

  function calendarOptions() {
  }

  function viewOfTimeAndPlace(x) {
    var meetingTime = $("<div id='meeting-time'/>");
    var meetingLoc = $("<div id='meeting-location'/>");
    var view = $("<div/>")
      .append(meetingTime)
      .append(meetingLoc);

    var t1 = date.ofString(x.start);
    var t2 = date.ofString(x.end);

    var fromTime = wordify(date.timeOnly(t1));
    var toTime = wordify(date.timeOnly(t2));

    if (fromTime.charAt(fromTime.length-2) === toTime.charAt(toTime.length-2))
      fromTime = fromTime.substr(0, fromTime.length-3);

    meetingTime
      .append(date.weekDay(t1).substring(0,3) + ", ")
      .append(date.dateOnly(t1) + " from ")
      .append($("<span id='time-text'>" + fromTime + " to " + toTime + "</span>"));

    var locText = locationText(x.location);
    if (locText) {
      meetingLoc.append("at ")
                .append(html.text(locText));
    } else {
      meetingLoc.append("Location TBD")
                .addClass("tbd")
    }

    return view;
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
      var taskView = $("#guest-task-content");
      taskView.children().remove();
      var taskWelcome = $("#guest-task-welcome");
      taskWelcome.children().remove();

      var myName = profile.fullName(profs[login.me()].prof);
      taskWelcome.append($("<p/>").text("Hello, " + myName));
      taskView.append($("<p id='guest-task-title'/>").text(ta.task_calendar_title));

      if ("Scheduling" === variant.cons(ta.task_data)) {
        var state = ta.task_data[1];
        if (state.reserved) {
          taskView.append(viewOfTimeAndPlace(state.reserved.slot));
          taskView.append(calendarOptions);
          taskView.append(googleMapsLink(state.reserved.slot));
          taskView.append(googleCalendarLink(
              googleCalendarURL(ta.task_calendar_title,
                                window.location,
                                state.reserved.slot)));
        }
      }

      taskView.append($("<div class='task-section-header'/>").text("GUESTS"));
      var participantListView = $("<ul/>");
      list.iter(ta.task_participants.organized_for, function(uid) {
        var name = profile.fullName(profs[uid].prof);
        participantListView.append($("<li class='guest-name-row'/>").text(name));
      });
      taskView.append(participantListView);

      taskView.append($("<div class='task-section-header'/>").text("NOTES"));
      taskView.append("This feature is coming soon.");

      taskView.append($("<div class='task-section-header'/>").text("MESSAGES"));
      taskView.append("This feature is coming soon.");

      observable.onTaskModified.observe("guest-task", mod.loadTask);
    });
  }

  return mod;
}();
