/*
  Google Calendar event view
*/
module Esper.CalEventView {
  var currentEventId : Types.FullEventId;

  function checkForNewEventId(callback: (x: Types.FullEventId) => void) {
    var oldEventId = currentEventId;
    currentEventId = Gcal.Event.extractFullEventId();
    if (currentEventId !== undefined
        && ! Gcal.Event.equal(currentEventId, oldEventId)) {
      callback(currentEventId);
    }
  }

  function listenForNewEventId(callback: (x: Types.FullEventId) => void) {
    Util.every(300, function() {
      checkForNewEventId(callback);
    });
  }

  function makeGmailThreadUrl(threadId: string) {
    var url =
      "https://mail.google.com/mail/u/" + Gcal.getUserEmail()
      + "/#inbox/" + threadId;
    return url;
  }

  function renderLinkedThread(
    team : ApiT.Team,
    thread: ApiT.EmailThread,
    fullEventId: Types.FullEventId
  ): JQuery {
'''
<div #view
     class="esper-thread-row">
  <img #unlinkButton alt="Linked"
                     class="esper-clickable"
                     title="Click to unlink this conversation from the event"/>
  <a #threadView
     target="_blank"
     class="esper-message">
    <span #subject class="esper-subject"></span>
    <span #snippet class="esper-snippet"></span>
  </a>
</div>
'''
    unlinkButton.attr("src", Init.esperRootUrl + "img/linked.png");
    subject.text(thread.subject);
    snippet.html(thread.snippet);

    var teamid = team.teamid;
    var threadId = thread.gmail_thrid;
    var eventId = fullEventId.eventId;
    unlinkButton.click(function() {
      Api.unlinkEvent(teamid, threadId, eventId)
        .done(function() {
          view.remove();
          Api.getEventDetails(teamid, fullEventId.calendarId,
                              team.team_calendars, eventId)
            .done(function(response) {
              if (response.event_opt !== undefined) {
                mergeDescription(response.event_opt);
                Log.d("Updated description textarea.");
              }
            });
        });
    });

    var gmailUrl = makeGmailThreadUrl(thread.gmail_thrid);
    threadView.attr("href", gmailUrl);

    return view;
  }

  /*
    Keep the user-edited part of the description field (text area), and
    overwrite the bottom part below the marker with the new content
    from the server.
  */
  export function mergeDescriptionText(userDescription: string,
                                       serverDescription: string) {
    var delimiter = "=== Conversation ===";

    var split1 = userDescription.split(delimiter);
    var split2 = serverDescription.split(delimiter);
    var description = "";
    if (split1.length >= 1) {
      description += split1[0];
      if (description.length > 0
          && description[description.length-1] !== '\n') {
        description += "\n";
      }
    }
    if (split2.length >= 2) {
      description += delimiter;
      split2.shift();
      description += split2.join(delimiter);
    }
    return description;
  }

  export function testMergeDescriptionText() {
    Log.assert(mergeDescriptionText("", "") === "");
    Log.assert(mergeDescriptionText("bla", "") === "bla\n");
    Log.assert(mergeDescriptionText("bla\n=== Conversation ===\nbe gone",
                                        "=== Conversation ===")
                   === "bla\n=== Conversation ===");
    Log.assert(mergeDescriptionText("bla\n=== Conversation ===\nbe gone",
                                        "=== Conversation ===\nYo!")
                   === "bla\n=== Conversation ===\nYo!");
  }

  function mergeDescription(event: ApiT.CalendarEvent) {
    var userDescriptionElt = Gcal.Event.findDescriptionBox();
    var userDescription = userDescriptionElt.val();
    var serverDescription = event.description;
    if (userDescriptionElt.length === 1 && serverDescription !== undefined) {
      var description =
        mergeDescriptionText(userDescription, serverDescription);
      userDescriptionElt.val(description);
    }
  }

  function renderActiveThread(
    team,
    thread: Types.GmailThread,
    fullEventId: Types.FullEventId
  ): JQuery {
'''
<div #view
     class="esper-thread-row">
  <img #linkButton alt="Unlinked"
                   class="esper-clickable"
                   title="Click to link this conversation to the event"/>
  <a #threadView
     target="_blank"
     class="esper-message">
    <span #subject class="esper-subject"></span>
    <span #snippet class="esper-snippet"></span>
  </a>
</div>
'''
    linkButton.attr("src", Init.esperRootUrl + "img/unlinked.png");
    subject.text(thread.subject);

    var teamid = team.teamid;
    var threadId = thread.threadId;
    var calendarId = fullEventId.calendarId;
    var eventId = fullEventId.eventId;
    linkButton.click(function() {
      Api.linkEventForMe(teamid, threadId, eventId)
        .done(function() {
          updateView(fullEventId);
          Api.linkEventForTeam(teamid, threadId, eventId)
            .done(function() {
              Api.syncEvent(teamid, threadId, calendarId, eventId)
                .done(function() {
                  updateView(fullEventId);
                  Api.getEventDetails(teamid, calendarId,
                                      team.team_calendars, eventId)
                    .done(function(response) {
                      if (response.event_opt !== undefined) {
                        mergeDescription(response.event_opt);
                        Log.d("Link and sync complete.");
                      }
                    });
                });
            });
        });
    });

    threadView.attr("href", makeGmailThreadUrl(thread.threadId));

    return view;
  }

  function insertReminderButton(fromTeamId, fromEmail, execIds,
    reminderState: ReminderView.ReminderState) {
'''
<div #view>
  <button #openReminder class="esper-btn">Reminder</button>
</div>
'''
    openReminder.click(function () {
      var dialog = Modal.dialog("Set an automatic reminder",
        ReminderView.render(fromEmail, reminderState),
        function() {
          reminderState = ReminderView.currentReminderState();
          if (! reminderState.enable) {
            Api.unsetReminderTime(execIds.eventId);
            return true;
          } else if (0 < reminderState.time) {
            Api.setReminderTime(fromTeamId, fromEmail,
                                execIds.calendarId, execIds.eventId,
                                reminderState.time);
            if (reminderState.bccMe) {
              var bccReminder = {
                guest_email: fromEmail,
                reminder_message: reminderState.text
              };
              Api.enableReminderForGuest(execIds.eventId,
                bccReminder.guest_email, bccReminder);
            } else {
              Api.disableReminderForGuest(execIds.eventId, fromEmail);
            }
            List.iter(reminderState.guests, function(guest) {
              if (guest.checked) {
                var guestReminder = {
                  guest_email: guest.email,
                  guest_name: guest.name,
                  reminder_message: reminderState.text
                }
                Api.enableReminderForGuest(execIds.eventId,
                  guestReminder.guest_email, guestReminder);
              } else {
                Api.disableReminderForGuest(execIds.eventId, guest.email);
              }
            });
            return true;
          } else {
            return false;
          }
        });
      $("body").append(dialog.view);
    });

    Gcal.findAnchorForReminderDropdown().append(view);
  }

  function sameEmail(email) {
    return function(r : ApiT.GuestReminder) {
      return r.guest_email === email;
    };
  }

  function updateView(fullEventId) {
    var teams = Login.myTeams();
    var calendarId = fullEventId.calendarId;
    var eventId = fullEventId.eventId;

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
        var reminderState: ReminderView.ReminderState = {
          enable: enable,
          bccMe: List.exists(event_reminders.guest_reminders, sameEmail(email)),
          text: text,
          time: time,
          guests: []
        };
        Gcal.waitForGuestsToLoad(function(guests) {
          guests.each(function() {
            var guest = $(this);
            var guestEmail = guest.attr("title");
            var state = {
              email: guestEmail,
              name: guest.find(".ep-gc-chip-text").text().replace(/.\*$/, ""),
              checked: List.exists(event_reminders.guest_reminders,
                                   sameEmail(guestEmail))
            };
            reminderState.guests.push(state);
          });
        });
        insertReminderButton(teamid, email, fullEventId, reminderState);
      });
    }
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      listenForNewEventId(function(fullEventId) {
        Log.d("New current event ID:", fullEventId);
        ActiveEvents.handleNewActiveEvent(fullEventId);
        updateView(fullEventId);
      });
    }
  }
}
