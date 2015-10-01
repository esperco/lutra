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

  function setupGuestGroup(groupView, groupCheck, groupList) {
    if (groupList.is(":empty")) {
      groupView.hide();
    } else {
      groupCheck.prop("checked", groupList.find("input:checkbox:not(:checked)")
                                 .length <= 0);
      groupCheck.change(function() {
        var checkboxes = groupList.find("input:checkbox");
        checkboxes.prop("checked", groupCheck.is(":checked"));
        checkboxes.trigger("change");
      });
    }
  }

  function render(fromEmail, reminderState, eventTitle) {
'''
<div #view>
  <div class="esper-reminder-options">
    <select id="esper-reminder-time" #selectTime>
      <option class="esper-remind" value="-1">Never</option>
      <option class="esper-remind" value="3600">1 hour before</option>
      <option class="esper-remind" value="7200">2 hours before</option>
      <option class="esper-remind" value="14400">4 hours before</option>
      <option class="esper-remind" value="28800">8 hours before</option>
      <option class="esper-remind" value="43200">12 hours before</option>
      <option class="esper-remind" value="86400">24 hours before</option>
      <option class="esper-remind" value="172800">48 hours before</option>
    </select>
  </div>
  <div>From: <span #viewFromEmail /></div>
  <div>Bcc me? <input #bcc type='checkbox' /></div>
  <div #yesGuests>
    <input #yesCheck type='checkbox' id='yesCheck'/>
    <label for='yesCheck'>Yes</label><br/>
    <ul #yesGuestsList/>
  </div>
  <div #noGuests>
    <input #noCheck type='checkbox' id='noCheck'/>
    <label for='noCheck'>No</label><br/>
    <ul #noGuestsList/>
  </div>
  <div #maybeGuests>
    <input #maybeCheck type='checkbox' id='maybeCheck'/>
    <label for='maybeCheck'>Maybe</label><br/>
    <ul #maybeGuestsList/>
  </div>
  <div #noreplyGuests>
    <input #noreplyCheck type='checkbox' id='noreplyCheck'/>
    <label for='noreplyCheck'>Waiting for Reply</label><br/>
    <ul #noreplyGuestsList/>
  </div>
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
    setupGuestGroup(    yesGuests,     yesCheck,     yesGuestsList);
    setupGuestGroup(     noGuests,      noCheck,      noGuestsList);
    setupGuestGroup(  maybeGuests,   maybeCheck,   maybeGuestsList);
    setupGuestGroup(noreplyGuests, noreplyCheck, noreplyGuestsList);

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
    var dialog = Modal.okCancelDialog("Set an automatic reminder",
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
