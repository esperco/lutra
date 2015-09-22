module Esper.ReminderView {
  interface ReminderGuest {
    email: string;
    name: string;
    checked: boolean;
  }
  export interface ReminderState {
    enable: boolean;
    bccMe: boolean;
    text: string;
    time: number;
    guests: ReminderGuest[];
  }

  export var currentReminderState: ()=>ReminderState;

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

  function renderGuest(guest) {
'''
<li #view>
  <input type='checkbox' #check/>
  <label #label/>
</li>
'''
    var randomId = Util.randomString();
    check.attr("id", randomId);
    label.attr("for", randomId);

    check.prop("checked", guest.checked);
    check.change(function() {
      guest.checked = check.is(":checked");
    });

    if (guest.name && guest.name.length > 0
     && guest.name !== guest.email) {
      label.text(guest.name + " <" + guest.email + ">");
    } else {
      label.text(guest.email);
    }
    return view;
  }

  export function render(fromEmail, reminderState) {
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
  <div>From: <span #viewFromEmail /></div>
  <div>Bcc me? <input #bcc type='checkbox' /></div>
  <div>To: <ul #toGuests/></div>
  <textarea #reminderField rows=24 class="esper-input esper-reminder-text">
Hello,

This is a friendly reminder that you are scheduled for |event|. The details are below, please feel free to contact me if you have any questions regarding this meeting.
  </textarea>
</div>
'''

    viewFromEmail.text(fromEmail);
    bcc.prop("checked", reminderState.bccMe);

    List.iter(reminderState.guests, function(guest) {
      toGuests.append(renderGuest(guest));
    });

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

    if (reminderState.text) {
      reminderField.text(reminderState.text);
    } else {
      var eventTitle = Gcal.Event.extractEventTitle();
      if (0 < eventTitle.length) {
        reminderField.text(reminderField.text().replace("|event|", eventTitle));
      }
    }

    currentReminderState = (): ReminderState => {
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
