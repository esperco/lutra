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

  function viewOfCalendarSlot(x) {
    var view = $("<div class='sug-details'/>");

    var t1 = date.ofString(x.start);
    var t2 = date.ofString(x.end);

    var row1 = $("<div class='day-text'/>")
      .text(date.weekDay(t1) + " ")
      .appendTo(view);

    var row2 = $("<div class='date-text'/>")
      .text(date.dateOnly(t1))
      .appendTo(view);

    var fromTime = wordify(date.timeOnly(t1));
    var toTime = wordify(date.timeOnly(t2));

    if (fromTime.charAt(fromTime.length-2) === toTime.charAt(toTime.length-2))
      fromTime = fromTime.substr(0, fromTime.length-3);

    var row3 = $("<div class='time-text'/>")
      .append(html.text("from "))
      .append($("<b>").text(fromTime))
      .append(html.text(" to "))
      .append($("<b>").text(toTime))
      .appendTo(view);

    var row4 = $("<div class='time-text-short hide'/>")
      .append(html.text("at "))
      .append($("<b>").text(date.timeOnly(t1)))
      .appendTo(view);

    var locText = locationText(x.location);
    var locDiv = $("<div class='loc-text'/>");
    var pin = $("<img class='pin'/>");
      pin.appendTo(locDiv);
    svg.loadImg(pin, "/assets/img/pin.svg");
    if (locText) {
      locDiv.append(html.text(locText))
            .appendTo(view);
    } else {
      locDiv.append("Location TBD")
            .addClass("tbd")
            .appendTo(view);
    }

    return view;
  }

  mod.loadTask = function(ta) {
    var taskView = $("#task-content");
    taskView.children().remove();

    taskView.append($("<p/>").text(ta.task_status.task_title));

    if ("Scheduling" === variant.cons(ta.task_data)) {
      var state = ta.task_data[1];
      if (state.reserved) {
        taskView.append(viewOfCalendarSlot(state.reserved.slot));
      }
    }

    taskView.append($("<p/>").text("Guests"));
    var participantListView = $("<ul/>");
    profile.profilesOfTaskParticipants(ta).done(function(profs) {
      list.iter(ta.task_participants.organized_for, function(uid) {
        var name = profile.fullName(profs[uid].prof);
        participantListView.append($("<li/>").text(name));
      });
    });
    taskView.append(participantListView);

    observable.onTaskModified.observe("guest-task", mod.loadTask);
  }

  return mod;
}();
