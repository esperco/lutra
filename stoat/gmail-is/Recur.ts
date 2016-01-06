module Esper.Recur {

  function defaultRecur() : ApiT.Recur {
    return {
      freq: "Daily",
      bysecond: [], byminute: [], byhour: [], byday: [], bymonthday: [],
      byyearday: [], byweekno: [], bymonth: [], bysetpos: []
    };
  }

  var currentRule = new Esper.Watchable.C<ApiT.Recur>(
    function (r) { return r !== undefined && r !== null; },
    defaultRecur()
  );

  /* Summarizing (translated from OCaml icalendar_recur.ml) */

  function summarizeWeekday(wday : ApiT.OrdWkDay) : string {
    var ord = wday.ord;
    if (ord) {
      var nth = "";
      if (ord === 1) nth = "first";
      else if (ord === 2) nth = "second";
      else if (ord === 3) nth = "third";
      else if (ord === 4) nth = "fourth";
      else if (ord === 5) nth = "fifth";
      else if (ord === -1) nth = "last";
      else if (ord === -2) nth = "second-to-last";
      else if (ord === -3) nth = "third-to-last"
      else throw new Error("Unsupported");
      var noOrd = { ord: null, day: wday.day };
      return "the " + nth + " " + summarizeWeekday(noOrd);
    } else {
      return wday.day;
    }
  }

  function hasAllWeekdays(l : ApiT.OrdWkDay[]) : boolean {
    var weekdays = [
      { day: "Monday" },
      { day: "Tuesday" },
      { day: "Wednesday" },
      { day: "Thursday" },
      { day: "Friday" }
    ];
    return List.forAll(weekdays, function(d) { return List.mem(l, d); });
  }

  function summarizeWeekdays(l : ApiT.OrdWkDay[]) : string {
    Log.assert(l.length > 0);
    if (l.length === 1) {
      return summarizeWeekday(l[0]);
    } else if (l.length === 2) {
      return summarizeWeekday(l[0]) + " and " + summarizeWeekday(l[1]);
    } else {
      if (hasAllWeekdays(l)) {
        return "weekdays";
      } else {
        var last = l.slice(-1)[0];
        var rest = l.slice(0, -1);
        return List.map(rest, summarizeWeekday).join(", ") +
          ", and " + summarizeWeekday(last);
      }
    }
  }

  function summarizeDate(d : [ApiT.DTConstr, string]) {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var m = moment(d[1]);
    return months[m.month()] + " " + m.date() + ", " + m.year();
  }

  type byFilter = [string] | [string, ApiT.OrdWkDay[]] | [string, number[]];

  function extractByFilter(period : ApiT.Freq, rule : ApiT.Recur) : byFilter {
    var otherFilters = [
      rule.bysecond, rule.byminute, rule.byhour, rule.byyearday,
      rule.byweekno, rule.bymonth, rule.bysetpos
    ];
    var byDay = List.map(rule.byday, function() { return 0; });
    var noFilter =
      List.forAll(otherFilters.concat(rule.bymonthday, byDay), function(x) {
        return x.length === 0;
      }) && (!rule.wkst || rule.wkst === "Sunday");
    var justByDay : [string, ApiT.OrdWkDay[]] =
      ( List.forAll(otherFilters.concat(rule.bymonthday), function(x) {
          return x.length === 0;
        }) && (!rule.wkst || rule.wkst === "Sunday")
      ) ?
      ["Byday", rule.byday] :
      null;
    var justByMonthDay : [string, number[]] =
      ( List.forAll(otherFilters.concat(byDay), function(x) {
          return x.length === 0;
        }) && (!rule.wkst || rule.wkst === "Sunday")
      ) ?
      ["Bymonthday", rule.bymonthday] :
      null;
    if (period === "Daily" && noFilter) {
      return ["No_filter"];
    } else if (period === "Weekly" && noFilter) {
      return ["No_filter"];
    } else if (period === "Weekly" && justByDay) {
      return justByDay;
    } else if (period === "Monthly" && justByDay && !justByMonthDay) {
      return justByDay;
    } else if (period === "Monthly" && !justByDay && justByMonthDay) {
      return justByMonthDay;
    } else if (period === "Yearly" && noFilter) {
      return ["No_filter"];
    } else {
      throw new Error("Unsupported");
    }
  }

  function summarizeIfSupported(rule : ApiT.Recur) {
    var interval = rule.interval;
    var period = rule.freq;
    var repeats = "";
    if (period === "Secondly" || period === "Minutely"
        || period === "Hourly") {
      throw new Error("Unsupported");
    }
    if (!interval) {
      if (period === "Yearly") {
        repeats = "Annually";
      } else {
        repeats = period;
      }
    } else {
      if (period === "Yearly") {
        repeats = "Every " + interval + " years";
      } else if (period === "Monthly") {
        repeats = "Every " + interval + " months";
      } else if (period === "Weekly") {
        repeats = "Every " + interval + " weeks";
      } else if (period === "Daily") {
        repeats = "Every " + interval + " days";
      }
    }
    var on = "";
    var byxxx = extractByFilter(period, rule);
    var tag = byxxx[0];
    if (period === "Daily") {
      // No ByXXX supported in interface for DAILY
    } else if (period === "Weekly") {
      if (tag === "No_filter") {
        // Leave on empty
      } else if (tag === "Byday") {
        var days = <ApiT.OrdWkDay[]> byxxx[1];
        on = " on " + summarizeWeekdays(days);
      }
    } else if (period === "Monthly") {
      if (tag === "Byday") {
        var days = <ApiT.OrdWkDay[]> byxxx[1];
        on = " on " + summarizeWeekdays(days);
      } else if (tag === "Bymonthday") {
        var modays = <number[]> byxxx[1];
        if (modays.length > 1) {
          throw new Error("Unsupported");
        } else {
          var moday = modays[0];
          if (moday > 0) {
            on = " on day " + moday;
          } else {
            throw new Error("Unsupported");
          }
        }
      } else {
        throw new Error("Unsupported");
      }
    } else if (period === "Yearly") {
      // No BYxxx supported in interface for YEARLY
    }
    var until = rule.until ? summarizeDate(rule.until) : "";
    var count = rule.count ? "" + rule.count : "";
    var extent = "";
    if (!until && !count) {
      // Leave extent empty
    } else if (until && !count) {
      extent = ", until " + until;
    } else if (!until && count) {
      extent = ", " + count + " times";
    }
    return repeats + on + extent;
  }

  export function summarize(rule : ApiT.Recur) : string {
    try { return summarizeIfSupported(rule); }
    catch (e) {
      if (e.name === "Error" && e.message === "Unsupported") {
        return "Custom rule";
      } else {
        throw e;
      }
    }
  }

  /* Update summary field of modal when currentRule changes.
     All the views below set currentRule when anything is modified,
     using a new rule read from the state of the modal. */
  currentRule.watch(function(rule, isValid) {
    Log.d("rule", rule);
    Log.d("isValid", isValid);
    if (isValid) {
      $(".esper-recur-summary").text(summarize(rule));
    }
  });


  /* Views */

  function currentModalState() : ApiT.Recur {
    var recur = defaultRecur();
    var freq = $("select.esper-recur-freq").val();
    var start = $(".esper-recur-start").val();
    recur.freq = freq;

    var interval = Number($("select.esper-recur-interval").val());
    if (interval > 1) recur.interval = interval;

    if ($("input.esper-recur-after").is(":checked")) {
      recur.count = Number($("input.esper-recur-count").val());
    } else if ($("input.esper-recur-on").is(":checked")) {
      var untilDate = $("input.esper-recur-until").val();
      var startUTCTime = $("input.esper-recur-start").data("utcTime");
      recur.until = ["Date_time", untilDate + "T" + startUTCTime];
    }

    if (freq === "Weekly") {
      $("input.esper-recur-day").each(function() {
        var it = $(this);
        if (it.is(":checked")) recur.byday.push({ day: it.val() });
      });
    } else if (freq === "Monthly") {
      if ($("input.esper-recur-month").is(":checked")) {
        recur.bymonthday = [moment(start).date()];
      } else if ($("input.esper-recur-week").is(":checked")) {
        var m = moment(start); // Remember, it's mutable :/
        var day = m.format("dddd");
        var startMonth = m.month();
        var ord;
        if (m.add("weeks", -1).month() !== startMonth) {
          ord = 1;
        } else if (m.add("weeks", -1).month() !== startMonth) {
          ord = 2;
        } else if (m.add("weeks", -1).month() !== startMonth) {
          ord = 3;
        } else if (m.add("weeks", -1).month() !== startMonth) {
          ord = 4;
        } else {
          ord = -1;
        }
        recur.byday = [{ ord: ord, day: day }];
      }
    }

    return recur;
  }

  function updateState() : void {
    currentRule.set(currentModalState());
  }

  function daysOfWeek(rule : ApiT.Recur) : JQuery {
'''
<span #view>
  <input type="checkbox" value="Sunday" class="esper-recur-day"/> S &nbsp;
  <input type="checkbox" value="Monday" class="esper-recur-day"/> M &nbsp;
  <input type="checkbox" value="Tuesday" class="esper-recur-day"/> T &nbsp;
  <input type="checkbox" value="Wednesday" class="esper-recur-day"/> W &nbsp;
  <input type="checkbox" value="Thursday" class="esper-recur-day"/> T &nbsp;
  <input type="checkbox" value="Friday" class="esper-recur-day"/> F &nbsp;
  <input type="checkbox" value="Saturday" class="esper-recur-day"/> S
</span>
'''
    List.iter(rule.byday, function(d) {
      view.find("input:checkbox[value=" + d.day + "]").prop("checked", true);
    });
    var startDay = moment($(".esper-recur-start").val()).format("dddd");
    view.find("input:checkbox[value=" + startDay + "]").prop("checked", true);
    view.find("input").click(updateState);
    return view;
  }

  function monthOrWeekChoice(rule : ApiT.Recur) : JQuery {
'''
<span #view>
  <input #month class="esper-recur-month" type="radio" name="monthOrWeek" value="month" checked/>
  day of the month &nbsp;
  <input #week class="esper-recur-week" type="radio" name="monthOrWeek" value="week"/>
  day of the week
</span>
'''
    if (rule.byday.length > 0) {
      month.prop("checked", true);
      week.prop("checked", false);
    } else if (rule.bymonthday.length > 0) {
      month.prop("checked", false);
      week.prop("checked", true);
    }
    view.find("input").click(updateState);
    return view;
  }

  function editRecurrenceModal(team : ApiT.Team,
                               eventObj : CalPicker.TZEventObj,
                               startEvent ?: ApiT.CalendarEvent) : JQuery {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-confirm-event-modal">
    <div class="esper-modal-header">Edit Recurrence</div>
    <div class="esper-modal-content" #content>
      <div style="margin-bottom: 10px">
        <label class="esper-recur-modal-label">Repeats:</label>
        <select #repeats class="esper-select esper-recur-freq" style="float: none">
          <option>Daily</option>
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Yearly</option>
        </select>
      </div>
      <div style="margin-bottom: 10px">
        <label class="esper-recur-modal-label">Repeat every:</label>
        <select #repeatEvery class="esper-select esper-recur-interval" style="float: none"/>
        <span #everyText>days</span>
      </div>
      <div #repeatOn style="margin-bottom: 10px"/>
      <div style="margin-bottom: 10px">
        <label class="esper-recur-modal-label">Starts on:</label>
        <input class="esper-recur-start esper-input" type="date" #startsOn/>
      </div>
      <div>
        <label class="esper-recur-modal-label">Ends:</label>
        <div style="margin-left: 33%; margin-bottom: 10px; margin-top: -18px;">
          <input #endsNever type="radio" name="ends" value="never" checked/>
            Never
          <br/>
          <input #endsAfter class="esper-recur-after" type="radio" name="ends" value="count"/>
            After <input #occurrences
                         type="text"
                         class="esper-input esper-recur-count"
                         style="width: 25%"/> occurrences
          <br/>
          <input #endsOn class="esper-recur-on" type="radio" name="ends" value="until"/>
            On <input #endDate type="date"
                      class="esper-input esper-recur-until"/>
        </div>
      </div>
      <div>
        <label class="esper-recur-modal-label">Summary:</label>
        <div #summary class="esper-recur-summary" style="margin-left: 33%; margin-top: -18px;"/>
      </div>
    </div>
    <div class="esper-modal-footer esper-clearfix">
      <button #saveButton class="esper-btn esper-btn-primary modal-primary">
        Save
      </button>
      <button #cancelButton class="esper-btn esper-btn-secondary modal-cancel">
        Cancel
      </button>
    </div>
  </div>
</div>
'''
    var recur = currentRule.get();

    Sidebar.customizeSelectArrow(repeats);
    Sidebar.customizeSelectArrow(repeatEvery);

    for (var i = 1; i <= 30; i++) {
      repeatEvery.append("<option>" + i + "</option>");
    }

    view.click(cancel);
    Util.preventClickPropagation(modal);
    saveButton.click(save);
    cancelButton.click(cancel);

    function setRepeats(rep) {
      var recur = currentRule.get();
      repeatOn.children().remove();
      if (rep === "Daily") {
        everyText.text("days");
      } else if (rep === "Weekly") {
        everyText.text("weeks");
        var lbl = $("<label>")
        lbl.addClass("esper-recur-modal-label");
        lbl.text("Repeat on:");
        repeatOn.append(lbl)
                .append(daysOfWeek(recur));
      } else if (rep === "Monthly") {
        everyText.text("months");
        var lbl = $("<label>")
        lbl.addClass("esper-recur-modal-label");
        lbl.text("Repeat by:");
        repeatOn.append(lbl)
                .append(monthOrWeekChoice(recur));
      } else if (rep === "Yearly") {
        everyText.text("years");
      }
    }
    repeats.change(function() {
      var rep = $(this).val();
      setRepeats(rep);
      updateState();
    });
    repeats.val(recur.freq);
    setRepeats(recur.freq);

    if (recur.interval) repeatEvery.val(recur.interval.toString());
    repeatEvery.change(updateState);

    var localDateTime;
    if (startEvent) {
      localDateTime = startEvent.start.local;
      startsOn.val(localDateTime.split("T")[0]);
      var utcDateTime = startEvent.start.utc;
      startsOn.data("utcTime", utcDateTime.split("T")[1]);
      // TODO Handle changes, make sure utcTime is updated...
      startsOn.change(updateState);
    } else {
      if (eventObj.start['toISOString']) {
        localDateTime = (<Date> eventObj.start).toISOString();
      }
      startsOn.val(localDateTime.split("T")[0]);
      var utcDateTime = moment(eventObj.start).utc().toISOString();
      startsOn.data("utcTime", utcDateTime.split("T")[1]);
      startsOn.prop("disabled", true);
    }

    if (recur.count) {
      endsNever.prop("checked", false);
      endsAfter.prop("checked", true);
      endsOn.prop("checked", false);
      occurrences.val(recur.count.toString());
      occurrences.change(updateState);
    } else if (recur.until) {
      endsNever.prop("checked", false);
      endsAfter.prop("checked", false);
      endsOn.prop("checked", true);
      endDate.val(recur.until[1].split("T")[0]);
      endDate.change(updateState);
    }

    endsNever.click(function () {
      endDate.val("");
      occurrences.val("");
      updateState();
    });

    endsAfter.click(function() {
      endDate.val("");
      if (occurrences.val().length === 0) occurrences.val("5");
      updateState();
    });
    occurrences.change(updateState);

    endsOn.click(function() {
      occurrences.val("");
      if (endDate.val().length === 0) {
        var endsOn = moment(localDateTime).add("days", 5).toISOString();
        endDate.val(endsOn.split("T")[0]);
      }
      updateState();
    });
    endDate.change(updateState);

    summary.text(summarize(recur));

    function cancel() {
      currentRule.set(defaultRecur());
      view.remove();
    }
    function save() {
      var rule = currentRule.get();
      if (!startEvent) {
        eventObj.recurrence = { rrule: [rule], exdate: [], rdate: [] };
      } else {
        // TODO Save changes to edited event...
      }
      currentRule.set(defaultRecur());
      view.remove();
      Log.d("eventObj is now", eventObj);
    }

    return view;
  }

  export function load(team : ApiT.Team,
                       eventObj : CalPicker.TZEventObj,
                       calEvent ?: ApiT.CalendarEvent) : void {
    Log.d("eventObj", eventObj);
    if (!calEvent) {
      // Creating a recurrence rule for a new event (not on the calendar yet)
      var recur = eventObj.recurrence;
      if (recur && recur.rrule.length > 0) {
        currentRule.set(recur.rrule[0]);
      }
      var modal = editRecurrenceModal(team, eventObj);
      $("body").append(modal);
    } else if (calEvent.recurring_event_id) {
      // Editing the recurrence rule for an already recurring event
      // TODO Support in event edit, not CalPicker
      Api.getEventDetails(team.teamid, calEvent.google_cal_id,
                          team.team_calendars, calEvent.recurring_event_id)
        .done(function(response) {
          var ev = response.event_opt;
          if (ev && ev.recurrence) {
            Log.d("Event", ev);
            Log.d("Recurrence", JSON.stringify(ev.recurrence));
            // TODO Support exceptions, warn about multiple rules, etc.
            var recur = ev.recurrence.rrule[0];
            currentRule.set(recur);
            var modal = editRecurrenceModal(team, eventObj, ev);
            $("body").append(modal);
          } else {
            alert("Failed to load main recurring event. " +
                  "Please report this error!");
          }
        });
    } else {
      // Editing the recurrence rule for a non-recurring existing event
      // TODO Support in event edit, not CalPicker
      var modal = editRecurrenceModal(team, eventObj);
      $("body").append(modal);
    }
  }

}
