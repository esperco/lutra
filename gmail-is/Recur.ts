module Esper.Recur {

  export function editRecurrenceModal(team, calEvent) {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-confirm-event-modal">
    <div class="esper-modal-header">Edit Recurrence</div>
    <div class="esper-modal-content" #content>

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

    view.click(cancel);
    Util.preventClickPropagation(modal);
    saveButton.click(save);
    cancelButton.click(cancel);

    Api.getEventDetails(team.teamid, calEvent.google_cal_id,
                        team.team_calendars, calEvent.recurring_event_id)
      .done(function(response) {
        var ev = response.event_opt;
        if (ev) {
          content.append(JSON.stringify(ev.recurrence));
        }
      });

    $("body").append(view);
  }

}
