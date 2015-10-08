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

    // Keep separate from exec and guests interface above so we can
    // enable in the state and have other functions modify state to include
    // defaults.
    execEnabled?: boolean;
    guestsEnabled?: boolean;
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
    location    : ApiT.Location;
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
  function populateInviteState(event : ApiT.CalendarEvent,
                               prefs : CurrentThread.TeamAndPreferences)
  : InviteState {
    var team = prefs.team;

    var newTitle = event.title || "Untitled Event";
    newTitle = newTitle.replace(/^HOLD: /, "");

    var location = event.location;
    if (location) {
      if (location.title !== "") {
        location.address = location.title + " - " + location.address;
      }
    }

    return {
      event : event,
      prefs : prefs,

      title       : newTitle,
      location    : location,
      calendarId  : event.google_cal_id,
      calendars   : team.team_calendars,
      createdBy   : team.team_email_aliases[0] || Login.myEmail(),
      notes       : "",
      guests      : [],

      reminders   : {
        execEnabled: prefs.execPrefs.general.send_exec_reminder
      },

      description : event.description
    };
  }

  function toEventEdit(state : InviteState): ApiT.CalendarEventEdit {
    var preferences  = state.prefs.execPrefs;
    var holdColor    = preferences.general.hold_event_color;

    var event = state.event;

    var eventEdit : ApiT.CalendarEventEdit = {
      google_cal_id : state.calendarId,
      start         : event.start,
      end           : event.end,
      title         : state.title,
      description   : state.description,
      location      : state.location,
      all_day       : event.all_day,
      guests        : state.guests,
      recurrence    : event.recurrence,
      recurring_event_id : event.recurring_event_id
    };

    if (holdColor && /^HOLD: /.test(state.title)) {
      eventEdit.color_id = holdColor.key;
    }

    return eventEdit;
  }

  /** Returns a widget for inviting guests to the current event or to
   *  a duplicate event, depending on the relevant setting in the exec
   *  preferences. Will fail with a visible error if there is no
   *  detected current team.
   */
  export function inviteSlide(state: InviteState,
    duplicate=false, execEvent=true): Slides.Slide<InviteState>
  {
'''
<div #container>
  <div #heading class="esper-modal-header">
    Invite Guests
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
        <div class="esper-ev-modal-side-by-side">
          <div class="esper-bold">Calendar</div>
          <div>
            <select #pubCalendar class="esper-select"/>
          </div>
        </div>
        <div class="esper-ev-modal-side-by-side">
          <div class="esper-bold">Created by</div>
          <div>
            <select #fromSelect class="esper-select"/>
          </div>
        </div>
      </div>
      <div #notesRow class="esper-ev-modal-row esper-clearfix">
        <div class="esper-ev-modal-left esper-bold">Notes</div>
        <div class="esper-ev-modal-right">
          <textarea #pubNotes rows=8 cols=28 class="esper-input"/>
        </div>
      </div>
      <div #guestsRow class="esper-ev-modal-row esper-clearfix">
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
<div #execEventTag class="esper-badge esper-badge-blue"
     title="This is the event only for the exec.">
  Exec event
</div>
<div #guestsEventTag class="esper-badge esper-badge-orange"
     title="This is the event duplicated for inviting guests.">
  Guest event
</div>
'''
    var prefs    = state.prefs;
    var team     = prefs.team;
    var threadId = CurrentThread.threadId.get();
    var event    = state.event;

    Sidebar.customizeSelectArrow(pubCalendar);
    Sidebar.customizeSelectArrow(fromSelect);

    var headingText: string;
    var defaultTitle: string;
    if (duplicate) {
      if (execEvent) {
        headingText = team.team_name + "'s Event Details"
        defaultTitle = state.title;
      } else {
        headingText = "Create a duplicate event for guests";
        defaultTitle = "Event with " + team.team_name;
      }
    } else {
      headingText = "Invite guests to " + team.team_name + "'s event";
      defaultTitle = state.title;
    }
    heading.text(headingText);
    pubTitle.val(defaultTitle);
    pubTitle.attr("placeholder", defaultTitle);
    if (state.location)
      pubLocation.val(state.location.address);

    if (state.description) {
      var separatorIndex = event.description.search(/=== Conversation ===/);
      pubNotes.val(event.description.substring(0, separatorIndex).trim());
    }
    // Include exec's phone number in description if preferences allow it
    appendExecPublicPhone(team, pubNotes);

    // Initializing the calendar dropdown:
    state.calendars.forEach(function (cal) {
      pubCalendar.append($("<option value='" + cal.google_cal_id + "'>" +
                           cal.calendar_title + "</option>"));
    });

    var publicCalId = state.calendarId;
    if (publicCalId) {
      pubCalendar.val(publicCalId);
    }

    // Temporarily disable calendar selection until we can make a backend
    // call to change the google_cal_id of a given event
    if (!duplicate) {
      calendarRow.hide();
    }

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

    if (duplicate) {
      if (execEvent) {
        calendarRow.remove();
        execEventTag.appendTo(heading);
        guestsRow.remove();
      } else {
        guestsEventTag.appendTo(heading);
      }
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

      var calendarId = pubCalendar.is(":visible") ?
        (pubCalendar.val() || publicCalId) : publicCalId;

      return <InviteState> _.extend({}, state, {
        title: pubTitle.val(),
        location: {
          /* Right now we don't care about title because this is just text
             to be displayed in the Google Calendar location box... but in
             the future we may use it for typeahead or something. */
          title: "",
          address: pubLocation.val(),
          timezone: preferences.general.current_timezone,
        },
        calendarId: calendarId,
        createdBy: fromSelect.val(),
        notes: pubNotes.val(),
        guests: guests
      });
    }

    return {
      element  : container,
      getState : getState
    };
  }

  /** A widget for setting an automatic reminder about the event, sent
   *  to the exec.
   */
  function reminderSlide(state: InviteState,
                         duplicate = false, execEvent = true):
    Slides.Slide<InviteState>
  {
'''
<div #container>
  <div #heading class="esper-modal-header">
    Set an automatic reminder.
  </div>
  <div #reminderForm class="esper-ev-modal-content">
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
  </div>
</div>
<textarea #execField
      rows=24 class="esper-input esper-reminder-text">
Hello |exec|,

This is a friendly reminder that you are scheduled for |event|. The details are below, please feel free to contact me if you have any questions regarding this meeting.
</textarea>
<textarea #guestField
      rows=24 class="esper-input esper-reminder-text">
Hello,

This is a friendly reminder that you are scheduled for |event|. The details are below, please feel free to contact me if you have any questions regarding this meeting.
</textarea>
<div #execEventTag class="esper-badge esper-badge-blue"
     title="This is the event only for the exec.">
  Exec event
</div>
<div #guestsEventTag class="esper-badge esper-badge-orange"
     title="This is the event duplicated for inviting guests.">
  Guest event
</div>
'''
    var team      = state.prefs.team;
    var duplicate = state.prefs.execPrefs.general.use_duplicate_events;

    var key     = execEvent ? "exec" : "guests";
    var execEnabled = state.reminders && state.reminders.execEnabled;

    var enabled = true;

    var reminderField = execEvent ? execField : guestField;
    reminderForm.append(reminderField);

    if (!execEnabled && key == "exec") {
      enabled = false;
      toggleButton(reminderButton);
    }

    var name = team.team_name;

    if (execEvent) {
      heading.text("Set an automatic reminder for " + name);
    } else {
      heading.text("Set an automatic reminder for the guests");
    }

    if (duplicate) {
      if (execEvent) {
        execEventTag.appendTo(heading);
      } else {
        guestsEventTag.appendTo(heading);
      }
    }

    var eventTitle = state.title || "a meeting";

    reminderField.val(reminderField.val()
                      .replace("|exec|", name)
                      .replace("|event|", eventTitle));

    function getState(): InviteState {
      var reminders = $.extend({}, state.reminders);

      var invalidTime = isNaN(timeField.val() * 1);

      // If one of the entries is an invalid number, highlight it and
      // don't go to the next slide.
      if (invalidTime) {
        timeField.addClass("esper-danger");
        timeWarning.show();

        throw Slides.invalidState;
      }

      reminders[key] = {
        text : reminderField.val(),
        time : enabled && Math.floor(timeField.val() * 60 * 60)
      };

      if (key === "exec") {
        reminders.execEnabled = enabled;
      } else {
        reminders.guestsEnabled = enabled;
      }

      var newState = $.extend({}, state);
      newState.reminders = reminders;
      return newState;
    }

    reminderButton.click(function () {
      toggleButton(reminderButton);

      enabled = !enabled;
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
  export function descriptionSlide(state: InviteState,
                                   duplicate=false, execEvent=true) :
  Slides.Slide<InviteState> {
'''
<div #container>
  <div class="esper-modal-header">
    <span #heading>Review event description</span>
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
</div>
<div #execEventTag class="esper-badge esper-badge-blue"
     title="This is the event only for the exec.">
  Exec event
</div>
<div #guestsEventTag class="esper-badge esper-badge-orange"
     title="This is the event duplicated for inviting guests.">
  Guest event
</div>
'''
    var team     = state.prefs.team;
    var name     = team.team_name;
    var threadId = CurrentThread.threadId.get();
    var original = state.event;

    if (duplicate) {
      if (execEvent) {
        heading.text("Review " + name + "'s event description");
      } else {
        heading.text("Review the guest event description");
      }
    }

    Api.getRestrictedDescription(team.teamid,
                                 original.google_event_id, state.guests)
      .done(function (description) {
        descriptionField.val(state.notes + description.description_text);
      });

    if (execEvent) {
      if (duplicate) {
        execEventTag.appendTo(heading);
      }
    } else {
      if (duplicate) {
        guestsEventTag.appendTo(heading);
      }
    }

    var descriptionMessageids = [];

    pickEmails.click(function() {
      descriptionMessageids = original.description_messageids || [];
      var task = CurrentThread.task.get();
      var dialog = Modal.dialog("Task Messages",
                                TaskMessageList.render(task.taskid,
                                                       descriptionMessageids),
                                function() {
                                  Api.getEventDescriptionWithMessages
                                  (descriptionField.val(), descriptionMessageids)
                                    .then(function(desc) {
                                      descriptionField.val(desc.description_text);
                                    });
                                  return true;
                                });
      $("body").append(dialog.view);
    });

    function getState() {
      var newState = $.extend({}, state);
      newState.description = descriptionField.val();
      return newState;
    }

    return {
      element  : container,
      getState : getState
    };
  }

  // Use two InviteStates, one for exec and one for guest. (Only set reminders once!)
  interface DualState {
    exec   : InviteState;
    guests : InviteState;
  }

  /** Inserts a new "Invite Guests" widget after the contents of the
   *  GMail thread and fixes the formatting of another GMail div that
   *  was causing problems.
   */
  export function insertAfterThread(event) {
    CurrentThread.getTeamAndPreferences().done(function(prefs) {
      prefs.match({
        some : function (prefs) {
          var slideWidget;

          if (!prefs.execPrefs.general.use_duplicate_events) {

            function execReminderSlide(state: InviteState) {
              return reminderSlide(state,
                                   /* duplicate= */ false,
                                   /* execEvent= */ true);
            }

            function guestsReminderSlide(state: InviteState) {
              return reminderSlide(state,
                                   /* duplicate= */ false,
                                   /* execEvent= */ false);
            }

            var slides = [inviteSlide, execReminderSlide, guestsReminderSlide,
                          descriptionSlide];
            var startState = populateInviteState(event, prefs);
            var controls = {
              onCancel : function () { Analytics.track(Analytics.Trackable.ClickInviteCancelButton); },
              onFinish : function (state) {
                finalizeEvent(state).done(function (done) {
                  if (done) {
                    slideWidget.remove();
                  } else {
                    throw Slides.invalidState;
                  }
                });
                Analytics.track(Analytics.Trackable.ClickInviteButton);
              },
              finishButtonTitle : "Invite"
            };

            slideWidget =
              Slides.create<InviteState>(startState, slides, controls);
            InThreadControls.setEventControlContainer(slideWidget);
          } else {
            function wrap(slideFn : (state : InviteState, duplicate? : boolean,
                                     execEvent? : boolean) => Slides.Slide<InviteState>,
                          key : string)
            : (state : DualState) => Slides.Slide<DualState> {
              return function (state : DualState) : Slides.Slide<DualState> {
                var slide = slideFn(state[key], true, key == "exec");
                return {
                  element : slide.element,
                  getState : function () {
                    var newState = $.extend({}, state);
                    newState[key] = slide.getState();
                    return newState;
                  }
                };
              }
            }

            var execState = populateInviteState(event, prefs);
            var guestState = populateInviteState(event, prefs);
            var dupeCal = _.find(prefs.team.team_calendars, function(c) {
              return c.calendar_default_dupe;
            });
            if (dupeCal) {
              guestState.calendarId = dupeCal.google_cal_id;
            }

            var dualStartState = {
              exec   : execState,
              guests : guestState
            };

            var dualSlides = [
              wrap(inviteSlide, "exec"),
              wrap(reminderSlide, "exec"),
              wrap(descriptionSlide, "exec"),

              wrap(inviteSlide, "guests"),
              wrap(reminderSlide, "guests"),
              wrap(descriptionSlide, "guests"),
            ];

            var controls = {
              onCancel : function () { Analytics.track(Analytics.Trackable.ClickInviteCancelButton); },
              onFinish : function (dualState) {
                var exec   = dualState.exec;
                var guests = dualState.guests;

                finalizeEvent(exec).done(function (done) {
                  if (done) {
                    finalizeEvent(guests, true).done(function (done) {
                      if (done) {
                        slideWidget.remove();
                      } else {
                        throw Slides.invalidState;
                      }
                    });
                  } else {
                    throw Slides.invalidState;
                  }
                });
                Analytics.track(Analytics.Trackable.ClickInviteButton);
              },
              finishButtonTitle : "Invite"
            };

            slideWidget =
              Slides.create<DualState>(dualStartState, dualSlides, controls);
            InThreadControls.setEventControlContainer(slideWidget);
          }
        },
        none : function () {
          window.alert("Could not invite guests because no team is currently detected.")
        }
      });

      // fix mysteriously appearing padding at end of thread:
      Gmail.threadFooter().css("padding-bottom", "10px");
    });
  }

  function confirmEventIsNotHold(eventEdit) {
    if (/^HOLD: /.test(eventEdit.title)) {
      return window.confirm(
        "About to invite guests to a HOLD event! Are you sure?"
      );
    } else {
      return true;
    }
  }

  /** Actually invite guests to an event and carry out the needed
   *  modifications.
   */
  function finalizeEvent(state : InviteState, makeCopy? : boolean)
  : JQueryPromise<boolean> {
    var eventEdit = toEventEdit(state);

    var team     = state.prefs.team;
    var threadId = CurrentThread.threadId.get();

    var from         = state.createdBy;
    var guests       = state.guests;
    var original     = state.event;
    var reminderSpec = state.reminders;

    if (makeCopy) {
      if (CurrentThread.task.isValid()) {
        var task = CurrentThread.task.get();
        if (confirmEventIsNotHold(eventEdit)) {
          return Api.createTaskLinkedEvent(from, team.teamid, eventEdit, task.taskid)
            .then(function(created) {
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

              return true;
            });
        } else {
          return Promise.defer(false);
        }
      } else {
        Log.e("Can't create a linked event without a valid task");
        return Promise.defer(false);
      }
    } else {
      if (confirmEventIsNotHold(eventEdit)) {
        return Api.updateLinkedEvent(team.teamid, threadId,
                              original.google_event_id, eventEdit)
          .then(function() {
            Api.sendEventInvites(team.teamid, from, guests, original);
            TaskTab.refreshLinkedEventsList(team, threadId,
                                            TaskTab.currentTaskTab);

            var execIds = {
              calendarId : original.google_cal_id,
              eventId    : original.google_event_id
            };
            setReminders(execIds, execIds);

            return true;
          });
      } else {
        return Promise.defer(false);
      }
    }

    function setReminders(execIds, guestsIds) {
      if (reminderSpec) {
        if (reminderSpec.exec && reminderSpec.exec.time) {
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

        if (reminderSpec.guests && reminderSpec.guests.time) {
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
      checkPerson.prop("checked", true);
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

    var tzSel = Timezone.appendTimezoneSelector(labelPerson, tz);

    // Make it fit properly
    tzSel.removeClass("esper-select");
    tzSel.css("float", "right");

    tzSel.bind("typeahead:change", function() {
      var tz = Timezone.selectedTimezone(tzSel);
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

    return viewPerson;
  }
}
