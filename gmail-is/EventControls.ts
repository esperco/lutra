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

    var timeChanged = false;
    if (edit.start.local.replace(/Z$/, "") !== event.start.local ||
        edit.end.local.replace(/Z$/, "") !== event.end.local) {
      timeChanged = true;
      keptOrLost.replaceWith("<b>lost</b>");
    }

    onlyThisEvent.click(function() {
      allEvents.prop("disabled", true);
      onlyThisEvent.prop("disabled", true);
      if (event.recurrence && event.recurrence.rrule.length > 0) {
        // This is the master event
        var timestamp = moment(event.start.utc).utc().toISOString();
        var nopunct = timestamp.slice(0, 19).replace(/[-:]/g, "");
        var singleEventId = event.google_event_id + "_" + nopunct + "Z";
        edit.recurrence = null;
        edit.recurring_event_id = event.google_event_id;
        Api.updateGoogleEvent(team.teamid, alias,
                              singleEventId, edit)
          .done(afterUpdate);
      } else {
        Api.updateGoogleEvent(team.teamid, alias,
                              event.google_event_id, edit)
          .done(afterUpdate);
      }
    });

    function afterUpdate() {
      view.remove();
      finish();
    }

    allEvents.click(function() {
      allEvents.prop("disabled", true);
      onlyThisEvent.prop("disabled", true);
      if (event.recurrence && event.recurrence.rrule.length > 0) {
        // This is the master event
        Api.updateGoogleEvent(team.teamid, alias,
                              event.google_event_id, edit)
          .done(afterUpdate);
      } else {
        Api.getEventDetails(team.teamid, event.google_cal_id,
                            team.team_calendars, event.recurring_event_id)
          .done(function(response) {
            var rev = response.event_opt;
            if (rev && rev.recurrence) {
              // Apply our edits to the master recurring event
              var startLocal =
                XDate.shiftByDifference(event.start.local + "Z",
                                        edit.start.local,
                                        rev.start.local + "Z");
              var endLocal =
                XDate.shiftByDifference(event.end.local + "Z",
                                        edit.end.local,
                                        rev.end.local + "Z");
              var stNoZ = XDate.toString(startLocal).replace(/Z$/, "");
              edit.start = {
                utc: (<any> moment).tz(stNoZ, timezone).format(),
                local: XDate.toString(startLocal)
              };
              var enNoZ = XDate.toString(endLocal).replace(/Z$/, "");
              edit.end = {
                utc: (<any> moment).tz(enNoZ, timezone).format(),
                local: XDate.toString(endLocal)
              }
              edit.recurrence = rev.recurrence;
              edit.recurring_event_id = null;
              edit.location = rev.location;
              if (!edit.location) edit.location = { title: "", address: "" };
              edit.location.timezone = timezone;
              Api.updateGoogleEvent(team.teamid, alias,
                                    rev.google_event_id, edit)
                .done(afterUpdate);
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
<div #container class="esper-ev-inline-container esper-bs">
  <div #heading class="esper-modal-header">
    Edit Event Details
  </div>
  <div class="esper-modal-content container-fluid esper-scroll-target">
    <div class="form-horizontal">
      <div #titleRow class="form-group clearfix">
        <label class="control-label col-sm-2" for="esper-event-title">
          Title</label>
        <div class="col-sm-10">
          <input id="esper-event-title" #pubTitle type="text"
            class="form-control" />
        </div>
      </div>
      <div #whenRow class="form-group clearfix">
        <label class="control-label col-sm-2" for="esper-event-start-date">
          When</label>
        <div class="col-sm-10">
          <div class="row">
            <div class="col-lg-3 col-xs-6">
              <input id="esper-event-start-date"
               #startDate type="date" class="form-control"/>
            </div>
            <div class="col-lg-2 col-xs-5">
              <input #startTime type="time" class="form-control"/>
            </div>
            <label class="col-lg-2 col-xs-1 inline-form-text text-center"
              for="esper-event-end-date">
              to
            </label>
            <div class="col-lg-3 col-xs-6">
              <input #endDate type="date" id="esper-event-end-date"
                class="form-control"/>
            </div>
            <div class="col-lg-2 col-xs-5">
              <input #endTime type="time" class="form-control"/>
            </div>
          </div>
        </div>
      </div>
      <div #whereRow class="form-group clearfix">
        <label class="control-label col-sm-2"
          for="esper-event-location-dropdown">Location</label>
        <div class="col-sm-10">
          <div class="dropdown">
            <input #pubLocation type="text" class="form-control"
              data-toggle="dropdown" id="esper-event-location-dropdown" />
            <ul #locationDropdown class="dropdown-menu" />
          </div>
        </div>
      </div>
      <div #descriptionRow class="form-group clearfix">
        <div class="col-sm-2 text-right">
          <label for="esper-edit-event-description"
                 class="control-label">Description</label>
          <br /><br />
          <button #pickEmails class="btn btn-secondary">
            Pick Emails
          </button>
        </div>
        <div class="col-sm-10">
          <textarea id="esper-edit-event-description" #pubDescription
           rows=8 class="form-control" style="min-height:100px" />
        </div>
      </div>
      <div class="form-group clearfix">
        <label class="control-label col-sm-2">Guests</label>
        <div class="col-sm-10">
          <ul #noGuestsFound class="list-group">
            <li class="list-group-item">No Guests Found</li>
          </ul>
          <ul #viewPeopleInvolved class="list-group" />
          <div class="row clearfix">
            <div class="col-sm-5">
              <input #newGuestName class="form-control"
               type="text" placeholder="Name" />
            </div>
            <div class="col-sm-5">
              <input #newGuestEmail class="form-control"
               type="text" placeholder="Email" />
            </div>
            <div class="col-sm-2">
              <button #addGuest class="btn btn-secondary" style="width:100%">
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="esper-modal-footer esper-clearfix">
    <button #save class="btn btn-primary">
      Save
    </button>
    <button #cancel class="btn btn-secondary">
      Cancel
    </button>
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

        var newTitle = event.title || "Untitled event";
        pubTitle.val(newTitle);

        var calendar = List.find(team.team_calendars, function(cal) {
          return cal.google_cal_id === event.google_cal_id;
        });

        if (event.location) {
          var address = event.location.address;

          if (event.location.title !== "") {
            address = event.location.title + " - " + address;
          }

          pubLocation.val(address);
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
          noGuestsFound.hide();
          viewPeopleInvolved.show();
        } else {
          noGuestsFound.show();
          viewPeopleInvolved.hide();
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
          noGuestsFound.hide();
          viewPeopleInvolved.show();
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
              return true;
            });
          $("body").append(dialog.view);
        });

        var preferences = allPrefs.execPrefs;

        function searchLocation() {
          var query = pubLocation.val();
          LocSearch.displayResults(team, pubLocation, locationDropdown,
                                   query, preferences);
        }
        Util.afterTyping(pubLocation, 250, searchLocation);
        pubLocation.click(searchLocation);

        cancel.click(close);

        CurrentThread.taskPrefs
          .then(Option.unwrap<ApiT.TaskPreferences>
            ("taskPrefs (in displayLinkedEventsList)"))
          .done(function(tpref) {
            var calTimezone = calendar.calendar_timezone;
            var prefs = Teams.getTeamPreferences(team);
            var showTimezone = PrefTimezone.execTimezone(prefs, tpref);
            var start = XDate.ofString(Timezone.shiftTime(event.start.local,
                                                          calTimezone,
                                                          showTimezone));
            var end = XDate.ofString(Timezone.shiftTime(event.end ? event.end.local : event.start.local,
                                                        calTimezone,
                                                        showTimezone));

            startDate.val(XDate.dateValue(start));
            startTime.val(XDate.localTimeOnly24Hours(start));
            endDate.val(XDate.dateValue(end));
            endTime.val(XDate.localTimeOnly24Hours(end));

            save.click(function() {
              //moment-tz apparently doesn't handle these timezones
              if (calTimezone === "US/Eastern") calTimezone = "America/New_York";
              else if (calTimezone === "US/Central") calTimezone = "America/Chicago";
              else if (calTimezone === "US/Mountain") calTimezone = "America/Denver";
              else if (calTimezone === "US/Pacific") calTimezone = "America/Los_Angeles";

              var st = startDate.val() + " " + startTime.val() + "Z";
              var ed = endDate.val() + " " + endTime.val() + "Z";
              var timeDiff = new Date(ed).getTime() - new Date(st).getTime();
              if (timeDiff < 0) {
                alert("Error: That change would make the event end " +
                      "before it starts!");
                return; // exit click handler
              }
              var shiftSt = Timezone.shiftTime(st, showTimezone, calTimezone);
              var shiftEd = Timezone.shiftTime(ed, showTimezone, calTimezone);

              var evStart: ApiT.CalendarTime = {
                local: shiftSt,
                utc: (<any> moment).tz(shiftSt.replace(/Z$/, ""), calTimezone).format()
              };
              var evEnd: ApiT.CalendarTime = {
                local: shiftEd,
                utc: (<any> moment).tz(shiftEd.replace(/Z$/, ""), calTimezone).format()
              };

              var location : ApiT.Location = {
                title: "",
                address: pubLocation.val(),
                timezone: showTimezone
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

              var alias = Login.myEmail();

              function finish() {
                var taskTab = TaskTab.currentTaskTab;
                TaskTab.refreshLinkedEventsList(team, threadId, taskTab);
                close();
              }
              if (event.recurrence || event.recurring_event_id) {
                changeRecurringEventModal(team, alias, event, e, showTimezone, finish);
              } else {
                Api.updateGoogleEvent(team.teamid, alias, event.google_event_id, e)
                  .done(finish);
              }
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
      InThreadControls.setEventControlContainer(eventEditWidget(event, prefs));

      // fix mysteriously appearing padding at end of thread:
      Gmail.threadFooter().css("padding-bottom", "10px");
    });
  }
}
