module Esper.ReminderView {
  export enum GuestResponse {WaitingForReply, No, Maybe, Yes}
  export interface ReminderGuest {
    email: string;
    name: string;
    response: GuestResponse;
    checked: boolean;
  }
  interface ReminderState {
    enable: boolean;
    bccMe: boolean;
    text: string;
    time: number;
    guests: ReminderGuest[];
  }

  var currentReminderState: ()=>ReminderState;

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

  function render(fromEmail, reminderState, eventTitle) {
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
  <div #yesGuests>Yes<br/><ul #yesGuestsList/></div>
  <div #noGuests>No<br/><ul #noGuestsList/></div>
  <div #maybeGuests>Maybe<br/><ul #maybeGuestsList/></div>
  <div #noreplyGuests>Waiting for Reply<br/><ul #noreplyGuestsList/></div>
  <textarea #reminderField rows=24 class="esper-input esper-reminder-text">
Hello,

This is a friendly reminder that you are scheduled for |event|. The details are below, please feel free to contact me if you have any questions regarding this meeting.
  </textarea>
</div>
'''

    viewFromEmail.text(fromEmail);
    bcc.prop("checked", reminderState.bccMe);

    List.iter(reminderState.guests, function(guest:ReminderGuest) {
      switch (guest.response) {
      case GuestResponse.Yes:
        yesGuestsList.append(renderGuest(guest));
        break;
      case GuestResponse.No:
        noGuestsList.append(renderGuest(guest));
        break;
      case GuestResponse.Maybe:
        maybeGuestsList.append(renderGuest(guest));
        break;
      case GuestResponse.WaitingForReply:
        noreplyGuestsList.append(renderGuest(guest));
        break;
      }
    });
    if (yesGuestsList.is(":empty")) {
      yesGuests.hide();
    }
    if (noGuestsList.is(":empty")) {
      noGuests.hide();
    }
    if (maybeGuestsList.is(":empty")) {
      maybeGuests.hide();
    }
    if (noreplyGuestsList.is(":empty")) {
      noreplyGuests.hide();
    }

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
    } else if (0 < eventTitle.length) {
      reminderField.text(reminderField.text().replace("|event|", eventTitle));
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

  function openReminder(fromTeamId, fromEmail, calendarId, eventId,
                        eventTitle, reminderState:ReminderState) {
    var dialog = Modal.dialog("Set an automatic reminder",
      render(fromEmail, reminderState, eventTitle),
      function() {
        reminderState = currentReminderState();
        if (! reminderState.enable) {
          Api.unsetReminderTime(eventId);
          return true;
        } else if (0 < reminderState.time) {
          Api.setReminderTime(fromTeamId, fromEmail,
                              calendarId, eventId,
                              reminderState.time);
          if (reminderState.bccMe) {
            var bccReminder = {
              guest_email: fromEmail,
              reminder_message: reminderState.text
            };
            Api.enableReminderForGuest(eventId,
              bccReminder.guest_email, bccReminder);
          } else {
            Api.disableReminderForGuest(eventId, fromEmail);
          }
          List.iter(reminderState.guests, function(guest) {
            if (guest.checked) {
              var guestReminder = {
                guest_email: guest.email,
                guest_name: guest.name,
                reminder_message: reminderState.text
              }
              Api.enableReminderForGuest(eventId,
                guestReminder.guest_email, guestReminder);
            } else {
              Api.disableReminderForGuest(eventId, guest.email);
            }
          });
          return true;
        } else {
          return false;
        }
      });
    $("body").append(dialog.view);
  }

  function sameEmail(email) {
    return function(r : ApiT.GuestReminder) {
      return r.guest_email === email;
    };
  }

  export function openReminderOnClick(button, calendarId, eventId, eventTitle,
                                      guests) {
    var teams = Login.myTeams();
    if (teams.length > 0) {
      Api.getReminders(calendarId, eventId).done(function(event_reminders) {
        var teamid = event_reminders.remind_from_team || teams[0].teamid;
        var email = event_reminders.remind_from_email || Login.myEmail();
        var evSecs = new Date(event_reminders.event_start_time).getTime();
        var rmSecs = new Date(event_reminders.reminder_time).getTime();
        var time = (evSecs - rmSecs) / 1000;
        var enable = 0 < event_reminders.guest_reminders.length && 0 < time;
        var text = 0 < event_reminders.guest_reminders.length
                 ? event_reminders.guest_reminders[0].reminder_message
                 : null;
        List.iter(guests, function(guest: ReminderGuest) {
          guest.checked = List.exists(event_reminders.guest_reminders,
                                      sameEmail(guest.email));
        });
        var reminderState: ReminderState = {
          enable: enable,
          bccMe: List.exists(event_reminders.guest_reminders, sameEmail(email)),
          text: text,
          time: time,
          guests: guests
        };
        button.click(function() {
          openReminder(teamid, email, calendarId, eventId, eventTitle,
                       reminderState);
        });
      });
    }
  }
}
