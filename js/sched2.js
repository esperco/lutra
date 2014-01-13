/*
  Scheduling step 2
*/

var sched2 = (function() {
  var mod = {};

  var step2Selector = show.create({
    "sched-step2-connect": {ids: ["sched-step2-connect"]},
    "sched-step2-prefs": {ids: ["sched-step2-prefs"]}
  });

  // Set in loadStep2Prefs, used by geocodeAddress
  var timeZoneDropdown = null;

  // Set in initializeGoogleMap, used by geocodeAddress
  var googleMap = null;

  // Set in initializeGoogleMap, used by geocodeAddress
  var addressMarker = null;

  function loadSuggestions(profs, task, meetingParam) {
    clearSuggestions();
    var state = sched.getState(task);
    state.meeting_request = meetingParam;
    api.getSuggestions(meetingParam)
      .done(function(x) {
        refreshSuggestions(profs, task, x);
      });
  }

  function clearLocation() {
    var addr = $("#sched-step2-loc-addr");
    addr.val("");
  }

  function getLocation() {
    return {
      title: "",
      address: $("#sched-step2-loc-addr").val(),
      instructions: "",
      timezone: timeZoneDropdown.get()
    };
  }

  function initMeetingParam(task) {
    return {
      participants: task.task_participants.organized_for,
      on_site: true
    };
    /* uninitialized but required:
         how_soon, duration, buffer_time */
    /* uninitialized and optional:
         meeting_type, time_of_day_type, time_of_day */
  }

  function clearSuggestions() {
    $(".sched-step2-next").addClass("disabled");
    $("#sched-step2-suggestions").children().remove();
  }

  function refreshSuggestions(profs, task, x) {
    clearSuggestions();
    var view = $("#sched-step2-suggestions");
    view.addClass("hide");

    /* maintain a list of at most 3 selected items, first in first out */
    var selected = [];

    var contButton = $(".sched-step2-next")
      .unbind('click')
      .click(function() {
        var slots = list.map(selected, function(v) { return v[1].slot; });
        slots.sort(function(a, b) {
          return date.ofString(a.start) - date.ofString(b.start);
        });
        selectCalendarSlots(profs, task, slots);
      });

    function updateContButton() {
      if (selected.length > 0) {
        contButton.removeClass("disabled");
      }
      else {
        contButton.addClass("disabled");
      }
    }

    function remove(k) {
      delete selected[k];
      var a = [];
      for (var i in selected)
        a.push(selected[i]);
      selected = a;
    }

    function unselect(kv, i) {
      if (util.isArray(kv)) {
        kv[1].untick();
        remove(i);
      }
      updateContButton();
    }

    function select(k, v) {
      if (selected.length === 3)
        unselect(selected[2], 2);
      selected.push([k, v]);
      updateContButton();
    }

    /* sort by increasing date */
    var suggestions =
      x.suggestions.sort(function(x1, x2) {
        var d1 = date.ofString(x1.slot.start).getTime();
        var d2 = date.ofString(x2.slot.start).getTime();
        if (d1 < d2)
          return -1;
        else if (d1 === d2)
          return 0;
        else
          return 1;
      });

    list.iter(suggestions, function(res, k) {
      var score = res.score;
      var slot = res.slot;
      var slotView = $("<div class='suggestion'/>");
      var checkbox = $("<img class='suggestion-checkbox'/>")
        .appendTo(slotView);
      svg.loadImg(checkbox, "/assets/img/checkbox.svg");
      var sugDetails = sched.viewOfSuggestion(slot, score);
      var editTooltip = $("<a class='suggestion-edit-div'/>")
        .tooltip({"title":"Edit","placement":"left"})
        .appendTo(slotView);
      var edit = $("<img class='suggestion-edit'/>")
        .appendTo(editTooltip);
      svg.loadImg(edit, "/assets/img/edit.svg");
      edit.click(function() {
      });
      slotView.click(function() {
        var index;
        var kv = list.find(selected, function(kv, i) {
          index = i;
          return util.isArray(kv) && kv[0] === k;
        });
        if (kv !== null)
          unselect(kv, index);
        else {
          var v = {
            slot: slot,
            untick: function() {
              slotView.removeClass("checkbox-selected")
            },
          };
          slotView.addClass("checkbox-selected");
          select(k, v);
        }
      });

      sugDetails.appendTo(slotView);
      slotView.appendTo(view);
    });

    view.removeClass("hide");
  }

  function loadSuggestionsIfReady(profs, task, meetingParam) {
    /* check for possibly missing fields
       to make a valid suggest_meeting_request */
    if (util.isDefined(meetingParam.how_soon)
        && util.isDefined(meetingParam.duration)
        && util.isDefined(meetingParam.buffer_time))
      loadSuggestions(profs, task, meetingParam);
  }

  function labelSlots(slots) {
    return list.map(slots, function(x) {
      return {
        label: util.randomString(),
        slot: x
      };
    });
  }

  /* Record the options for the meeting selected by the user
     and move on to step 3. */
  function selectCalendarSlots(profs, ta, slots) {
    var x = ta.task_data[1];
    ta.task_status.task_progress = "Coordinating"; // status in the task list
    x.scheduling_stage = "Coordinate"; // step in the scheduling page

    /* TODO: reserve calendar slots for leader of organizing team,
             unreserve previously-reserved calendar slots */
    x.calendar_options = labelSlots(slots);

    /* reset further fields */
    delete x.availabilities;
    delete x.reserved;

    api.postTask(ta)
      .done(function(task) { sched.loadStep3(profs, task); });
  }

  function loadStep2Prefs(tzList, profs, task) {
    var view = $("#sched-step2-pref-time");
    view.children().remove();
    var viewTimeZone = $("#sched-step2-time-zone");
    viewTimeZone.children().remove();

    /* all times and durations given in minutes, converted into seconds */
    function initTimes(x,
                       lengthMinutes, bufferMinutes,
                       optMinStart, optMaxEnd) {
      x.duration = 60 * lengthMinutes;
      x.buffer_time = 60 * bufferMinutes;
      if (util.isDefined(optMinStart) && util.isDefined(optMaxEnd))
        x.time_of_day = {
          start: timeonly.ofMinutes(optMinStart),
          length: 60 * (optMaxEnd - optMinStart)
        };
      return x;
    }

    /* time only, in minutes from midnight */
    function hour(h,m) {
      var x = 0;
      x = x + 60 * h;
      if (m > 0)
        x = x + m;
      return x;
    }

    function equalMeetingParam(a, b) {
      /* this will return false if the field order differs */
      return JSON.stringify(a) === JSON.stringify(b);
    }

    var breakfast =
      initTimes({ meeting_type: "Breakfast" },
                75, 15, hour(8), hour(10,30));

    var lunch =
      initTimes({ meeting_type: "Lunch" },
                75, 15, hour(12,00), hour(14,30));

    var dinner =
      initTimes({ meeting_type: "Dinner" },
                90, 30, hour(18,00), hour(21,30));

    var nightlife =
      initTimes({ meeting_type: "Nightlife" },
                120, 30, hour(19), hour(01));

    var coffee =
      initTimes({ meeting_type: "Coffee" },
                30, 15);

    var call =
      initTimes({ meeting_type: "Call" },
                25, 5, hour(7), hour(20));

    var meeting =
      initTimes({}, 45, 15);

    var morning =
      initTimes({ time_of_day_type: "Morning" },
                45, 15, hour(8), hour(12));

    var afternoon =
      initTimes({ time_of_day_type: "Afternoon"},
                45, 15, hour(13), hour(19));

    var late_night =
      initTimes({ time_of_day_type: "Late_night" },
                45, 15, hour(19), hour(23));

    /* inter-dependent dropdowns for setting scheduling constraints */
    var sel1, sel2, sel3, sel4;

    /* value holding the current scheduling constraints;
       an event is fired each time it changes */
    var meetingParam;

    /* read values from selectors 1-4 and update the meetingParam */
    function mergeSelections() {
      var old = meetingParam;
      var x = initMeetingParam(task);
      util.addFields(x, sel1.get());
      x.location = [getLocation()];
      util.addFields(x, sel2.get());
      x.how_soon = sel3.get();
      meetingParam = x;
      if (! equalMeetingParam(old, meetingParam))
        loadSuggestionsIfReady(profs, task, meetingParam);
    }

    /* try to match the duration selected as part of the meeting type (sel1)
       with the duration selector (sel2) */
    function action1(x) {
      if (util.isDefined(x)) {
        var k = ((x.duration + x.buffer_time) / 60).toString();
        sel2.set(k);
        mergeSelections();
      }
    }

    function action2(x) {
      mergeSelections();
    }

    function action3(x) {
      mergeSelections();
    }

    function action4(x) {
      mergeSelections();
    }

    /* type of meeting */
    function opt(label, key, value, action) {
      return { label: label, key: key, value: value, action: action };
    }
    sel1 = select.create({
      divClass: "fill-div",
      buttonClass: "fill-div",
      options: [
        opt("Breakfast", "breakfast", breakfast, action1),
        opt("Lunch", "lunch", lunch, action1),
        opt("Dinner", "dinner", dinner, action1),
        opt("Night life", "nightlife", nightlife, action1),
        opt("Coffee", "coffee", coffee, action1),
        opt("Phone call", "call", call, action1),
        opt("Meeting (Any time)", "meeting", meeting, action1),
        opt("Meeting (Morning)", "morning", morning, action1),
        opt("Meeting (Afternoon)", "afternoon", afternoon, action1),
        opt("Meeting (Evening)", "late_night", late_night, action1)
      ]
    });

    /* duration and buffer time specified in minutes, converted to seconds */
    function dur(dur,buf) {
      return { duration: 60 * dur,
               buffer_time: 60 * buf };
    }
    sel2 = select.create({
      divClass: "fill-div",
      buttonClass: "fill-div",
      defaultAction: action2,
      options: [
        { label: "15 min", key: "15", value: dur(10,5) },
        { label: "30 min", key: "30", value: dur(25,5) },
        { label: "45 min", key: "45", value: dur(30,15) },
        { label: "1 hour", key: "60", value: dur(45,15) },
        { label: "1 hour 15 min",  key: "75", value: dur(60,15) },
        { label: "1 hour 30 min",  key: "90", value: dur(75,15) },
        { label: "2 hours",        key: "120", value: dur(105,15) },
        { label: "2 hours 30 min", key: "150", value: dur(120,30) }
      ]
    });

    /* urgency */
    sel3 = select.create({
      divClass: "fill-div",
      buttonClass: "fill-div",
      defaultAction: action3,
      initialKey: "2weeks",
      options: [
        { label: "Within 6 months", key: "6months", value: 183 * 86400 },
        { label: "Within 2 months", key: "2months", value: 61 * 86400 },
        { label: "Within 1 month", key: "1month", value: 31 * 86400 },
        { label: "Within 2 weeks", key: "2weeks", value: 14 * 86400 },
        { label: "Within 1 week", key: "1week", value: 7 * 86400 },
        { label: "Within 2 days", key: "2days", value: 2 * 86400 },
        { label: "Today", key: "12hours", value: 12 * 3600 },
      ]
    });

    /* time zone */
    var tzOptions =
      list.map(tzList, function(tz) { return { label: tz, value: tz }; });
    sel4 = select.create({
      divClass: "fill-div",
      buttonClass: "fill-div",
      defaultAction: action4,
      options: tzOptions,
    });
    timeZoneDropdown = sel4;

    var grid = $("<div/>")
      .appendTo(view);

    var colType = $("<div class='col-sm-4'/>")
      .appendTo(grid);
    var colDuration = $("<div class='col-sm-4'/>")
      .appendTo(grid);
    var colUrgency = $("<div class='col-sm-4'/>")
      .appendTo(grid);

    var optionType = $("<div class='pref-time-title'>Meeting Type</div>")
      .appendTo(colType);
    var optionDuration = $("<div class='pref-time-title'>Duration</div>")
      .appendTo(colDuration);
    var optionUrgency = $("<div class='pref-time-title'>Urgency</div>")
      .appendTo(colUrgency);
    var optionTimeZone = $("<div class='location-title'>Time Zone</div>")
      .appendTo(viewTimeZone);

    sel1.view.appendTo(colType);
    sel2.view.appendTo(colDuration);
    sel3.view.appendTo(colUrgency);
    sel4.view.appendTo(viewTimeZone);

    meetingParam = initMeetingParam(task);
    sel1.set("meeting");

    step2Selector.show("sched-step2-prefs");
  }

  /* hitting "Connect" takes the user to Google, then back here with
     a full reload */
  function promptForCalendar(obsProf, calInfo) {
    var view = $("#sched-step2-connect");
    view.children().remove();

    var prof = obsProf.prof;
    $("<div class='center-msg'/>")
      .text("Connect with " + prof.familiar_name + "'s Google Calendar")
      .appendTo(view);
    $("<div class='center-msg'/>")
      .text("to let Esper help you ﬁnd available times.")
      .appendTo(view);
    $("<a class='btn btn-default'>Connect</a>")
      .attr("href", calInfo.google_auth_url)
      .appendTo(view);

    step2Selector.show("sched-step2-connect");
  }

  function connectCalendar(tzList, profs, task) {
    var leaderUid = login.data.team.team_leaders[0];
    var result;
    if (! list.mem(task.task_participants.organized_for, leaderUid)) {
      result = deferred.defer(loadStep2Prefs(tzList, profs, task));
    }
    else {
      var authLandingUrl = document.URL;
      result = api.getCalendar(leaderUid, authLandingUrl)
        .then(function(calInfo) {
          if (!calInfo.has_calendar)
            promptForCalendar(profs[leaderUid], calInfo);
          else
            loadStep2Prefs(tzList, profs, task);
        });
    }
    return result;
  }

  function initializeGoogleMap() {
    var mapOptions = {
      center: new google.maps.LatLng(37.4485044, -122.159185),
      zoom: 12
    };
    var mapDiv = document.getElementById("sched-step2-google-map");
    googleMap = new google.maps.Map(mapDiv, mapOptions);
    addressMarker = new google.maps.Marker();
  }

  function geocodeAddress() {
    var address = $("#sched-step2-loc-addr").val();
    if (address == "") return;
    clearSuggestions();
    var leaderUid = login.data.team.team_leaders[0];
    api.getCoordinates(leaderUid, address)
      .done(function(coords) {
        var geocoded = new google.maps.LatLng(coords.lat, coords.lon);
        addressMarker.setPosition(geocoded);
        addressMarker.setMap(googleMap);
        googleMap.panTo(geocoded);
        api.getTimezone(leaderUid, coords.lat, coords.lon)
          .done(function(tz) {
            timeZoneDropdown.set(tz);
          })
      })
  }

  function saveLocationSelection(loc, refId) {
    api.postPlaceDetails(leaderUid, loc, refId)
      .done(function() { });
  }

  /* Boy does this function suck. Hooray for imperative programming!
   * If you can think of a better way to write this, be my guest! */
  function highlight(address, matches) {
    var withBold = "";
    for (var i = 0; i < address.length; i++) {
      var c = address[i];
      var wroteChar = false;
      for (var j = 0; j < matches.length; j++) {
        if (i == matches[j][0] + matches[j][1]) {
          withBold += "</b>";
        }
        if (i == 0 && matches[j][0] == 0) {
          withBold += "<b>";
        } else if (i == matches[j][0] - 1) {
          withBold += address.charAt(i) + "<b>";
          wroteChar = true;
        }
      }
      if (!wroteChar) { withBold += address.charAt(i); }
    }
    return withBold;
  }

  function displayPredictionsDropdown(predictions) {
    if (predictions.from_favorites.length == 0
        && predictions.from_google.length == 0) return;
    var leaderUid = login.data.team.team_leaders[0];
    var menu = $("#location-dropdown-menu");
    menu.children().remove();

    if (predictions.from_favorites.length > 0) {
      $('<li role="presentation" class="dropdown-header"/>')
        .text("Favorite Locations")
        .appendTo(menu);

      list.iter(predictions.from_favorites, function(item) {
        var bolded = highlight(item.loc.address, [item.matched_substring]);
        var li = $('<li role="presentation"/>')
          .appendTo(menu);
        $('<a role="menuitem" tabindex="-1" href="#"/>')
          .html(bolded)
          .appendTo(li)
          .click(function() {
            $("#sched-step2-loc-addr").val(item.loc.address);
            api.postSelectFavoritePlace(leaderUid, item.loc.address)
              .done(function(place) {
                timeZoneDropdown.set(place.loc.timezone);
                $('#location-dropdown-toggle').dropdown("toggle");
              });
            return false;
          });
      });
      $('<li role="presentation" class="divider"/>')
        .appendTo(menu);
    }

    $('<li role="presentation" class="dropdown-header"/>')
      .text("Suggestions from Google")
      .appendTo(menu);

    list.iter(predictions.from_google, function(item) {
      var bolded = highlight(item.description, item.matched_substrings);
      var li = $('<li role="presentation"/>')
        .appendTo(menu);
      $('<a role="menuitem" tabindex="-1" href="#"/>')
        .html(bolded)
        .appendTo(li)
        .click(function() {
          $("#sched-step2-loc-addr").val(item.description);
          api.postSelectGooglePlace(leaderUid, item.description, item.ref_id)
            .done(function(place) {
              timeZoneDropdown.set(place.loc.timezone);
              $('#location-dropdown-toggle').dropdown("toggle");
            });
          return false;
        });
    });

    var toggle = $('#location-dropdown-toggle');
    if (!toggle.parent().hasClass('open')) {
      toggle.dropdown("toggle");
    }
  }

  function predictAddress() {
    var address = $("#sched-step2-loc-addr").val();
    if (address == "") return;
    var leaderUid = login.data.team.team_leaders[0];
    api.getPlacePredictions(leaderUid, address)
      .done(displayPredictionsDropdown);
  }

  mod.load = function(tzList, profs, task) {
    clearLocation();
    initializeGoogleMap();
    util.afterTyping($("#sched-step2-loc-addr"), 250, predictAddress);
    connectCalendar(tzList, profs, task);
  };

  return mod;
}());
