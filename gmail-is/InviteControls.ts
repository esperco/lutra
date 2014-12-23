/** Contains the UI code for the widget for editing an event or
 *  creating a duplicate.
 */
module Esper.InviteControls {
  /** Returns a widget for inviting guests to the current event or to
   *  a duplicate event, depending on the relevant setting in the exec
   *  preferences.
   */
  export function widget(event: ApiT.CalendarEvent) {
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
        <div class="esper-ev-modal-left esper-bold">Description</div>
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
        <button #create class="esper-btn esper-btn-primary modal-primary">
          Create
        </button>
        <button #cancel class="esper-btn esper-btn-secondary modal-cancel">
          Cancel
        </button>
      </div>
    </div>
  </div>
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

    pubTitle.val(event.title || "Untitled event");
    pubNotes.val(event.description || "");
    
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
    team.team_calendars.forEach(function(cal : ApiT.Calendar) {
      pubCalendar.append($("<option value='" + cal.google_cal_id + "'>" +
                           cal.calendar_title + "</option>"));
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

    var peopleInvolved = [];
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

      if (!duplicate) {
        heading.text("Invite guests to this calendar event");
        titleRow.hide();
        whereRow.hide();
        calendarRow.hide();
        notesRow.hide();
      }

      create.click(function() {
        create.text(duplicate ? "Creating..." : "Inviting...");
        create.prop("disabled", true);
        var guests = [];
        for (var email in peopleInvolved) {
          guests.push({email: email, display_name: peopleInvolved[email]});
        }

        var location = {
          /* Right now we don't care about title because this is just text
             to be displayed in the Google Calendar location box... but in
             the future we may use it for typeahead or something. */
          title   : "",
          address : pubLocation.val()
        };
        if (!location.address) location = null;
        var eventEdit: ApiT.CalendarEventEdit = {
          google_cal_id : publicCalId,
          start         : event.start,
          end           : event.end,
          title         : pubTitle.val(),
          description   : pubNotes.val(),
          location      : location,
          all_day       : event.all_day,
          guests        : guests,
        };

        if (duplicate) {
          Api.createLinkedEvent(team.teamid, eventEdit, threadId)
            .done(function(created) {
              Api.sendEventInvites(team.teamid, fromSelect.val(), guests, created);
              TaskTab.refreshlinkedEventsList(team, threadId,
                                              TaskTab.currentTaskTab,
                                              Sidebar.profiles);

              close();
            });
        } else {
          Api.sendEventInvites(team.teamid, fromSelect.val(), guests, event);
          close();
        }
      });
    });

    cancel.click(close);

    return container;
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