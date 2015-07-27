/** Contains the UI code for the widget for editing an event */
module Esper.EventControls {
  /** Returns a widget for editing an event. If there is no current
   *  team, the widget will be blank and say "no team detected".
   */
  // TODO: Figure out better way of handling missing team!
  export function eventEditWidget(event: ApiT.CalendarEvent,
                                  prefs: Option.T<CurrentThread.TeamAndPreferences>) {
'''
<div #container class="esper-ev-inline-container">
  <div #heading class="esper-modal-header">
    Edit Event Details
  </div>
  <div class="esper-modal-content">
    <div #titleRow class="esper-ev-modal-row esper-clearfix">
      <div class="esper-ev-modal-left esper-bold">Title</div>
        <div class="esper-ev-modal-right">
          <input #pubTitle type="text" class="esper-input"/>
        </div>
      </div>
      <div #whenRow class="esper-ev-modal-row esper-clearfix">
        <div class="esper-ev-modal-left esper-bold">When</div>
        <div class="esper-ev-modal-right">
          <input #startDate type="date" class="esper-input"/>
          <input #startTime type="time" class="esper-input"/>
          to
          <input #endDate type="date" class="esper-input"/>
          <input #endTime type="time" class="esper-input"/>
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
      <div class="esper-ev-modal-row esper-clearfix">
        <div class="esper-ev-modal-left esper-bold">Edited by</div>
        <div class="esper-ev-modal-right">
          <select #fromSelect class="esper-select"/>
        </div>
      </div>
      <div #descriptionRow class="esper-ev-modal-row esper-clearfix">
        <div class="esper-ev-modal-left esper-bold">Description<br/>
          <button #pickEmails class="esper-btn esper-btn-secondary">
            Pick Emails
          </button>
        </div>
        <div class="esper-ev-modal-right">
          <textarea #pubDescription rows=8 cols=28 class="esper-input"/>
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
        <button #save class="esper-btn esper-btn-primary modal-primary">
          Save
        </button>
        <button #cancel class="esper-btn esper-btn-secondary modal-cancel">
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
'''
    return prefs.match({
      some : function (allPrefs) {
        /** Removes the widget from the DOM. */
        function close() {
          container.remove();
        }

        var team = allPrefs.team;
        var threadId = CurrentThread.threadId.get();

        Sidebar.customizeSelectArrow(fromSelect);

        var newTitle = event.title || "Untitled event";
        pubTitle.val(newTitle);

        var start = new Date(event.start.local);
        startDate.val(XDate.dateValue(start));
        startTime.val(XDate.timeOnly24Hours(start));
        var end = new Date(event.end.local);
        endDate.val(XDate.dateValue(end));
        endTime.val(XDate.timeOnly24Hours(end));

        if (event.location) {
          var address = event.location.address;

          if (event.location.title !== "") {
            address = event.location.title + " - " + address;
          }

          pubLocation.val(address);
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
        allPrefs.taskPrefs.match({
          some: function(prefs) { taskPrefs = prefs; },
          none: function() { }
        });

        var peopleInvolved : { [email:string]: string } = {};
        Log.d(event);
        var participants = event.guests;
        if (participants.length > 0) {
          List.iter(participants, function (participant) {
            var name = participant.display_name || "";
            var email = participant.email;
            var checked = true;
            var tz = InviteControls.timezoneForGuest(email, taskPrefs, event);
            var v = InviteControls.viewPersonInvolved(peopleInvolved, email,
                                                      name, tz, taskPrefs,
                                                      checked);
            viewPeopleInvolved.append(v);
          });
        } else {
          viewPeopleInvolved
            .append($("<li class='esper-gray'>No guests found</li>"));
        }

        addGuest.click(function() {
          var name  = newGuestName.val();
          var email = newGuestEmail.val();
          peopleInvolved[email] = name;
          if (name === "" || email === "" || !email.match(/.*@.*\..*/)) return;

          var checked = true;
          var tz = InviteControls.timezoneForGuest(email, taskPrefs, event);
          var v = InviteControls.viewPersonInvolved(peopleInvolved, email,
                                                    name, tz, taskPrefs,
                                                    checked);
          viewPeopleInvolved.append(v);
          newGuestName.val("");
          newGuestEmail.val("");
        });

        pubDescription.val(event.description);

        var descriptionMessageids = event.description_messageids || [];
        pickEmails.click(function() {
          var dialog = Modal.dialog("Task Messages",
            TaskMessageList.render(taskPrefs.taskid, descriptionMessageids),
            function() {
              Api.getEventDescriptionWithMessages
                (pubDescription.val(), descriptionMessageids)
              .then(function(desc) {
                pubDescription.val(desc.description_text);
              });
            });
          $("body").append(dialog.view);
        });

        var preferences = allPrefs.execPrefs;

        function searchLocation() {
          var query = pubLocation.val();
          LocSearch.displayResults(team, pubLocation, locationDropdown,
                                   locationSearchResults, query,
                                   preferences);
        }
        Util.afterTyping(pubLocation, 250, searchLocation);
        pubLocation.click(searchLocation);

        cancel.click(close);
        save.click(function() {
          var timezone = preferences.general.current_timezone;

          //moment-tz apparently doesn't handle these timezones
          if (timezone === "US/Eastern") timezone = "America/New_York";
          else if (timezone === "US/Central") timezone = "America/Chicago";
          else if (timezone === "US/Mountain") timezone = "America/Denver";
          else if (timezone === "US/Pacific") timezone = "America/Los_Angeles";

          var st = new Date(startDate.val() + " " + startTime.val() + "Z");
          var ed = new Date(endDate.val() + " " + endTime.val() + "Z");
          var timeDiff = ed.getTime() - st.getTime();
          if (timeDiff < 0) {
            alert("Error: That change would make the event end " +
                  "before it starts!");
            return; // exit click handler
          }
          var evStart: ApiT.CalendarTime = {
            local: XDate.toString(st),
            utc: (<any> moment).tz(XDate.toString(st).replace(/Z$/, ""), timezone).format()
          };
          var evEnd: ApiT.CalendarTime = {
            local: XDate.toString(ed),
            utc: (<any> moment).tz(XDate.toString(ed).replace(/Z$/, ""), timezone).format()
          };

          var location : ApiT.Location = {
            title: "",
            address: pubLocation.val(),
            timezone: timezone
          };
          if (!location.address) location = null;

          var guests = [];
          for (var person in peopleInvolved) {
            if (peopleInvolved.hasOwnProperty(person)) {
              guests.push({
                display_name : peopleInvolved[person] || null,
                email        : person
              });
            }
          }

          var e: ApiT.CalendarEventEdit = {
            google_cal_id: event.google_cal_id,
            start: evStart,
            end: evEnd,
            title: pubTitle.val(),
            description: pubDescription.val(),
            description_messageids: descriptionMessageids,
            location: location,
            all_day: event.all_day,
            guests: guests,
            recurrence: event.recurrence,
            recurring_event_id: event.recurring_event_id
          }

          var alias = fromSelect.val();

          Api.updateGoogleEvent(team.teamid, alias, event.google_event_id, e)
            .done(function() {
              var taskTab = TaskTab.currentTaskTab;
              TaskTab.refreshLinkedEventsList(team, threadId, taskTab);
              close();
            });
        });

        return container;
      },
      none : function () {
        container.empty();
        container.text("No team detected.");
        return container;
      }
    });
  }

  /** Inserts a new "Event Event" widget after the contents of the
   *  GMail thread and fixes the formatting of another GMail div that
   *  was causing problems.
   */
  export function insertAfterThread(event) {
    CurrentThread.getTeamAndPreferences().done(function(prefs) {
      Gmail.threadContainer().after(eventEditWidget(event, prefs));

      // fix mysteriously appearing padding at end of thread:
      Gmail.threadFooter().css("padding-bottom", "10px");
    });
  }
}
