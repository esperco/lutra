/** Contains the UI code for the widget for editing an event */
module Esper.EventControls {
  function changeRecurringEventModal(team: ApiT.Team,
                                     alias: string,
                                     event: ApiT.CalendarEvent,
                                     edit: ApiT.CalendarEventEdit,
                                     timezone: string,
                                     finish: () => void) : void {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-confirm-recur-modal">
    <div class="esper-modal-header">Edit recurring event</div>
    <div class="esper-modal-content" #content>
      <div style="margin-bottom: 10px">
        Would you like to change only this event,
        or all events in the series?
      </div>
      <table>
        <tr>
          <td style="width: 30%; padding: 10px 0">
            <button #onlyThisEvent
                    class="esper-btn esper-btn-primary modal-primary"
                    style="width: 90%">
              Only this event
            </button>
          </td>
          <td>
            All other events in the series will remain the same.
          </td>
        </tr>
        <tr>
          <td>
            <button #allEvents
                    class="esper-btn esper-btn-primary modal-primary"
                    style="width: 90%">
              All events
            </button>
          </td>
          <td>
            All events in the series will be changed.
            <br/>
            <small>Any changes made to other events will be
            <span #keptOrLost>kept</span>.</small>
          </td>
        </tr>
      </table>
    </div>
    <div class="esper-modal-footer esper-clearfix">
      <button #cancelButton class="esper-btn esper-btn-secondary modal-cancel">
        Cancel this change
      </button>
    </div>
  </div>
</div>
'''
    cancelButton.click(function() { view.remove(); });

    Log.d("event", event);
    Log.d("edit", edit);
    var timeChanged = false;
    if (edit.start.local.replace(/Z$/, "") !== event.start.local ||
        edit.end.local.replace(/Z$/, "") !== event.end.local) {
      timeChanged = true;
      keptOrLost.replaceWith("<b>lost</b>");
    }

    onlyThisEvent.click(function() {

    });

    allEvents.click(function() {
      if (event.recurrence && event.recurrence.rrule.length > 0) {
        // This is the master event
        Api.updateGoogleEvent(team.teamid, alias,
                              event.google_event_id, edit)
          .done(function() { view.remove(); finish(); });
      } else {
        Api.getEventDetails(team.teamid, event.google_cal_id,
                            team.team_calendars, event.recurring_event_id)
          .done(function(response) {
            var ev = response.event_opt;
            if (ev && ev.recurrence) {
              Log.d("event started as", event);
              Log.d("we edited it to", edit);
              Log.d("applying that to recurring event", ev);
              var startLocal =
                XDate.shiftByDifference(event.start.local + "Z", edit.start.local,
                                        ev.start.local + "Z");
              var endLocal =
                XDate.shiftByDifference(event.end.local + "Z", edit.end.local,
                                        ev.end.local + "Z");
              edit.start = {
                utc: (<any> moment).tz(XDate.toString(startLocal).replace(/Z$/, ""), timezone).format(),
                local: XDate.toString(startLocal)
              };
              edit.end = {
                utc: (<any> moment).tz(XDate.toString(endLocal).replace(/Z$/, ""), timezone).format(),
                local: XDate.toString(endLocal)
              }
              edit.recurrence = ev.recurrence;
              edit.recurring_event_id = null;
              Api.updateGoogleEvent(team.teamid, alias,
                                    ev.google_event_id, edit)
                .done(function() { view.remove(); finish(); });
            } else {
              alert("Failed to load main recurring event. " +
                    "Please report this error!");
            }
          });
      }
    });

    $("body").append(view);
  }

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
    <div #recurNote style="display: none"/>
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

        if (event.recurrence) {
          if (event.recurrence.rrule.length > 0) {
            recurNote.text("Note: This is a master recurring event! " +
                           "Changes will apply to ALL instances.");
            recurNote.show();
          }
        } else if (event.recurring_event_id) {
          recurNote.text("Note: This is an instance of a recurrence. " +
                         "Changes will only affect this event.");
          recurNote.show();
        }

        var newTitle = event.title || "Untitled event";
        pubTitle.val(newTitle);

        var start = new Date(event.start.local);
        startDate.val(XDate.dateValue(start));
        startTime.val(XDate.timeOnly24Hours(start));
        var end =
          event.end ?
          new Date(event.end.local) :
          new Date(event.start.local);
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

        var fileUpload = FileUpload.uploadWidget(function (fileInfos) {
          fileInfos.forEach(function (fileInfo) {
            // Not sure how to convince typescript that this is the
            // fileInfo object from above.
            var file = <any> fileInfo;

            var link = "https://drive.google.com/file/d/" + file.id +
              "/view?usp=sharing";
            // Puts the links at the *top* of the description.
            pubDescription.val(function (i, text) {
              return "Attachment " + file.name + " <" + link + ">\n\n" + text;
            });
          });
        });
        descriptionRow.before(fileUpload);

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

          function finish() {
            var taskTab = TaskTab.currentTaskTab;
            TaskTab.refreshLinkedEventsList(team, threadId, taskTab);
            close();
          }
          if (event.recurrence || event.recurring_event_id) {
            changeRecurringEventModal(team, alias, event, e, timezone, finish);
          } else {
            Api.updateGoogleEvent(team.teamid, alias, event.google_event_id, e)
              .done(finish);
          }
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
