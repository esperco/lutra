module Esper.Recur {

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
      { ord: null, day: "Monday" },
      { ord: null, day: "Tuesday" },
      { ord: null, day: "Wednesday" },
      { ord: null, day: "Thursday" },
      { ord: null, day: "Friday" }
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

  function summarizeDate(d : ApiT.LocalTime) {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[d.month - 1] + " " + d.day + ", " + d.year;
  }

  type byFilter = string | [string, ApiT.OrdWkDay[]] | [string, number[]];

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
      return "No_filter";
    } else if (period === "Weekly" && noFilter) {
      return "No_filter";
    } else if (period === "Weekly" && justByDay) {
      return justByDay;
    } else if (period === "Monthly" && justByDay && !justByMonthDay) {
      return justByDay;
    } else if (period === "Monthly" && !justByDay && justByMonthDay) {
      return justByMonthDay;
    } else if (period === "Yearly" && noFilter) {
      return "No_filter";
    } else {
      throw new Error("Unsupported");
    }
  }

  function summarizeIfSupported(rule : ApiT.Recur) {
    // TODO
  }

  export function editRecurrenceModal(team, calEvent) {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-confirm-event-modal">
    <div class="esper-modal-header">Edit Recurrence</div>
    <div class="esper-modal-content" #content>
      <div style="margin-bottom: 10px">
        <label class="esper-recur-modal-label">Repeats:</label>
        <select #repeats class="esper-select" style="float: none">
          <option>Daily</option>
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Yearly</option>
        </select>
      </div>
      <div style="margin-bottom: 10px">
        <label class="esper-recur-modal-label">Repeat every:</label>
        <select #repeatEvery class="esper-select" style="float: none"/>
        <span #everyText>days</span>
      </div>
      <div #repeatOn/>
      <div style="margin-bottom: 10px">
        <label class="esper-recur-modal-label">Starts on:</label>
        <input type="date" #startsOn class="esper-input"/>
      </div>
      <div>
        <label class="esper-recur-modal-label">Ends:</label>
        <div style="margin-left: 33%; margin-bottom: 10px; margin-top: -18px;">
          <input #endsNever type="radio" name="ends" value="never" checked/>
            Never
          <br/>
          <input #endsAfter type="radio" name="ends" value="count"/>
            After <input #occurrences
                         type="text"
                         class="esper-input" style="width: 25%"/> occurrences
          <br/>
          <input #endsOn type="radio" name="ends" value="until"/>
            On <input #endDate type="date" class="esper-input"/>
        </div>
      </div>
      <div>
        <label class="esper-recur-modal-label">Summary:</label>
        <span #summary>Sample summary</span>
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
    function save() { view.remove(); }
    function cancel() { view.remove(); }

    Sidebar.customizeSelectArrow(repeats);
    Sidebar.customizeSelectArrow(repeatEvery);

    for (var i = 1; i <= 30; i++) {
      repeatEvery.append("<option>" + i + "</option>");
    }

    repeats.change(function() {
      var rep = $(this).val();
      if (rep === "Daily") {
        everyText.text("days");
      } else if (rep === "Weekly") {
        everyText.text("weeks");
      } else if (rep === "Monthly") {
        everyText.text("months");
      } else if (rep === "Yearly") {
        everyText.text("years");
      }
    });

    endsAfter.click(function() {
      endDate.val("");
      if (occurrences.val().length === 0) occurrences.val("5");
    });

    view.click(cancel);
    Util.preventClickPropagation(modal);
    saveButton.click(save);
    cancelButton.click(cancel);

    Api.getEventDetails(team.teamid, calEvent.google_cal_id,
                        team.team_calendars, calEvent.recurring_event_id)
      .done(function(response) {
        var ev = response.event_opt;
        if (ev) {
          Log.d(ev);
          Log.d(JSON.stringify(ev.recurrence));
          var start = ev.start;
          var startLocal;
          if (start) {
            startLocal = start.local.split("T")[0];
            startsOn.val(startLocal);
          }
          endsOn.click(function() {
            occurrences.val("");
            if (endDate.val().length === 0) {
              var endsOn = moment(startLocal).add("days", 5).toISOString();
              endDate.val(endsOn.split("T")[0]);
            }
          });
        }
      });

    $("body").append(view);
  }

}
