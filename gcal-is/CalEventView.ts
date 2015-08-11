/*
  Google Calendar event view
*/
module Esper.CalEventView {
  var currentEventId : Types.FullEventId;
  var remindFromTeam : ApiT.Team;
  var remindFromEmail : string;

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

  function removeReminderDropdown() {
    $("#esper-reminder-dropdown").remove();
  }

  function insertReminderDropdown(fullEventId, event_reminders) {
'''
<select id="esper-reminder-time" #dropdown>
  <option class="esper-remind" value="-1">Never</option>
  <option class="esper-remind" value="3600">1 hour before</option>
  <option class="esper-remind" value="7200">2 hours before</option>
  <option class="esper-remind" value="14400">4 hours before</option>
  <option class="esper-remind" value="28800">8 hours before</option>
  <option class="esper-remind" value="43200">12 hours before</option>
  <option class="esper-remind" value="86400">24 hours before</option>
  <option class="esper-remind" value="172800">48 hours before</option>
</select>
'''
    removeReminderDropdown();
    var anchor = Gcal.findAnchorForReminderDropdown();
    var view = $("<div id='esper-reminder-dropdown'>Send reminders: </div>");
    var eventId = fullEventId.eventId;
    var calendarId = fullEventId.calendarId;

    /* Without this stupid hack, Google intercepts the event somewhere,
       and the select won't drop down. */
    dropdown.mousedown(function(e) { e.stopPropagation(); });

    dropdown.change(function() {
      var secs = $(this).val();
      $(".esper-remind-extra").remove();
      if (secs > 0) {
        Api.setReminderTime(remindFromTeam.teamid, remindFromEmail,
                            calendarId, eventId, secs);
      } else {
        Api.unsetReminderTime(eventId);
      }
    });

    // Select the current scheduled time, and disable any times in the past
    var startDate = new Date(event_reminders.event_start_time);
    var remind = event_reminders.reminder_time;
    var curSecs;
    if (remind !== undefined) {
      var remindDate = new Date(remind);
      curSecs = startDate.getTime() / 1000 - remindDate.getTime() / 1000;
    }
    var maxSecs = startDate.getTime() / 1000 - Date.now() / 1000;
    Log.d("curSecs:", curSecs, "maxSecs:", maxSecs);
    dropdown.find(".esper-remind").each(function() {
      var that = $(this);
      var secs = that.val();
      if (Number(secs) === curSecs) that.attr("selected", "selected");
      if (secs > maxSecs) that.attr("disabled", "true");
    });

    /* If the event was moved after scheduling a reminder time,
       it may no longer match any of the menu options...
       in this case, create a custom option for it,
       so we have something to select besides Never. */
    if (curSecs !== undefined && dropdown.val() < 0) {
      var extraOption =
        $("<option class='esper-remind-extra'" + "value='" + curSecs + "'>" +
          curSecs / 60 + " minutes before" + "</option>");
      extraOption.appendTo(dropdown);
      extraOption.attr("selected", "selected");
    }

    view.append(dropdown);
    anchor.append(view);
  }

  function insertTeamSelector(eventId,
                              teams : ApiT.Team[],
                              fromEmail : string) {
    var anchor = Gcal.findAnchorForReminderDropdown();
    var view = $("<div id='esper-remind-from-team'>Team: </div>");
    var dropdown = $("<select>");

    /* Without this stupid hack again, Google intercepts the event somewhere,
       and the select won't drop down. */
    dropdown.mousedown(function(e) { e.stopPropagation(); });

    for (var i = 0; i < teams.length; i++) {
      var team = teams[i];
      $("<option value='" + i + "'>" + team.team_name + "</option>")
        .data("teamid", team.teamid)
        .appendTo(dropdown);
    }
    dropdown.change(function() {
      var i = $(this).val();
      remindFromTeam = teams[i]; // a variable of CalEventView
      insertEmailSelector(eventId,
                          remindFromTeam.team_email_aliases,
                          fromEmail);
      $("#esper-reminder-time").trigger("change");
    });

    dropdown.find("option").each(function() {
      var that = $(this);
      var teamid = that.data("teamid");
      if (teamid === remindFromTeam.teamid) that.attr("selected", "selected");
    });

    view.append(dropdown);
    anchor.append(view);
  }

  function insertEmailSelector(eventId,
                               emails : string[],
                               fromEmail : string) {
    var anchor = Gcal.findAnchorForReminderDropdown();
    $("#esper-remind-from-email").remove();
    var view = $("<div id='esper-remind-from-email'/>");
    var dropdownDiv = $("<div>From: </div>");
    var dropdown = $("<select>").appendTo(dropdownDiv);
    var checkboxDiv = $("<div>Bcc me? </div>");
    var checkbox = $("<input type='checkbox'/>").appendTo(checkboxDiv);
    /* Without this stupid hack again, Google intercepts the event somewhere,
       and the select won't drop down. */
    dropdown.mousedown(function(e) { e.stopPropagation(); });

    if (emails.length === 0) {
      remindFromEmail = Login.myEmail();
      $("<option>" + remindFromEmail + "</option>")
        .appendTo(dropdown);
      dropdown.prop("disabled", true);
    } else if (remindFromEmail !== undefined) {
      remindFromEmail = fromEmail;
    }
    if (remindFromEmail === undefined) remindFromEmail = emails[0];

    List.iter(emails, function(email) {
      $("<option>" + email + "</option>")
        .appendTo(dropdown);
    });
    dropdown.change(function() {
      var email = $(this).val();
      if (checkbox.is(":checked")) {
        var reminder = { guest_email: email };
        Api.disableReminderForGuest(eventId, remindFromEmail);
        Api.enableReminderForGuest(eventId, email, reminder);
      }
      remindFromEmail = email; // a variable of CalEventView
      $("#esper-reminder-time").trigger("change");
    });
    dropdown.find("option").each(function() {
      var that = $(this);
      var email = that.val();
      if (email === remindFromEmail) that.attr("selected", "selected");
    });
    view.append(dropdownDiv);

    checkbox.click(function() {
      if (this.checked) {
        var reminder = { guest_email: remindFromEmail };
        Api.enableReminderForGuest(eventId, remindFromEmail, reminder);
      } else {
        Api.disableReminderForGuest(eventId, remindFromEmail);
      }
    });
    view.append(checkboxDiv);

    anchor.append(view);
  }

  function insertGuestReminderOptions(calendarId, eventId,
                                      event_reminders, guests : JQuery) {
    guests.each(function() {
      var guest = $(this);
      var email = guest.attr("title");
      var name = guest.find(".ep-gc-chip-text").text().replace(/.\*$/, "");
      var view = $("<div class='esper-guest-reminder'>Remind: </div>");
      var checkbox = $("<input type='checkbox'/>")
        .appendTo(view);
      var customize = $("<a href='#'>Customize message</a>")
        .appendTo(view);
      var textarea = $("<textarea rows='10' cols='72'>");
      var saveButton = $("<button>Save</button>");
      var dialog = $("<div>") // TODO make pretty
        .append(saveButton)
        .append(textarea);
      textarea.css("box-shadow", "10px 5px 5px #888888");

      function sameEmail(r : ApiT.GuestReminder) {
        return r.guest_email === email;
      }
      if (List.exists(event_reminders.guest_reminders, sameEmail)) {
        checkbox.attr("checked", "checked");
      } else {
        checkbox.attr("checked", false);
      }
      checkbox.click(function() {
        var current = List.find(event_reminders.guest_reminders, sameEmail);
        var message = current !== null ? current.reminder_message : null;
        var reminder = {
          guest_email: email,
          guest_name: name === email || name === "" ? null : name,
          reminder_message: message
        };
        if (this.checked) {
          Api.enableReminderForGuest(eventId, email, reminder);
        } else {
          Api.disableReminderForGuest(eventId, email);
        }
      });

      customize.click(function() {
        var current = List.find(event_reminders.guest_reminders, sameEmail);
        if (current !== null) {
          textarea.text(current.reminder_message);
          dialog.dialog({});
        } else {
          var heading = name === email || name === "" ?
                        "Hello,\n\n" :
                        "Hi " + name + ",\n\n";
          dialog.dialog({});
          textarea.text("Loading message...");
          Api.getDefaultReminder(remindFromTeam.teamid, calendarId, eventId)
            .done(function(x) {
              textarea.text(heading + x.default_message);
            });
        }
      });

      saveButton.click(function() {
        dialog.dialog("close");
        var message = textarea.val();
        Log.d(message);
        var current = List.find(event_reminders.guest_reminders, sameEmail);
        if (current !== null) current.reminder_message = message;
        var reminder = {
          guest_email: email,
          guest_name: name === email || name === "" ? null : name,
          reminder_message: message
        };
        checkbox.attr("checked", "checked");
        Api.enableReminderForGuest(eventId, email, reminder);
      });

      guest.append(view);
    });
  }

  function updateView(fullEventId) {
    var teams = Login.myTeams();
    var calendarId = fullEventId.calendarId;
    var eventId = fullEventId.eventId;

    if (teams.length > 0) {
      Api.getReminders(calendarId, eventId).done(function(event_reminders) {
        var teamid = event_reminders.remind_from_team;
        if (teamid === undefined) remindFromTeam = teams[0];
        else remindFromTeam = List.find(teams, function(t) {
          return t.teamid === teamid;
        });
        var email = event_reminders.remind_from_email;
        insertTeamSelector(eventId, teams, email);
        insertReminderDropdown(fullEventId, event_reminders);
        insertEmailSelector(eventId,
                            remindFromTeam.team_email_aliases,
                            email);
        $(".esper-guest-reminder").remove(); // Yes this is necessary
        Gcal.waitForGuestsToLoad(function(guests) {
          var reminders = guests.find(".esper-guest-reminder");
          if (reminders.length === 0) {
            insertGuestReminderOptions(calendarId, eventId,
                                       event_reminders, guests);
          }
        });
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
