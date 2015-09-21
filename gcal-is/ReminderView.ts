module Esper.ReminderView {
  interface ReminderState {
    enable: boolean;
    bccMe: boolean;
    text: string;
    time: number;
    fromTeam: ApiT.Team;
    fromEmail: string;
  }

  export var currentReminderState;

  function toggleButton(reminderButton) {
    if (reminderButton.hasClass("esper-btn-safe")) {
      reminderButton.removeClass("esper-btn-safe");
      reminderButton.addClass("esper-btn-danger");
      reminderButton.text("Disabled");
    } else {
      reminderButton.removeClass("esper-btn-danger");
      reminderButton.addClass("esper-btn-safe");
      reminderButton.text("Enabled");
    }
  }

  function updateSelectEmails(selectEmail, reminderState) {
    selectEmail.empty();

    if (reminderState.fromTeam.team_email_aliases.length === 0) {
      $("<option>" + Login.myEmail() + "</option>")
        .appendTo(selectEmail);
      selectEmail.attr("selected", "selected");
      selectEmail.prop("disabled", true);
    } else {
      List.iter(reminderState.fromTeam.team_email_aliases, function(email) {
        var opt = $("<option>" + email + "</option>");
        selectEmail.append(opt);
        if (email === reminderState.from_email) {
          opt.attr("selected", "selected");
        }
      });
      selectEmail.prop("disabled", false);
    }
  }

  export function render(teams: ApiT.Team[], reminderState) {
'''
<div #view>
  <div class="esper-reminder-options">
    <label>
      <span class="esper-reminder-label"></span>
      <span #timeWarning class="esper-reminder-warning"> Invalid time: </span>
      <input #timeField type="text" value="24"> </input> hours before event
    </label>
    <button #reminderButton class="esper-btn esper-btn-safe esper-btn-toggle">
      Enabled
    </button>
  </div>
  <div>Team: <select #selectTeam /></div>
  <div>From: <select #selectEmail /></div>
  <div>Bcc me? <input #bcc type='checkbox' /></div>
  <textarea #reminderField rows=24 class="esper-input esper-reminder-text">
Hello,

This is a friendly reminder that you are scheduled for |event|. The details are below, please feel free to contact me if you have any questions regarding this meeting.
  </textarea>
</div>
'''

    List.iter(teams, function(team, i) {
      var opt = $("<option value='" + i + "'>" + team.team_name + "</option>");
      selectTeam.append(opt);
      if (reminderState.fromTeam.teamid === team.teamid) {
        opt.attr("selected", "selected");
      }
    });
    selectTeam.change(function() {
      var i = $(this).val();
      reminderState.fromTeam = teams[i];
      updateSelectEmails(selectEmail, reminderState);
    });
    updateSelectEmails(selectEmail, reminderState);

    bcc.prop("checked", reminderState.bccMe);

    if (0 < reminderState.time) {
      timeField.val(String(Math.round(reminderState.time / 360) / 10));
    }

    if (! reminderState.enable) {
      toggleButton(reminderButton);
    }
    reminderButton.click(function () {
      reminderState.enable = ! reminderState.enable;
      toggleButton(reminderButton);
    });

    currentReminderState = (): ReminderState => {
      reminderState.fromEmail = selectEmail.val();
      reminderState.bccMe = bcc.is(":checked");
      reminderState.text = reminderField.text();
      reminderState.time = parseFloat(timeField.val()) * 3600;
      if (! (0 < reminderState.time)) {
        timeField.addClass("esper-danger");
        timeWarning.show();
      }
      return reminderState;
    };

    return view;
  }
}
