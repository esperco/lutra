/** Contains the UI code for the widget for editing an event or
 *  creating a duplicate.
 */
module Esper.InviteControls {
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
    var emailData = esperGmail.get.email_data();
    if (emailData !== undefined && emailData.first_email !== undefined) {
      if (emailData.people_involved.length === 0) {
        viewPeopleInvolved
          .append($("<li class='esper-gray'>No guests found</li>"));
      } else {
        List.iter(emailData.people_involved, function(pair) {
          var v = viewPersonInvolved(peopleInvolved, pair[1], pair[0]);
          viewPeopleInvolved.append(v);
        });
      }
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
      var duplicate = preferences.general.use_duplicate_events;
      var reminder  = preferences.general.send_exec_reminder;

      if (!duplicate) {
        heading.text("Invite guests to this calendar event");
        notDuplicate.appendTo(heading);
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

        var eventEdit = {
          google_cal_id : publicCalId,
          start         : event.start,
          end           : event.end,
          title         : pubTitle.val(),
          description   : pubNotes.val(),
          location      : location,
          all_day       : event.all_day,
          guests        : guests,
        };

        var from = fromSelect.val();
        var title = pubTitle.val();
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

        function checkReminder() {
          var next = reminderWidget(function () {
            slideBack(container, next);
          }, function (reminderSpec) {
            var title = pubTitle.val();
            checkDescription(next, title, reminderSpec);
          });

          slideForward(container, next);
        }

        if (reminder) {
          checkReminder();
        } else {
          var title = pubTitle.val();
          checkDescription(container, title);
        }
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
            close();
          });
      }

      if (reminderSpec) {
        Api.getProfile(team.team_executive, team.teamid).done(function (profile) {
          var reminder = {
            guest_email      : profile.email,
            reminder_message : reminderSpec.text
          };

          Api.enableReminderForGuest(original.google_event_id, profile.email, reminder);

          Api.setReminderTime(team.teamid, from, original.google_cal_id,
                              original.google_event_id, reminderSpec.time);
        });
      }
    });

    return container;
  }

  /** A widget for setting an automatic reminder about the event, sent
   *  to the exec.
   */
  function reminderWidget(backFunction, nextFunction) {
'''
<div #container class="esper-ev-inline-container">
  <div #heading class="esper-modal-header">
    Set an automatic reminder for the exec
  </div>
  <div class="esper-ev-modal-content">
    <textarea #reminderField
      rows=24 class="esper-input esper-reminder-text">
      A reminder about this event, or something.
    </textarea>
    <label>
      <input #reminderTime type="text" value="1"> </input> hours before event
    </label>
    <button #reminderButton class="esper-btn esper-btn-danger">
      Cancel reminder
    </button>
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
    var reminderEnabled = true;

    back.click(backFunction);
    next.click(function () {
      if (reminderEnabled) {
        nextFunction({
          text : reminderField.val(),
          time : reminderTime.val() * 60 * 60
        });
      } else {
        nextFunction();
      }
    });

    reminderButton.click(function () {
      if (reminderEnabled) {
        reminderField.attr("disabled", true);

        reminderButton.removeClass("esper-btn-danger");
        reminderButton.addClass("esper-btn-safe");
        reminderButton.text("Enable reminder");
      } else {
        reminderField.attr("disabled", false);

        reminderButton.removeClass("esper-btn-safe");
        reminderButton.addClass("esper-btn-danger");
        reminderButton.text("Disable reminder");
      }

      reminderEnabled = !reminderEnabled;
    });

    return container;
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
