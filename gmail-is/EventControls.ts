/** Contains the UI code for the widget for editing an event */
module Esper.EventControls {
  /** Returns a widget for editing an event. If there is no current
   *  team, the widget will be blank and say "no team detected".
   */
  // TODO: Figure out better way of handling missing team!
  export function eventEditWidget(event: ApiT.CalendarEvent) {
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
        <div class="esper-ev-modal-left esper-bold">Description</div>
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
    return CurrentThread.currentTeam.get().match({
      some : function (team) {
        /** Removes the widget from the DOM. */
        function close() {
          container.remove();
        }

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

        var timeDiff = end.getTime() - start.getTime();

        function startChange() {
          var s = new Date(startDate.val() + " " + startTime.val() + "Z");
          var e = new Date(s.getTime() + timeDiff);
          endDate.val(XDate.dateValue(e));
          endTime.val(XDate.timeOnly24Hours(e));
        }
        startDate.change(startChange);
        startTime.change(startChange);

        function endChange() {
          var s = new Date(startDate.val() + " " + startTime.val() + "Z");
          var e = new Date(endDate.val() + " " + endTime.val() + "Z");
          timeDiff = e.getTime() - s.getTime();
          if (timeDiff < 0) {
            startDate.val(XDate.dateValue(e));
            startTime.val(XDate.timeOnly24Hours(e));
            timeDiff = 0;
          }
        }
        endDate.change(endChange);
        endTime.change(endChange);

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

        var peopleInvolved = {};
        Log.d(event);
        var participants = event.guests;
        if (participants.length > 0) {
          List.iter(participants, function (participant) {
            var name = participant.display_name || "";
            var checked = true;
            var v = InviteControls.viewPersonInvolved(peopleInvolved,
                                                      participant.email,
                                                      name, checked);
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
          var v = InviteControls.viewPersonInvolved(peopleInvolved, email,
                                                    name, checked);
          viewPeopleInvolved.append(v);
          newGuestName.val("");
          newGuestEmail.val("");
        });

        pubDescription.val(event.description);

        CurrentThread.withPreferences(function(preferences) {

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
            var evStart: ApiT.CalendarTime = {
              local: XDate.toString(st),
              utc: (<any> moment).tz(XDate.toString(st).replace(/Z$/, ""), timezone).format()
            };
            var evEnd: ApiT.CalendarTime = {
              local: XDate.toString(ed),
              utc: (<any> moment).tz(XDate.toString(ed).replace(/Z$/, ""), timezone).format()
            };

            var location = {
              title: "",
              address: pubLocation.val()
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
              location: location,
              all_day: event.all_day,
              guests: guests
            }

            var alias = fromSelect.val();

            Api.updateGoogleEvent(team.teamid, alias, event.google_event_id, e)
              .done(function() {
                var taskTab = TaskTab.currentTaskTab;
                TaskTab.refreshLinkedEventsList(team, threadId, taskTab);
                close();
              });
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
    Gmail.threadContainer().after(eventEditWidget(event));

    // fix mysteriously appearing padding at end of thread:
    Gmail.threadFooter().css("padding-bottom", "10px");
  }
}
