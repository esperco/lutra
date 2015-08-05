/** Contains the UI code for the widget for editing an event or
 *  creating a duplicate.
 */
module Esper.InviteControls {

  /* If the exec wants to share his phone number with guests,
     insert the number into the notes box for the EA.
  */
  function appendExecPublicPhone(team, notesBox) {
    var prof = Teams.getProfile(team.team_executive);
    var prefs = Teams.getTeamPreferences(team);
    var phoneInfo = prefs.meeting_types.phone_call;
    if (phoneInfo !== undefined) {
      var pubMobile = List.find(phoneInfo.phones, function(p) {
        return p.phone_type === "Mobile" && p.share_with_guests;
      });
      if (pubMobile !== null) {
        var curText = notesBox.val();
        var execName = prof.display_name.replace(/ .*$/, "");
        var toAppend = execName + ": " + pubMobile.phone_number;
        if (curText.length > 0) {
          notesBox.val(curText + "\n\n" + toAppend);
        } else {
          notesBox.val(toAppend);
        }
      }
    }
  }

  // Look up the timezone for this guest from the task preferences
  export function timezoneForGuest(email: string,
                                   taskPrefs: ApiT.TaskPreferences,
                                   event: ApiT.CalendarEvent): string {
    var tz;
    // If we have a guest-specific timezone for this guest, use it
    var guestPrefs =
      taskPrefs ?
      List.find(taskPrefs.guest_preferences, function(x: ApiT.GuestPreferences) {
        return x.email === email;
      }) :
      null;
    if (guestPrefs) {
      tz = guestPrefs.timezone;
    // If none found, try guest_timezone from TaskPreferences
    } else {
      tz = taskPrefs.guest_timezone;
    }
    // Don't have either of those? Fall back to the event's timezone
    if (!tz) tz = CurrentThread.eventTimezone(event);
    return tz;
  }

  interface ReminderSpec {
    exec?   : { text : string; time : number };
    guests? : { text : string; time : number };
  }

  /** An object that contains all the values entered through the
   *  invite flow.
   */
  interface InviteState {
    // Initial values:
    event : ApiT.CalendarEvent;
    prefs : CurrentThread.TeamAndPreferences;

    // Event details, initially populated from event:
    title       : string;
    location    : string;
    calendarId? : string;
    calendars   : ApiT.Calendar[];
    createdBy   : string;
    notes       : string;
    guests      : ApiT.Guest[];

    // Reminders:
    reminders? : ReminderSpec;

    // Final description:
    description? : string;
  }

  /** Fills out event details for the given event and preferences. */
  function populateInviteState(
    team  : ApiT.Team,
    event : ApiT.CalendarEvent,
    prefs : Option.T<CurrentThread.TeamAndPreferences>): Option.T<InviteState> {
      return prefs.match<Option.T<InviteState>>({
        some : function (prefs) {
          var newTitle = event.title || "Untitled Event";
          newTitle = newTitle.replace(/^HOLD: /, "");

          var location = "";
          if (event.location) {
            var address = event.location.address;

            if (event.location.title !== "") {
              address = event.location.title + " - " + address;
            }

            location = address;
          }

          var firstTeamCal = team.team_calendars[0];
          var calendars    = [];
          var publicCalId  =
            firstTeamCal ? firstTeamCal.google_cal_id : event.google_cal_id;
          List.iter(team.team_calendars, function(cal : ApiT.Calendar) {
            calendars.push(cal);

            if (cal.calendar_default_dupe) {
              publicCalId = cal.google_cal_id;
            }
          });

          var author = team.team_email_aliases[0] || Login.myEmail();

          return Option.some({
            event : event,
            prefs : prefs,

            title       : event.title || "Untitled Event",
            location    : location,
            calendarId  : publicCalId,
            calendars   : calendars,
            createdBy   : author,
            notes       : "",
            guests      : [],

            reminders   : null,

            description : event.description
          });
        },
        none : function () {
          return Option.none<InviteState>();
        }
      });
  }

  function toEventEdit(state : InviteState): ApiT.CalendarEventEdit {
    // TODO: Implement this function, finalizing the state into an
    // actual event edit.

    //     var eventEdit : ApiT.CalendarEventEdit = {
    //   google_cal_id : (duplicate ? publicCalId : event.google_cal_id),
    //   start         : event.start,
    //   end           : event.end,
    //   title         : title,
    //   description   : pubNotes.val(),
    //   location      : location,
    //   all_day       : event.all_day,
    //   guests        : guests,
    //   recurrence    : event.recurrence,
    //   recurring_event_id : event.recurring_event_id
    // };

    // if (holdColor && |^HOLD: |.test(title)) {
    //   eventEdit.color_id = holdColor.key;
    // }

    return null;
  }

  /** Returns a widget for inviting guests to the current event or to
   *  a duplicate event, depending on the relevant setting in the exec
   *  preferences. Will fail with a visible error if there is no
   *  detected current team.
   */
  export function inviteSlide(initialState : InviteState):
  Slides.Slide<InviteState> {
'''
<div #container>
  <div #heading class="esper-modal-header">
    Create a duplicate event for guests
  </div>
  <div class="esper-modal-content">
    <div #titleRow class="esper-ev-modal-row esper-clearfix">
      <div class="esper-ev-modal-left esper-bold">Title</div>
        <div class="esper-ev-modal-right">
          <input #pubTitle type="text" class="esper-input"/>
        </div>
      </div>
      <div #whereRow class="esper-ev-modal-row esper-clearfix">
        <div class="esper-ev-modal-left esper-bold">Location</div>
        <div class="esper-ev-modal-right">
          <input #pubLocation type="text" class="esper-input"/>
          <ul #locationDropdown
              class="esper-drop-ul esper-task-search-dropdown esper-dropdown-btn">
            <div #locationSearchResults class="esper-dropdown-section"/>
          </ul>
        </div>
      </div>
      <div #calendarRow class="esper-ev-modal-row esper-clearfix">
        <div class="esper-ev-modal-left esper-bold">Calendar</div>
        <div class="esper-ev-modal-right">
          <select #pubCalendar class="esper-select"/>
        </div>
      </div>
      <div class="esper-ev-modal-row esper-clearfix">
        <div class="esper-ev-modal-left esper-bold">Created by</div>
        <div class="esper-ev-modal-right">
          <select #fromSelect class="esper-select"/>
        </div>
      </div>
      <div #notesRow class="esper-ev-modal-row esper-clearfix">
        <div class="esper-ev-modal-left esper-bold">Notes</div>
        <div class="esper-ev-modal-right">
          <textarea #pubNotes rows=8 cols=28 class="esper-input"/>
        </div>
      </div>
      <div class="esper-ev-modal-row esper-clearfix">
        <div class="esper-ev-modal-left esper-bold">Guests</div>
        <div class="esper-ev-modal-right">
          <ul #viewPeopleInvolved/>
          <br/>
          <input #newGuestName class="esper-input esper-ev-modal-small"
                 type="text" placeholder="Name"/>
          <input #newGuestEmail class="esper-input esper-ev-modal-small"
                 type="text" placeholder="Email"/>
          <button #addGuest class="esper-btn esper-btn-secondary">
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
<div #notDuplicate class="esper-badge"
     title="One event will be sent to the exec and the guests.">
  Not Duplicate
</div>
'''
    var prefs    = initialState.prefs;
    var team     = prefs.team;
    var threadId = CurrentThread.threadId.get();
    var event    = initialState.event;

    Sidebar.customizeSelectArrow(pubCalendar);
    Sidebar.customizeSelectArrow(fromSelect);

    if (initialState.description) {
      var separatorIndex = event.description.search(/=== Conversation ===/);
      pubNotes.val(event.description.substring(0, separatorIndex).trim());
    }
    // Include exec's phone number in description if preferences allow it
    appendExecPublicPhone(team, pubNotes);

    // Initializing the calendar dropdown:
    var publicCalId = initialState.calendarId;

    if (publicCalId) {
      pubCalendar.val(publicCalId);
    }

    initialState.calendars.forEach(function (cal) {
      pubCalendar.append($("<option value='" + cal.google_cal_id + "'>" +
                           cal.calendar_title + "</option>"));
    });

    var aliases = team.team_email_aliases;
    if (aliases.length === 0) {
      $("<option>" + Login.myEmail() + "</option>").appendTo(fromSelect);
      fromSelect.prop("disabled", true);
    } else {
      aliases.forEach(function (email: string) {
        $("<option>" + email + "</option>").appendTo(fromSelect);
      });
    }

    var taskPrefs;
    prefs.taskPrefs.match({
      some: function(prefs) { taskPrefs = prefs; },
      none: function() { }
    });

    var peopleInvolved : { [email:string]: string } = {};
    CurrentThread.getExternalParticipants().done(function(participants) {
      if (participants.length > 0) {
        List.iter(participants, function (participant) {
          var name = participant.display_name || "";
          var email = participant.email;
          var tz = timezoneForGuest(email, taskPrefs, event);
          var v = viewPersonInvolved(peopleInvolved, email, name,
                                     tz, taskPrefs);
          viewPeopleInvolved.append(v);
        });
      } else {
        viewPeopleInvolved
          .append($("<li class='esper-gray'>No guests found</li>"));
      }
    });

    addGuest.click(function() {
      var name  = newGuestName.val();
      var email = newGuestEmail.val();
      peopleInvolved[email] = name;
      if (name === "" || email === "" || !email.match(/.*@.*\..*/)) return;

      var checked = true;
      var tz = timezoneForGuest(email, taskPrefs, event);
      var v = viewPersonInvolved(peopleInvolved, email, name,
                                 tz, taskPrefs, checked);
      viewPeopleInvolved.append(v);
      newGuestName.val("");
      newGuestEmail.val("");
    });

    var preferences  = prefs.execPrefs;
    var duplicate    = preferences.general.use_duplicate_events;
    var execReminder = preferences.general.send_exec_reminder;
    var holdColor    = preferences.general.hold_event_color;

    if (!duplicate) {
      heading.text("Invite guests to this calendar event");
      notDuplicate.appendTo(heading);
      calendarRow.remove();
    }

    function searchLocation() {
      var query = pubLocation.val();
      LocSearch.displayResults(team, pubLocation, locationDropdown,
                               locationSearchResults, query,
                               preferences);
    }
    Util.afterTyping(pubLocation, 250, searchLocation);
    pubLocation.click(searchLocation);

    var fileUpload = FileUpload.uploadWidget(function (fileInfos) {
      fileInfos.forEach(function (fileInfo) {
        // Not sure how to convince typescript that this is the
        // fileInfo object from above.
        var file = <any> fileInfo;

        var link = "https://drive.google.com/file/d/" + file.id +
          "/view?usp=sharing";
        pubNotes.val(function (i, text) {
          return text + "\n\nAttachment " + file.name + " <" + link + ">";
        });
      });
    });
    notesRow.before(fileUpload);

    function getState(): InviteState {
      var guests = [];
      for (var person in peopleInvolved) {
        if (peopleInvolved.hasOwnProperty(person)) {
          guests.push({
            display_name : peopleInvolved[person] || null,
            email        : person
          });
        }
      }

      return {
        event : event,
        prefs : prefs,

        title      : pubTitle.val(),
        // TODO: Use timezone from settings when turning this into an event!
        location   : pubLocation.val(),
        calendarId : publicCalId,
        calendars  : initialState.calendars,
        createdBy  : fromSelect.val(),
        notes      : pubNotes.val(),
        guests     : guests,

        reminders  : null,

        description : null
      }
    }

    return {
      element  : container,
      getState : getState
    };
  }

  /** Disables the button and changes the text to "Inviting..." to
   *  signify that work is being done in the background (ie over the
   *  network).
   */
  function inviting(button) {
    button.text("Inviting...");
    button.attr("disabled", true);
  }

  /** A widget for setting an automatic reminder about the event, sent
   *  to the exec.
   */
  function reminderSlide(state : InviteState): Slides.Slide<InviteState> {
'''
<div #container>
  <div #heading class="esper-modal-header">
    Set an automatic reminder for the exec
  </div>
  <div class="esper-ev-modal-content">
    <div class="esper-reminder-options">
      <label>
        <span class="esper-reminder-label">Executive</span>
        <span #execWarning class="esper-reminder-warning"> Invalid time: </span>
        <input #execTime type="text" value="24"> </input> hours before event
      </label>
      <button #execButton class="esper-btn esper-btn-safe esper-btn-toggle">
        Enabled
      </button>
    </div>
    <textarea #execReminderField
      rows=24 class="esper-input esper-reminder-text">
Hello|exec|,

This is a friendly reminder that you are scheduled for |event|. The details are below, please feel free to contact me if you have any questions regarding this meeting.
</textarea>
    <div class="esper-reminder-options">
      <label>
        <span class="esper-reminder-label">Guests</span>
        <span #guestsWarning class="esper-reminder-warning"> Invalid time: </span>
        <input #guestsTime type="text" value="24"> </input> hours before event
      </label>
      <button #guestsButton class="esper-btn esper-btn-safe esper-btn-toggle">
        Enabled
      </button>
    </div>
    <textarea #guestsReminderField
       rows=24 class="esper-input esper-reminder-text">
Hello,

This is a friendly reminder that you are scheduled for |event|. The details are below, please feel free to contact me if you have any questions regarding this meeting.
</textarea>
  </div>
</div>
'''
    var execEnabled   = true;
    var guestsEnabled = true;

    var team      = state.prefs.team;
    var duplicate = state.prefs.execPrefs.general.use_duplicate_events;

    var execReminder, guestsReminder;
    if (state.reminders) {
      execReminder   = state.reminders.exec;
      guestsReminder = state.reminders.guests;
    }

    if (!execReminder) {
      execEnabled = false;
      toggleButton(execButton);
    }

    // Fill out static parts of message template (ie exec name and guests):
    Api.getProfile(team.team_executive, team.teamid).done(function (profile) {
      var name       = profile.display_name ? " " + profile.display_name : "";

      // TODO: Fix how this works with duplicate events.
      // By now, state.title should be all set, with "HOLD: " removed.
      var eventTitle = state.title || "a meeting";
      var guestTitle = state.title || "a meeting";

      execReminderField.val(execReminderField.val()
        .replace("|exec|", name)
        .replace("|event|", eventTitle));

      guestsReminderField.val(guestsReminderField.val()
        .replace("|event|", guestTitle));
    });

    function getState(): InviteState {
      var reminders = null;

      var execInvalid   = isNaN(execTime.val() * 1);
      var guestsInvalid = isNaN(guestsTime.val() * 1);

      // If one of the entries is an invalid number, highlight it and
      // don't go to the next slide.
      if (execInvalid || guestsInvalid) {
        if (execInvalid) {
          execTime.addClass("esper-danger");
          execWarning.show();
        }
        if (guestsInvalid) {
          guestsTime.addClass("esper-danger");
          guestsWarning.show();
        }

        throw Slides.invalidState;
      }

      if (execEnabled || guestsEnabled) {
        reminders = {
          exec : {
            text : execReminderField.val(),
            time : execEnabled && Math.floor(execTime.val() * 60 * 60)
          },
          guests : {
            text : guestsReminderField.val(),
            time : guestsEnabled && Math.floor(guestsTime.val() * 60 * 60)
          }
        };
      }

      var newState = $.extend({}, state);
      newState.reminders = reminders;
      return newState;
    }

    execButton.click(function () {
      toggleButton(execButton);

      execEnabled = !execEnabled;
    });

    guestsButton.click(function () {
      toggleButton(guestsButton);

      guestsEnabled = !guestsEnabled;
    });

    return {
      element  : container,
      getState : getState
    };

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
  }

  /** A widget for viewing and editing the whole event description,
   *  which includes both the notes from the previous widget and the
   *  synced email thread contents.
   */
  export function descriptionSlide(state : InviteState) : 
  Slides.Slide<InviteState> {
'''
<div #container class="esper-ev-inline-container">
  <div #heading class="esper-modal-header">
    Review the guest event description
    <button #pickEmails class="esper-btn esper-btn-secondary">
      Pick Emails
    </button>
  </div>
  <div class="esper-ev-modal-content">
    <textarea #descriptionField
      rows=24 class="esper-input esper-description-text">
      Loading...
    </textarea>
  </div>
  <div class="esper-modal-footer esper-clearfix">
    <button #invite class="esper-btn esper-btn-primary modal-primary">
      Invite
    </button>
    <button #back class="esper-btn esper-btn-secondary modal-cancel">
      Back
    </button>
  </div>
</div>
'''
    var team     = state.prefs.team;
    var threadId = CurrentThread.threadId.get();
    var original = state.event;

    Api.getRestrictedDescription(team.teamid, 
                                 original.google_event_id, state.guests)
      .done(function (description) {
        // TODO: Make sure that state.notes is correct (instead of state.description).
        descriptionField.val(state.notes + description.description_text);
      });

    function confirmEventIsNotHold(eventEdit) {
      if (/^HOLD: /.test(eventEdit.title)) {
        return window.confirm(
          "About to invite guests to a HOLD event! Are you sure?"
        );
      } else {
        return true;
      }
    }

    invite.click(function () {
      inviting(invite);
      eventEdit.description = descriptionField.val();

      if (duplicate) {
        if (CurrentThread.task.isValid()) {
          var task = CurrentThread.task.get();
          if (confirmEventIsNotHold(eventEdit)) {
            Api.createTaskLinkedEvent(from, team.teamid, eventEdit,
                                      task.taskid)
              .done(function(created) {
                Api.syncEvent(team.teamid, threadId,
                              created.google_cal_id,
                              created.google_event_id);

                Api.sendEventInvites(team.teamid, from, guests, created);
                CurrentThread.linkedEventsChange.set(null);

                var execIds = {
                  calendarId : original.google_cal_id,
                  eventId    : original.google_event_id
                };
                var guestsIds = {
                  calendarId : created.google_cal_id,
                  eventId    : created.google_event_id
                };
                setReminders(execIds, guestsIds);
                close();
              });
          }
        } else {
          Log.e("Can't create a linked event without a valid task");
        }
      } else {
        if (confirmEventIsNotHold(eventEdit)) {
          Api.updateLinkedEvent(team.teamid, threadId,
                                original.google_event_id, eventEdit)
            .done(function() {
              Api.sendEventInvites(team.teamid, from, guests, original);
              TaskTab.refreshLinkedEventsList(team, threadId,
                                              TaskTab.currentTaskTab);

              var execIds = {
                calendarId : original.google_cal_id,
                eventId    : original.google_event_id
              };
              setReminders(execIds, execIds);
              close();
            });
        }
      }
    });

    pickEmails.click(function() {
      eventEdit.description_messageids = original.description_messageids
        || [];
      var task = CurrentThread.task.get();
      var dialog = Modal.dialog("Task Messages",
                                TaskMessageList.render(task.taskid,
                                                       eventEdit.description_messageids),
                                function() {
                                  Api.getEventDescriptionWithMessages
                                  (descriptionField.val(), eventEdit.description_messageids)
                                    .then(function(desc) {
                                      descriptionField.val(desc.description_text);
                                    });
                                });
      $("body").append(dialog.view);
    });

    return container;

    function setReminders(execIds, guestsIds) {
      if (reminderSpec) {
        if (reminderSpec.exec.time) {
          Api.getProfile(team.team_executive, team.teamid)
            .done(function (profile) {
              var reminder = {
                guest_email      : profile.email,
                reminder_message : reminderSpec.exec.text
              };

              Api.enableReminderForGuest(execIds.eventId, profile.email,
                                         reminder);

              Api.setReminderTime(team.teamid, from, execIds.calendarId,
                                  execIds.eventId, reminderSpec.exec.time);
            });
        }

        if (reminderSpec.guests.time) {
          for (var i = 0; i < guests.length; i++) {
            var guest    = guests[i];
            var reminder = {
              guest_email : guest.email,
              reminder_message : reminderSpec.guests.text
            };

            Api.enableReminderForGuest(guestsIds.eventId, guest.email, reminder);

            Api.setReminderTime(team.teamid, from, guestsIds.calendarId,
                                guestsIds.eventId, reminderSpec.guests.time);
          }
        }
      }
    }
  }

  /** Inserts a new "Invite Guests" widget after the contents of the
   *  GMail thread and fixes the formatting of another GMail div that
   *  was causing problems.
   */
  export function insertAfterThread(event) {
    CurrentThread.getTeamAndPreferences().done(function(prefs) {
      // TODO: Insert slides!
      // Gmail.threadContainer().after(inviteWidget(event, prefs));

      // fix mysteriously appearing padding at end of thread:
      Gmail.threadFooter().css("padding-bottom", "10px");
    });
  }

  export function viewPersonInvolved(peopleInvolved: { [email:string]: string },
                                     email: string,
                                     name: string,
                                     tz: string,
                                     taskPrefs: ApiT.TaskPreferences,
                                     checked?: boolean) {
'''
<li #viewPerson>
  <label #labelPerson>
    <input #checkPerson type="checkbox"/>
  </label>
</li>
'''
    var display = 0 < name.length ? name + " <" + email + ">" : email;
    // createTextNode escapes the text, preventing potential injection attacks
    labelPerson.append(document.createTextNode(display));
    if (checked) {
      checkPerson.attr("checked", true);
      peopleInvolved[email] = name;
    }

    checkPerson.change(function() {
      if (undefined === peopleInvolved[email] && checkPerson.is(":checked")) {
        peopleInvolved[email] = name;
      } else if (!checkPerson.is(":checked")) {
        delete peopleInvolved[email];
      }

      // do nothing if the guest is already correctly included or not
    });

    var tzSel = Timezone.createTimezoneSelector(tz);

    // Make it fit properly
    tzSel.removeClass("esper-select");
    tzSel.css("float", "right");
    tzSel.css("width", "40%");

    tzSel.change(function() {
      var tz = tzSel.val();
      var pref : ApiT.GuestPreferences = {
        taskid: taskPrefs.taskid,
        email: email,
        timezone: tz
      };

      function sameEmail(g: ApiT.GuestPreferences) { return g.email === email; }
      var guestPrefs =
        List.exists(taskPrefs.guest_preferences, sameEmail) ?
        List.replace(taskPrefs.guest_preferences, pref, sameEmail) :
        taskPrefs.guest_preferences.concat([pref]);

      taskPrefs.guest_preferences = guestPrefs;
      Api.putTaskPrefs(taskPrefs);
    });

    labelPerson.append(tzSel);

    return viewPerson;
  }
}
