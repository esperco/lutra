module Esper.Recur {

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
