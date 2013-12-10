/*
  Scheduling step 2
*/

var sched2 = (function() {
  var mod = {};

  var step2Selector = show.create(["sched-step2-connect",
                                   "sched-step2-prefs"]);

  // Set in loadStep2Prefs, used by geocodeAddress
  var timeZoneDropdown = null;

  // Set in initializeGoogleMap, used by geocodeAddress
  var googleMap = null;

  // Set in initializeGoogleMap, used by geocodeAddress
  var addressMarker = null;

  function loadSuggestions(profs, task, meetingParam) {
    var state = sched.getState(task);
    state.meeting_request = meetingParam;
    api.getSuggestions(meetingParam)
      .done(function(x) { refreshSuggestions(profs, task, x); });
  }

  function clearLocation() {
    var title = $("#sched-step2-loc-title");
    var addr = $("#sched-step2-loc-addr");
    var instr = $("#sched-step2-loc-instr");

    title.val("");
    addr.val("");
    instr.val("");
  }

  function getLocation(tz) {
    return {
      title: $("#sched-step2-loc-title").val(),
      address: $("#sched-step2-loc-addr").val(),
      instructions: $("#sched-step2-loc-instr").val(),
      timezone: tz
    };
  }

  function initMeetingParam(task) {
    var location = getLocation("US/Pacific");
    return {
      participants: task.task_participants.organized_for,
      location: [location],
      on_site: true
    };
    /* uninitialized but required:
         how_soon, duration, buffer_time */
    /* uninitialized and optional:
         meeting_type, time_of_day_type, time_of_day */
  }

  function clearSuggestions() {
    var view = $("#sched-step2-suggestions");
    view.children().remove();
  }

  function refreshSuggestions(profs, task, x) {
    var view = $("#sched-step2-suggestions");
    view.addClass("hide");
    clearSuggestions();

    var contMsg =
      $("<div>Select up to 3 options to present to participants.</div>")
      .appendTo(view);

    /* maintain a list of at most 3 selected items, first in first out */
    var selected = [];

    var contButton = $(".sched-step2-next")
      .click(function() {
        var slots = list.map(selected, function(v) { return v[1].slot; });
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

    list.iter(x.suggestions, function(slot, k) {
      var slotView = $("<div class='suggestion' />");
      var checkbox = $("<img class='esper-checkbox'/>");
      svg.loadImg(checkbox, "/assets/img/checkbox.svg");
      var sugDetails = sched.viewOfSuggestion(slot);
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
              slotView.removeClass("esper-checkbox-selected")
            },
          };
          slotView.addClass("esper-checkbox-selected");
          select(k, v);
        }
      });

      checkbox.appendTo(slotView);
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
  function selectCalendarSlots(profs, task, slots) {
    var x = task.task_data[1];
    x.scheduling_stage = "Coordinate";
    /* TODO: reserve calendar slots for leader of organizing team,
             unreserve previously-reserved calendar slots */
    x.calendar_options = labelSlots(slots);

    /* reset further fields */
    delete x.availabilities;
    delete x.reserved;

    api.postTask(task)
      .done(function(task) { sched.loadStep3(profs, task); });
  }

  function loadStep2Prefs(tzList, profs, task) {
    var view = $("#sched-step2-pref-time");
    view.children().remove();

    /* all times and durations given in minutes, converted into seconds */
    function initTimes(x,
                       lengthMinutes, bufferMinutes,
                       optEarliest, optLatest) {
      x.duration = 60 * lengthMinutes;
      x.buffer_time = 60 * bufferMinutes;
      if (util.isDefined(optEarliest) && util.isDefined(optLatest))
        x.time_of_day = {
          start: timeonly.ofMinutes(optEarliest),
          length: 60 * (optLatest - optEarliest)
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
                75, 15, hour(12,00), hour(13,30));

    var dinner =
      initTimes({ meeting_type: "Dinner" },
                90, 30, hour(18,00), hour(20,30));

    var nightlife =
      initTimes({ meeting_type: "Nightlife" },
                120, 30, hour(19), hour(22));

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
                45, 15, hour(8), hour(11));

    var afternoon =
      initTimes({ time_of_day_type: "Afternoon"},
                45, 15, hour(13), hour(18));

    var late_night =
      initTimes({ time_of_day_type: "Late_night" },
                45, 15, hour(19), hour(22));

    /* inter-dependent dropdowns for setting scheduling constraints */
    var sel1, sel2, sel3, sel4;

    /* value holding the current scheduling constraints;
       an event is fired each time it changes */
    var meetingParam = initMeetingParam(task);

    /* read values from selectors 1-4 and update the meetingParam */
    function mergeSelections() {
      var old = meetingParam;
      var x = initMeetingParam(task);
      util.addFields(x, sel1.get());
      var loc = getLocation();
      loc.timezone = sel2.get();
      x.location[0] = loc;
      util.addFields(x, sel3.get());
      x.how_soon = sel4.get();
      meetingParam = x;
      if (! equalMeetingParam(old, meetingParam))
        loadSuggestionsIfReady(profs, task, meetingParam);
    }

    /* try to match the duration selected as part of the meeting type (sel1)
       with the duration selector (sel3) */
    function action1(x) {
      if (util.isDefined(x)) {
        var k = ((x.duration + x.buffer_time) / 60).toString();
        sel3.set(k);
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
    var sel1 = select.create({
      options: [
        opt("Select one"),
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

    /* time zone */
    var tzOptions =
      list.map(tzList, function(tz) { return { label: tz, value: tz }; });
    var sel2 = select.create({
      defaultAction: action2,
      options: tzOptions,
    });
    timeZoneDropdown = sel2;

    /* duration and buffer time specified in minutes, converted to seconds */
    function dur(dur,buf) {
      return { duration: 60 * dur,
               buffer_time: 60 * buf };
    }
    var sel3 = select.create({
      defaultAction: action3,
      options: [
        { label: "60 min", key: "60", value: dur(45,15) },
        { label: "45 min", key: "45", value: dur(30,15) },
        { label: "30 min", key: "30", value: dur(25,5) },
        { label: "15 min", key: "15", value: dur(10,5) },
        { label: "1 hour 15 min",  key: "75", value: dur(60,15) },
        { label: "1 hour 30 min",  key: "90", value: dur(75,15) },
        { label: "2 hours",        key: "120", value: dur(105,15) },
        { label: "2 hours 30 min", key: "150", value: dur(120,30) }
      ]
    });

    /* urgency */
    var sel4 = select.create({
      defaultAction: action4,
      options: [
        { label: "Within 2 weeks", key: "2weeks", value: 14 * 86400 },
        { label: "Within 1 week", key: "1week", value: 7 * 86400 },
        { label: "Within 2 days", key: "2days", value: 2 * 86400 },
        { label: "Today", key: "12hours", value: 12 * 3600 },
      ]
    });

    var grid = $("<div class='row'/>")
      .appendTo(view);

    var col1 = $("<div class='col-md-6'/>")
      .appendTo(grid);

    var col2 = $("<div class='col-md-6'/>")
      .appendTo(grid);

    var cell1 = $("<div>Type </div>")
      .appendTo(col1);
    var cell2 = $("<div>Time Zone </div>")
      .appendTo(col2);
    var cell3 = $("<div>Duration </div>")
      .appendTo(col1);
    var cell4 = $("<div>Urgency </div>")
      .appendTo(col2);

    sel1.view.appendTo(cell1);
    sel2.view.appendTo(cell2);
    sel3.view.appendTo(cell3);
    sel4.view.appendTo(cell4);

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
    var leaderUid = login.data.team.team_leaders[0];
    api.getCoordinates(leaderUid, address)
      .done(function(coords) {
        var geocoded = new google.maps.LatLng(coords.lat, coords.lon);
        addressMarker.setPosition(geocoded);
        addressMarker.setMap(googleMap);
        googleMap.panTo(geocoded);
        api.getTimezone(leaderUid, coords.lat, coords.lon)
          .done(function(tz) {
            timeZoneDropdown.set(tz, true);
          })
      })
  }

  mod.load = function(tzList, profs, task) {
    clearLocation();
    initializeGoogleMap();
    util.afterTyping($("#sched-step2-loc-addr"), 1000, geocodeAddress);
    connectCalendar(tzList, profs, task);
    clearSuggestions();
  };

  return mod;
}());
