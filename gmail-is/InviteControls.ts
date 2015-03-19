/** Contains the UI code for the widget for editing an event or
 *  creating a duplicate.
 */
module Esper.InviteControls {

  /* If the exec wants to share his phone number with guests,
     insert the number into the notes box for the EA.
  */
  function appendExecPublicPhone(team, notesBox) {
    Profile.get(team.team_executive, team.teamid).done(function(prof) {
      Api.getPreferences(team.teamid).done(function(prefs) {
        var phoneInfo = prefs.meeting_types.phone_call;
        if (phoneInfo !== undefined) {
          var pubMobile = List.find(phoneInfo.phones, function(p) {
            return p.phone_type === "Mobile" && p.share_with_guests;
          });
          if (pubMobile !== null) {
            var curText = notesBox.val();
            var execName = prof.display_name.replace(/ .*$/, "");
            var toAppend = execName + ": " + pubMobile.phone_number;
            if (curText.length > 0)
              notesBox.val(curText + "\n\n" + toAppend);
            else
              notesBox.val(toAppend);
          }
        }
      });
    });
  }

  /** Returns a widget for inviting guests to the current event or to
   *  a duplicate event, depending on the relevant setting in the exec
   *  preferences.
   */
  export function inviteWidget(event: ApiT.CalendarEvent) {
'''
<div #container class="esper-ev-inline-container">
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
        <div class="esper-ev-modal-left esper-bold">Where</div>
        <div class="esper-ev-modal-right">
          <input #pubLocation type="text" class="esper-input"/>
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
      <div class="esper-modal-footer esper-clearfix">
        <button #next class="esper-btn esper-btn-primary modal-primary">
          Next
        </button>
        <button #cancel class="esper-btn esper-btn-secondary modal-cancel">
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
<div #notDuplicate class="esper-badge"
     title="One event will be sent to the exec and the guests.">
  Not Duplicate
</div>
'''
    /** Removes the widget from the DOM. */
    function close() {
      container.remove();
    }

    var team = CurrentThread.team.get();
    var threadId = CurrentThread.threadId.get();

    Sidebar.customizeSelectArrow(pubCalendar);
    Sidebar.customizeSelectArrow(fromSelect);

    var newTitle = event.title || "Untitled event";
    pubTitle.val(newTitle.replace(/^HOLD: /, ""));

    if (event.description) {
      var separatorIndex = event.description.search(/=== Conversation ===/);
      pubNotes.val(event.description.substring(0, separatorIndex).trim());
    }
    // Include exec's phone number in description if preferences allow it
    appendExecPublicPhone(team, pubNotes);
    
    if (event.location) {
      var address = event.location.address;

      if (event.location.title !== "") {
        address = event.location.title + " - " + address;
      }

      pubLocation.val(address);
    }

    var firstTeamCal = team.team_calendars[0];
    var publicCalId =
      firstTeamCal ? firstTeamCal.google_cal_id : event.google_cal_id;
    List.iter(team.team_calendars, function(cal : ApiT.Calendar) {
      var id = cal.google_cal_id;
      pubCalendar.append($("<option value='" + id + "'>" +
                           cal.calendar_title + "</option>"));
      if (cal.calendar_default_dupe) {
        pubCalendar.val(id);
        publicCalId = id;
      }
    });

    pubCalendar.change(function() {
      publicCalId = $(this).val();
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

    var peopleInvolved = {};
    var participants = CurrentThread.getParticipants();
    if (participants) {
      List.iter(participants, function (participant) {
        var name = participant.display_name || "";
        var v = viewPersonInvolved(peopleInvolved, participant.email, name);
        viewPeopleInvolved.append(v);
      });
    } else {
      viewPeopleInvolved
        .append($("<li class='esper-gray'>No guests found</li>"));
    }

    addGuest.click(function() {
      var name = newGuestName.val();
      var email = newGuestEmail.val();
      if (name === "" || email === "" || !email.match(/.*@.*\..*/)) return;
      var v = viewPersonInvolved(peopleInvolved, email, name);
      viewPeopleInvolved.append(v);
      newGuestName.val("");
      newGuestEmail.val("");
    });

    CurrentThread.withPreferences(function (preferences) {
      var duplicate    = preferences.general.use_duplicate_events;
      var execReminder = preferences.general.send_exec_reminder;
      var holdColor = preferences.general.hold_event_color;

      if (!duplicate) {
        heading.text("Invite guests to this calendar event");
        notDuplicate.appendTo(heading);
        calendarRow.remove();
      }

      next.click(function() {
        var guests = Object.keys(peopleInvolved).map(function (email) {
          return {
            email        : email,
            display_name : peopleInvolved[email]
          };
        });

        var location = {
          /* Right now we don't care about title because this is just text
             to be displayed in the Google Calendar location box... but in
             the future we may use it for typeahead or something. */
          title   : "",
          address : pubLocation.val()
        };
        if (!location.address) location = null;

        var title = pubTitle.val();
        var eventEdit : ApiT.CalendarEventEdit = {
          google_cal_id : (duplicate ? publicCalId : event.google_cal_id),
          start         : event.start,
          end           : event.end,
          title         : title,
          description   : pubNotes.val(),
          location      : location,
          all_day       : event.all_day,
          guests        : guests
        };
        if (holdColor && /^HOLD: /.test(title))
          eventEdit.color_id = holdColor.key;

        var from = fromSelect.val();
        location = pubLocation.val();
        var animation = {
          time : 500,
          width : Gmail.threadContainer().width() + 100
        }

        function slideForward(previous, next) {
          previous.parent().css({
            "overflow" : "hidden"
          });
          previous.animate({left : -animation.width}, animation.time);

          next.css({
            "left"       : animation.width,
            "margin-top" : (-previous.height()) + "px"
          });

          previous.after(next);
          next.animate({left : 0}, animation.time);
        }

        function slideBack(previous, next) {
          previous.animate({left : 0}, animation.time);

          next.animate({left : animation.width}, animation.time, function () {
            next.remove();
          });
        }

        /** Animates from the current widget to the check description
         *  widget.
         */
        function checkDescription(previous, title, reminderSpec?) {
          var next =
            descriptionWidget(event, eventEdit, duplicate, guests, from, close, back, reminderSpec);

          slideForward(previous, next);

          function back() {
            slideBack(previous, next);
          }
        }

        var next = reminderWidget(event, eventEdit, team, execReminder, duplicate, function () {
          slideBack(container, next);
        }, function (reminderSpec) {
          var title = pubTitle.val();
          checkDescription(next, title, reminderSpec);
        });

        slideForward(container, next);
      });
    });

    cancel.click(close);

    return container;
  }

  /** Disables the button and changes the text to "Inviting..." to
   *  signify that work is being done in the background (ie over the
   *  network).
   */
  function inviting(button) {
    button.text("Inviting...");
    button.attr("disabled", true);
  }

  /** A widget for viewing and editing the whole event description,
   *  which includes both the notes from the previous widget and the
   *  synced email thread contents.
   */
  export function descriptionWidget(original: ApiT.CalendarEvent,
                                    eventEdit: ApiT.CalendarEventEdit,
                                    duplicate: boolean,
                                    guests, from, done, backFunction, reminderSpec?) {
'''
<div #container class="esper-ev-inline-container">
  <div #heading class="esper-modal-header">
    Review the guest event description
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
    var team = CurrentThread.team.get();
    var threadId = CurrentThread.threadId.get();

    Api.getRestrictedDescription(team.teamid, original.google_event_id, guests)
      .done(function (description) {
        descriptionField.val(eventEdit.description + description.description_text);
      });

    function close() {
      container.remove();
      done();
    }
    back.click(backFunction);

    invite.click(function () {
      inviting(invite);
      eventEdit.description = descriptionField.val();

      if (duplicate) {
        if (CurrentThread.task.isValid()) {
          var task = CurrentThread.task.get();
          Api.createTaskLinkedEvent(from, team.teamid, eventEdit, task.taskid)
            .done(function(created) {
              Api.sendEventInvites(team.teamid, from, guests, created);
              TaskTab.refreshlinkedEventsList(team, threadId,
                                              TaskTab.currentTaskTab,
                                              Sidebar.profiles);
              CurrentThread.linkedEventsChanged();

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
        } else {
          Log.e("Can't create a linked event without a valid task");
        }
      } else {
        Api.updateLinkedEvent(team.teamid, threadId, original.google_event_id, eventEdit)
          .done(function() {
            Api.sendEventInvites(team.teamid, from, guests, original);
            TaskTab.refreshlinkedEventsList(team, threadId,
                                            TaskTab.currentTaskTab,
                                            Sidebar.profiles);

            var execIds = {
              calendarId : original.google_cal_id,
              eventId    : original.google_event_id
            };
            setReminders(execIds, execIds);
            close();
          });
      }
    });

    return container;

    function setReminders(execIds, guestsIds) {
      if (reminderSpec) {
        if (reminderSpec.exec.time) {
          Api.getProfile(team.team_executive, team.teamid).done(function (profile) {
            var reminder = {
              guest_email      : profile.email,
              reminder_message : reminderSpec.exec.text
            };

            Api.enableReminderForGuest(execIds.eventId, profile.email, reminder);

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

  /** A widget for setting an automatic reminder about the event, sent
   *  to the exec.
   */
  function reminderWidget(event, eventEdit, team, execReminder, duplicate, backFunction, nextFunction) {
'''
<div #container class="esper-ev-inline-container">
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
  <div class="esper-modal-footer esper-clearfix">
    <button #next class="esper-btn esper-btn-primary modal-primary">
      Next
    </button>
    <button #back class="esper-btn esper-btn-secondary modal-cancel">
      Back
    </button>
  </div>
</div>
'''
    var execEnabled   = true;
    var guestsEnabled = true;

    if (!execReminder) {
      execEnabled = false;
      toggleButton(execButton);
    }

    // Fill out static parts of message template (ie exec name and guests):
    Api.getProfile(team.team_executive, team.teamid).done(function (profile) {
      var name       = profile.display_name ? " " + profile.display_name : "";
      var eventTitle = (duplicate ? event.title : eventEdit.title) || "a meeting";
      var guestTitle = eventEdit.title || "a meeting";
      eventTitle = eventTitle.replace(/HOLD: /, "");

      execReminderField.val(execReminderField.val()
        .replace("|exec|", name)
        .replace("|event|", eventTitle));

      guestsReminderField.val(guestsReminderField.val()
        .replace("|event|", guestTitle));
    });

    back.click(backFunction);
    next.click(function () {
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

        return;
      } else {
        execTime.removeClass("esper-danger");
        execWarning.hide();
        guestsTime.removeClass("esper-danger");
        guestsWarning.hide();
      }

      if (execEnabled || guestsEnabled) {
        nextFunction({
          exec : {
            text : execReminderField.val(),
            time : execEnabled && Math.floor(execTime.val() * 60 * 60)
          },
          guests : {
            text : guestsReminderField.val(),
            time : guestsEnabled && Math.floor(guestsTime.val() * 60 * 60)
          }
        });
      } else {
        nextFunction();
      }
    });

    execButton.click(function () {
      toggleButton(execButton);

      execEnabled = !execEnabled;
    });

    guestsButton.click(function () {
      toggleButton(guestsButton);

      guestsEnabled = !guestsEnabled;
    });

    return container;

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

  /** Inserts a new "Invite Guests" widget after the contents of the
   *  GMail thread and fixes the formatting of another GMail div that
   *  was causing problems.
   */
  export function insertAfterThread(event) {
    Gmail.threadContainer().after(inviteWidget(event));

    // fix mysteriously appearing padding at end of thread:
    Gmail.threadFooter().css("padding-bottom", "10px");
  }

  function viewPersonInvolved(peopleInvolved, email, name) {
'''
<li #viewPerson>
  <input #checkPerson type="checkbox"/>
  <label #labelPerson/>
</li>
'''
    var forID = Util.randomString();
    checkPerson.attr("id",  forID);
    labelPerson.attr("for", forID);

    labelPerson.text(0 < name.length ? name + " <" + email + ">" : email);
    checkPerson.change(function() {
      if (undefined === peopleInvolved[email]) {
        peopleInvolved[email] = name;
      } else {
        delete peopleInvolved[email];
      }
    });
    return viewPerson;
  }
}
