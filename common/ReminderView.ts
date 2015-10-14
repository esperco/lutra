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

  function changeRecipientsEvent(checkbox: JQuery,
                                 recipients: JQuery,
                                 guests: ReminderGuest[]) {
    checkbox.change(function() {
      if (guests == []) return;
      var emails = recipients.val();
      if ($(this).is(":checked"))
        _.forEach(guests, function(guest: ReminderGuest) {
          guest.checked = true;
          if (emails.search(/(^\s*$)|(,\s*$)/) != -1)
            recipients.val(emails + guest.email + ", ");
          else
            recipients.val(emails + ", " + guest.email + ", ");
        });
      else
        _.forEach(guests, function(guest: ReminderGuest) {
          guest.checked = false;
          var regex = new RegExp(guest.email + ",? *", "i");
          recipients.val(emails.replace(regex, ""));
        });
    });
  }

  function render(fromEmail, reminderState, eventTitle) {
'''
<table #view class="esper-reminder-table">
  <!-- <div>From: <span #viewFromEmail /></div> -->
  <tr>
    <td colspan="2">
      <span>
        Enter the message you would like to send to the guests of this event.
      </span>
    </td>
  </tr>
  <tr>
    <td>To:</td>
    <td>
      <input #yesCheckbox type='checkbox' id='yesCheck'/>
      <label for='yesCheck'>Yes</label>
      <br/>
      <input #noCheckbox type='checkbox' id='noCheck'/>
      <label for='noCheck'>No</label>
      <br/>
      <input #maybeCheckbox type='checkbox' id='maybeCheck'/>
      <label for='maybeCheck'>Maybe</label>
      <br/>
      <input #noReplyCheckbox type='checkbox' id='noReplyCheck'/>
      <label for='noReplyCheck'>Waiting for reply</label>
      <br/>
      <textarea #recipients class="esper-input esper-reminder-text" />
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <span>
        Send reminder
        <select id="esper-reminder-time" #selectTime>
          <option class="esper-remind" value="-1">Never</option>
          <option class="esper-remind" value="3600">1 hour</option>
          <option class="esper-remind" value="7200">2 hours</option>
          <option class="esper-remind" value="14400">4 hours</option>
          <option class="esper-remind" value="28800">8 hours</option>
          <option class="esper-remind" value="43200">12 hours</option>
          <option class="esper-remind" value="86400">24 hours</option>
          <option class="esper-remind" value="172800">48 hours</option>
        </select>
        prior to event
      </span>
    </td>
  </tr>
  <tr>
    <td>Message:</td>
    <td>
      <textarea #reminderField class="esper-input esper-reminder-text">Hello,

This is a friendly reminder that you are scheduled for |event|. The details are below, please feel free to contact me if you have any questions regarding this meeting.
      </textarea>
    </td>
  </tr>
  <tr>
    <td/>
    <td>
      <span>
        Note: event information will be included in the message
      </span>
      <br/>
      <label>
        <input #bcc type='checkbox' />
        Send copy to myself
      </label>
    </td>
  </tr>
</table>
'''
    var yesGuestsList=[], noGuestsList=[], maybeGuestsList=[],
      noReplyGuestsList=[];

    // viewFromEmail.text(fromEmail);
    bcc.prop("checked", reminderState.bccMe);

    List.iter(reminderState.guests, function(guest:ReminderGuest) {
      switch (guest.response) {
      case GuestResponse.Yes:
        yesGuestsList.push(guest);
        break;
      case GuestResponse.No:
        noGuestsList.push(guest);
        break;
      case GuestResponse.Maybe:
        maybeGuestsList.push(guest);
        break;
      case GuestResponse.WaitingForReply:
        noReplyGuestsList.push(guest);
        break;
      }
    });
    changeRecipientsEvent(yesCheckbox, recipients, yesGuestsList);
    changeRecipientsEvent(noCheckbox, recipients, noGuestsList);
    changeRecipientsEvent(maybeCheckbox, recipients, maybeGuestsList);
    changeRecipientsEvent(noReplyCheckbox, recipients, noReplyGuestsList);

    if (reminderState.enable) {
      var selTime = 172800;
      selectTime.find("option").each(function(i, opt) {
        var v = parseFloat(opt.getAttribute("value"));
        if (reminderState.time <= v && v < selTime) {
          selTime = v;
        }
      });
      selectTime.val(String(selTime));
    } else {
      selectTime.val("-1");
    }

    if (reminderState.text) {
      reminderField.text(reminderState.text);
    } else if (0 < eventTitle.length) {
      reminderField.text(reminderField.text().replace("|event|", eventTitle));
    }

    currentReminderState = (): ReminderState => {
      var selTime = parseFloat(selectTime.val());
      reminderState.enable = 0 <= selTime;
      reminderState.time = selTime;
      reminderState.bccMe = bcc.is(":checked");
      reminderState.text = reminderField.text();
      return reminderState;
    };

    return view;
  }

  function openReminder(fromTeamId, fromEmail, calendarId, eventId,
                        eventTitle, reminderState:ReminderState) {
    var dialog = Modal.okCancelDialog("Send timed reminder to guests",
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
      },
      "Set reminder");
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
          Analytics.track(Analytics.Trackable.ClickReminderButton);
        });
      });
    }
  }
}
