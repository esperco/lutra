/*
  Anything related to generating events and agendas goes here,
  including the agenda modal
*/

module Esper.Agenda {

  function renderEvent(team: ApiT.Team,
                       e: ApiT.CalendarEvent,
                       filter: string[]) {
'''
<div #view class="esper-agenda-event">
  <h4 #name></h4>
  <div #weekday class="esper-ev-weekday"/>
  <div #date title class="esper-ev-date">
    <div #month class="esper-ev-month"/>
    <div #day class="esper-ev-day"/>
  </div>
  <div>
    <div #time class="esper-ev-times">
      <span #startTime class="esper-ev-start"/>
      &rarr;
      <span #endTime class="esper-ev-end"/>
    </div>
    <div class="esper-ev-title"><span #title/></div>
    <div class="esper-ev-location"><span #location/></div>
    <p class="esper-ev-task-notes" #taskNotes />
  </div>
</div>
'''
    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end ? e.end.local : e.start.local);

    name.text(team.team_name + "'s Event");
    weekday.text(XDate.fullWeekDay(start));
    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

    if (!_.includes(filter, "time") && !_.includes(filter, "all"))
      time.hide();
    if (!_.includes(filter, "title") && !_.includes(filter, "all"))
      title.hide();
    if (!_.includes(filter, "location") && !_.includes(filter, "all"))
      location.hide();
    if (!_.includes(filter, "task_notes"))
      taskNotes.hide();
    if (!_.includes(filter, "date") && !_.includes(filter, "all")) {
      date.hide();
      weekday.hide();
    }

    var calendar = List.find(team.team_calendars, function(cal) {
      return cal.google_cal_id === e.google_cal_id;
    });

    if (e.title !== undefined) {
      title.text(e.title);
    } else {
      title.text("Untitled event");
    }

    if (e.google_cal_url !== undefined) {
        date
        .addClass("esper-clickable")
        .click(function() {
          open(e.google_cal_url, "_blank");
        })
        .tooltip({
          show: { delay: 500, effect: "none" },
          hide: { effect: "none" },
          "content": "Open in Google Calendar",
          "position": { my: 'center bottom', at: 'center top-1' },
          "tooltipClass": "esper-top esper-tooltip"
        });
      title
        .addClass("esper-link-black")
        .click(function() {
          open(e.google_cal_url, "_blank");
        });
    }

    if (e.location !== undefined) {
      location.text(e.location.address);
    }

    if (e.task_notes !== undefined) {
      taskNotes.html(e.task_notes);
    }

    return view;
  }

  function getCheckedValues(ul: JQuery) {
    return _.filter(_.map(ul.find("label > input:checked"), function(el) {
        return $(el).val();
      }), function(s) {
      return s !== "";
    });
  }

  export function renderModal(currentTeam: ApiT.Team) {
'''
<div #view class="esper-modal-bg">
  <div #modal class="esper-tl-modal">
    <div class="esper-modal-header"><h2 style="margin: 0px;">Agenda</h2></div>
    <span #closeButton class="esper-modal-close esper-clickable">×</span>
    <div class="esper-modal-filter esper-bs esper">
      Show
      <div #teamDropdown class="dropdown esper-dropdown">
        <button #teamSelectToggle class="btn btn-default dropdown-toggle" data-toggle="dropdown">
          Team
          <i class="fa fa-chevron-down"></i>
        </button>
        <ul #teamSelect class="dropdown-menu esper-dropdown-select">
          <li #allTeams>
            <label for="esper-modal-team-all">
              <input id="esper-modal-team-all" type="checkbox" value="" />
              (Select All)
            </label>
          </li>
        </ul>
      </div>
      's agenda from
      <button #timeFromButton class="btn btn-default dropdown-toggle">
        <input #timeFromDate type="hidden"/>
        <i class="fa fa-calendar esper-calendar-icon"></i>
      </button>
      to
      <button #timeUntilButton class="btn btn-default dropdown-toggle">
        <input #timeUntilDate type="hidden"/>
        <i class="fa fa-calendar esper-calendar-icon"></i>
      </button>
      in
      <div #timezoneDropdown class="dropdown esper-dropdown">
        <button #timezoneSelectToggle class="btn btn-default dropdown-toggle" data-toggle="dropdown">
          Timezone
          <i class="fa fa-chevron-down"></i>
        </button>
        <ul #timezoneSelect class="dropdown-menu esper-dropdown-select">
        </ul>
      </div>
      timezone with
      <div #filterDropdown class="dropdown esper-dropdown">
        <button #filterSelectToggle class="btn btn-default  dropdown-toggle" data-toggle="d ropdown">
          Everything
          <i class="fa fa-chevron-down"></i>
        </button>
        <ul #filterSelect class="dropdown-menu esper-dropdown-select">
          <li #allFilter>
            <label for="esper-modal-filter-all">
              <input id="esper-modal-filter-all" type="checkbox" value="all" checked />
              (Select All)
            </label>
          </li>
          <li #dateFilter>
            <label for="esper-modal-filter-date">
              <input id="esper-modal-filter-date" type="checkbox" value="date" checked />
              Date
            </label>
          </li>
          <li #timeFilter>
            <label for="esper-modal-filter-time">
              <input id="esper-modal-filter-time" type="checkbox" value="time" checked />
              Time
            </label>
          </li>
          <li #titleFilter>
            <label for="esper-modal-filter-title">
              <input id="esper-modal-filter-title" type="checkbox" value="title" checked />
              Title
            </label>
          </li>
          <li #locationFilter>
            <label for="esper-modal-filter-location">
              <input id="esper-modal-filter-location" type="checkbox" value="location" checked />
              Location
            </label>
          </li>
          <li #taskNotesFilter>
            <label for="esper-modal-filter-task-notes">
              <input id="esper-modal-filter-task-notes" type="checkbox" value="task_notes" checked />
              Task notes
            </label>
          </li>
        </ul>
      </div>
    </div>
    <div #eventsContainer class="esper-modal-content" style="height: calc(100% - 400px); overflow-y: auto;">
      <div #eventSpinner class="esper-events-list-loading">
        <div class="esper-spinner esper-list-spinner"/>
      </div>
      <span #noEvents style="display: none;">No events</span>
    </div>
    <div class="esper-modal-footer esper-clearfix" style="text-align: left;">
      <div #recipientsContainer class="esper-modal-recipients">
        <label class="esper-agenda-title">
          Task List Format:
        </label>
        <label>
          <input #htmlFormat type="radio" name="format" checked />
          HTML
        </label>
        <label>
          <input #textFormat type="radio" name="format" />
          Plain text
        </label>
        <br />
        <label>
          <input #includeTaskNotes type="checkbox" />
          Include task notes
        </label>
        <table>
           <tr>
            <td valign="top" align="left" style="padding: 0; min-width: 80px;">
              <label class="esper-agenda-title">
                To:
              </label>
            </td>
            <td>
              <div #recipients />
              <textarea #recipientTextArea rows="4" cols="50" />
            </td>
          </tr>
        </table>
      </div>
      <div #errorMessages>
      </div>
      <button #sendButton class="esper-btn esper-btn-primary modal-primary">
        Send Now
      </button>
      <button #cancelButton class="esper-btn esper-btn-secondary modal-cancel">
        Cancel
      </button>
    </div>
  </div>
</div>
'''
    var teams = Login.myTeams();
    teamSelectToggle.dropdown();
    timezoneSelectToggle.dropdown();
    filterSelectToggle.dropdown();
    recipientTextArea.val(Login.myEmail() + ", ");

    function cancel() { view.remove(); }

    function closeDropdowns() {
      teamDropdown.removeClass("open");
      timezoneDropdown.removeClass("open");
      filterDropdown.removeClass("open");
    }

    function displayEventProperties(filter: string[]) {
      // Display all event properties
      if (_.includes(filter, "all")) {
        eventsContainer
          .find(".esper-ev-date, .esper-ev-weekday, .esper-ev-title, .esper-ev-location, .esper-ev-times")
          .show();
        return;
      }

      if (_.includes(filter, "date")) {
        eventsContainer.find(".esper-ev-date").show();
        eventsContainer.find(".esper-ev-weekday").show();
      } else {
        eventsContainer.find(".esper-ev-date").hide();
        eventsContainer.find(".esper-ev-weekday").hide();
      }

      if (_.includes(filter, "title"))
        eventsContainer.find(".esper-ev-title").show();
      else
        eventsContainer.find(".esper-ev-title").hide();

      if (_.includes(filter, "location"))
        eventsContainer.find(".esper-ev-location").show();
      else
        eventsContainer.find(".esper-ev-location").hide();

      if (_.includes(filter, "time"))
        eventsContainer.find(".esper-ev-times").show();
      else
        eventsContainer.find(".esper-ev-times").hide();
    }

    _.forEach(teams, function(team, id) {
      var i = $("<input>")
          .attr({"type": "checkbox", "id": "esper-modal-team" + id})
          .val(team.teamid);
      var l = $("<label>")
          .attr("for", "esper-modal-team" + id)
          .append(i)
          .append(team.team_name);
      var li = $("<li>").append(l);
      if (team === currentTeam) {
          i.prop("checked", true);
      }
      li.appendTo(teamSelect);
    });

    var date = new Date();
    timeFromDate.datepicker({
      onSelect: function(dateText, inst) {
        $(this).parent().contents().first().replaceWith(dateText);
        renderEvents();
      }
    });
    timeUntilDate.datepicker({
      onSelect: function(dateText, inst) {
        $(this).parent().contents().first().replaceWith(dateText);
        renderEvents();
      }
    });

    timeFromDate.datepicker("option", "dateFormat", "yy-mm-dd");
    timeUntilDate.datepicker("option", "dateFormat", "yy-mm-dd");
    timeFromDate.datepicker("setDate", date);
    timeUntilDate.datepicker("setDate", date);

    timeFromButton
      .prepend(timeFromDate.val())
      .click(function() {
        timeFromDate.datepicker("show");
    });

    timeUntilButton
      .prepend(timeUntilDate.val())
      .click(function() {
        timeUntilDate.datepicker("show");
    });

    // Add an Esper class to help namespace CSS, especially since the
    // Datepicker widget seems to be absolutely positioned outside of
    // our DOM elements. Datepicker might actually be re-using the same
    // widget so we don't need to addClass twice, but whatever LOL.
    timeFromDate.datepicker("widget").addClass("esper");
    timeUntilDate.datepicker("widget").addClass("esper");

    var timezone = Teams.getPreferences(currentTeam.teamid).general.current_timezone;

    _.forEach(Timezone.commonTimezones, function(tz, id) {
      var i = $("<input>")
          .attr({"type": "radio",
            "id": "esper-modal-timezone"+id,
            "name": "esper-timezone"})
          .val(tz.id);
      var l = $("<label>")
        .attr("for", "esper-modal-timezone"+id)
        .append(i)
        .append(tz.name)
        .click(function() {
          timezoneSelectToggle.contents().first().replaceWith(tz.name);
        });
      if (tz.id === timezone) {
        i.prop("checked", true);
        timezoneSelectToggle.contents().first().replaceWith(tz.name);
      }
      var li = $("<li>").append(l);
      li.appendTo(timezoneSelect);
    });

    allFilter.find("label > input").change(function(e) {
      e.stopPropagation();
      filterSelect.find("label > input").prop("checked", this.checked);
      displayEventProperties(getCheckedValues(filterSelect));
    });

    filterSelect.find("label > input[value!='all']").change(function(e) {
      if (!$(this).is(":checked")) {
        e.stopPropagation();
        allFilter.find("label > input").prop("checked", false);
        displayEventProperties(getCheckedValues(filterSelect));
      }
    });

    filterSelect.click(function() {
      var filter = getCheckedValues(filterSelect);
      displayEventProperties(filter);
    });

    function appendEmailToTextarea() {
      var emails = recipientTextArea.val();
      if ($(this).is(":checked")) {
        if (emails.search(/(^\s*$)|(?:,\s*$)/) != -1)
          // If the current textarea of emails is blank
          // or if there is a comma at the end, don't prepend comma
          recipientTextArea.val(emails + $(this).val() + ", ");
        else
          recipientTextArea.val(emails + ", " + $(this).val() + ", ");
      } else {
        // Match against the email and the tailing comma and whitespaces
        var regex = new RegExp($(this).val() + ",? *", "i");
        recipientTextArea.val(emails.replace(regex, ""));
      }
    }

    function addRecipientCheckboxes(email, id) {
      var s = $("<span>")
        .css("display", "inline-block");
      var i = $("<input>")
        .attr({ "type": "checkbox", "id": "agenda-recipient" + id})
        .val(email)
        .change(appendEmailToTextarea)
        .appendTo(s);
      if (email === Login.myEmail()) {
        i.prop("checked", true);
      }
      var l = $("<label>")
        .attr("for", "agenda-recipient" + id)
        .addClass("esper-agenda-recipient")
        .text(email)
        .appendTo(s);
      s.appendTo(recipients);
    }

    var recipientEmails = _.uniq(
      _.flatten(
        _.map(teams, function(team: ApiT.Team) {
          return _.map(team.team_assistants, function(uid: string) {
            return Teams.getProfile(uid).email;
          });
        })
      )
    );
    _.forEach(recipientEmails, addRecipientCheckboxes);

    Api.eventRange(currentTeam.teamid,
                   currentTeam.team_calendars,
                   Math.floor(timeFromDate.datepicker("getDate").getTime() / 1000),
                   Math.floor(timeUntilDate.datepicker("getDate").getTime() / 1000 + 86399))
      .done(function(result) {
        if (result.events.length === 0) {
          noEvents.show();
        } else {
          noEvents.hide();
          _.forEach(result.events, function(ev: ApiT.CalendarEvent) {
            var filter = getCheckedValues(filterSelect);
            eventsContainer.append(renderEvent(currentTeam, ev, filter));
            eventsContainer.append($("<hr>"));
          });
        }
        eventSpinner.hide();
      });

    function renderEvents() {
      eventsContainer.children().remove(".esper-agenda-event, hr");
      eventSpinner.show();
      noEvents.hide();
      var teamids = getCheckedValues(teamSelect);
      var teams = _.filter(Login.myTeams(), function(team: ApiT.Team) {
        return _.some(teamids, function(teamid) {
          return team.teamid === teamid;
        });
      });
      var f = timeFromDate.datepicker("getDate");
      var u = timeUntilDate.datepicker("getDate");
      _.forEach(teams, function(team: ApiT.Team) {
        Api.eventRange(team.teamid,
                       team.team_calendars,
                       Math.floor(f.getTime() / 1000),
                       Math.floor(u.getTime()/ 1000 + 86399))
          .done(function(result) {
            if (result.events.length === 0) {
              noEvents.show();
            } else {
              noEvents.hide();
              _.forEach(result.events, function(ev: ApiT.CalendarEvent) {
                var filter = getCheckedValues(filterSelect);
                eventsContainer.append(renderEvent(team, ev, filter));
                eventsContainer.append($("<hr>"));
              });
            }
            eventSpinner.hide();
          });
      });
    }

    modal.click(closeDropdowns);
    Util.preventClickPropagation(teamSelectToggle);
    Util.preventClickPropagation(timezoneSelectToggle);
    Util.preventClickPropagation(filterSelectToggle);

    view.click(cancel);
    Util.preventClickPropagation(modal);
    Util.preventClickPropagation(teamDropdown);
    Util.preventClickPropagation(filterDropdown);
    closeButton.click(cancel);
    cancelButton.click(cancel);
    sendButton.click(function() {
      errorMessages.empty();
      var t = getCheckedValues(teamSelect);
      var tz = _.first(getCheckedValues(timezoneSelect));
      var format = htmlFormat.prop("checked");
      var i = includeTaskNotes.prop("checked");
      var f = timeFromDate.datepicker("getDate");
      var u = timeUntilDate.datepicker("getDate");
      u.setHours(23, 59, 59, 999);
      var r = _.filter(recipientTextArea.val().split(/, /),
        function(s: string) { return s !== ""; });

      function notEmpty(list, arg) {
        if (list.length == 0) {
          var e = $("<span>")
            .addClass("esper-agenda-error")
            .html("You must select at least one " + arg);
          e.appendTo(errorMessages);
          return false;
        }
        return true;
      }

      function validateEmails(arr: string[]) {
        return _.every(arr, function(s) {
          if (s.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i) === null) {
            var e = $("<span>")
              .addClass("esper-agenda-error")
              .html("Invalid email address: " + s);
            e.appendTo(errorMessages);
            return false;
          }
          return true;
        });
      }

      if (!notEmpty(t, "team")
          || !notEmpty(r, "recipient")
          || !validateEmails(r)) {
        return;
      }

      if (f > u) {
        var e = $("<span>")
          .addClass("esper-agenda-error")
          .html("Time From cannot be greater than Time Until");
        e.appendTo(errorMessages);
        return;
      }

      timeFromButton.prop("disabled", true);
      timeUntilButton.prop("disabled", true);
      cancelButton.prop("disabled", true);
      sendButton.prop("disabled", true);
      recipients.children().prop("disabled", true);
      sendButton.text("Sending...");
      Analytics.track(Analytics.Trackable.ClickSendAgenda);

      Api.sendAgenda(t, tz, f.toJSON(), u.toJSON(), format, i, r).done(cancel);
    });

    return _view;
  }
}
