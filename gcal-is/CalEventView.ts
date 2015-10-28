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

  function updateView(fullEventId) {
    Gcal.waitForGuestsToLoad(function(guests) {
      $(".esper-reminder-container").remove();
      var guestsState = [];
      guests.each(function() {
        var guest = $(this);
        var response;
        if (guest.siblings(".ep-gc-response-maybe").length > 0) {
          response = ReminderView.GuestResponse.Maybe;
        } else if (guest.siblings(".ep-gc-response-yes").length > 0) {
          response = ReminderView.GuestResponse.Yes;
        } else if (guest.siblings(".ep-gc-response-no").length > 0) {
          response = ReminderView.GuestResponse.No;
        } else {
          response = ReminderView.GuestResponse.WaitingForReply;
        }
        var state: ReminderView.ReminderGuest = {
          email: guest.attr("title"),
          name: guest.find(".ep-gc-chip-text").text().replace(/.\*$/, ""),
          response: response
        };
        guestsState.push(state);
      });
'''
<div #view class="esper-reminder-container">
  <button #reminderButton class="esper-btn esper-btn-primary esper-reminder-btn">
    Set Reminder
  </button>
</div>
'''
      ReminderView.openReminderOnClick(reminderButton,
        fullEventId.calendarId, fullEventId.eventId,
        Gcal.Event.extractEventTitle(),
        guestsState, updateReminderList);
      $(".reminder-button").remove();
      Gcal.findAnchorForReminderDropdown().append(view);
      updateReminderList();
    });
  }

  function updateReminderList() {
    var fullEventId = currentEventId;
    Api.getReminders(fullEventId.calendarId, fullEventId.eventId)
       .done(function(event_reminders) {
'''
<div #reminder class="esper-active-reminders esper">
<i class="fa fa-envelope-o"></i>
<span #dateTime />
<span #close class="esper-clickable esper-close" >×</span>
</div>
'''
      $(".esper-active-reminders").remove();
      if (event_reminders.reminder_time) {
        var time = new Date(event_reminders.reminder_time);
        dateTime.text(moment(time).format('DD MMM YYYY [at] h:mm a'));
        close.click(function() {
          Api.unsetReminderTime(fullEventId.eventId).done(function() {
            reminder.remove();
          });
        });
        $(".esper-reminder-container").append(reminder);
      }
    });
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      listenForNewEventId(function(fullEventId) {
        Log.d("New current event ID:", fullEventId);
        updateView(fullEventId);
      });
    }
  }
}
