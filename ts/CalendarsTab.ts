/*
  Team Settings - Calendars Tab
*/

module CalendarsTab {

  var calendarAcls = {}; // cache of API call results

  function makeCalendarRow(cal) {
'''
<tr #view class="esper-calendar-option">
  <td><input #viewBox type="checkbox" class="esper-cal-view"></td>
  <td><input #writeBox type="checkbox" class="esper-cal-write"></td>
  <td><input #dupeBox type="checkbox" class="esper-cal-dupe"></td>
  <td><input #agendaBox type= "checkbox" class="esper-cal-agenda"></td>
  <td #calName class="esper-cal-name"/>
</tr>
'''
    if (cal.calendar_default_view)
      viewBox.prop("checked", true);
    if (cal.calendar_default_write)
      writeBox.prop("checked", true);
    if (cal.calendar_default_dupe)
      dupeBox.prop("checked", true);
    if (cal.calendar_default_agenda)
      agendaBox.prop("checked", true);

    calName.text(cal.calendar_title)
           .dblclick(function() { $(this).parent().remove(); });

    view.data("calid", cal.google_cal_id)
        .data("timezone", cal.calendar_timezone);

    return view;
  }

  // TODO Styling
  function makeCalendarSelectors(team, root) {
'''
<div #view>
  <div style="float: left; width: 40%">
    <div><b>All calendars:</b></div>
    <div style="font-size: 75%">(double-click to add)</div>
    <select #allCals multiple="multiple" size=5 />
  </div>
  <div>
    <div><b>Team calendars:</b></div>
    <div style="font-size: 75%">(double-click to remove)</div>
    <table #teamCals>
      <tr>
        <td>View</td>
        <td>Write</td>
        <td>Dupe</td>
        <td>Agenda</td>
      </tr>
    </table>
  </div>
  <br/>
  <div>
    <button #saveCals class="button-primary">Save Team Calendars</button>
  </div>
</div>
'''
    List.iter(team.team_calendars, function(cal) {
      makeCalendarRow(cal).appendTo(teamCals);
    });

    Api.getCalendarList().done(function(x) {
      List.iter(x.calendars, function(cal) {
        $("<option>" + cal.calendar_title + "</option>")
          .appendTo(allCals)
          .dblclick(function() {
            makeCalendarRow(cal).appendTo(teamCals);
          });
      });

      saveCals.click(function() {
        var teamOpts = teamCals.find(".esper-calendar-option");
        var teamCalIDs = [];
        var calData = {};
        teamOpts.each(function(i) {
          var row = $(teamOpts[i]);
          var calID = row.data("calid");
          teamCalIDs.push(calID);
          calData[calID] = {
            google_cal_id: calID,
            calendar_timezone: row.data("timezone"),
            calendar_title: row.find(".esper-cal-name").text(),
            calendar_default_view: row.find(".esper-cal-view").is(":checked"),
            calendar_default_write: row.find(".esper-cal-write").is(":checked"),
            calendar_default_dupe: row.find(".esper-cal-dupe").is(":checked"),
            calendar_default_agenda: row.find(".esper-cal-agenda").is(":checked")
          };
        });
        // remove duplicates
        var uniqueCalIDs = List.union(teamCalIDs, [], undefined);
        var teamCalendars = List.map(uniqueCalIDs, function(calID) {
          return calData[calID];
        });
        Api.putTeamCalendars(team.teamid, { calendars: teamCalendars })
          .done(function() { window.location.reload(); });
      });

      root.append(view);
    });
  }

  function displayCalendarList(view, calendars) {
    view.children().remove();
    List.iter(calendars, function(cal) {
      if (cal.google_access_role !== "Owner") return;

      var row = $("<div class='esper-cal-row'/>");
      var checkbox = $("<input class='esper-cal-check' type='checkbox'/>");
      checkbox.data({
        calendarId: cal.google_cal_id,
        timezone: cal.calendar_timezone,
        title: cal.calendar_title
      });

      var cachedAcl = calendarAcls[cal.google_cal_id];
      var getAcl =
        cachedAcl === undefined ?
        Api.getCalendarShares(cal.google_cal_id) :
        Deferred.defer(cachedAcl);

      getAcl.done(function(acl) {
        calendarAcls[cal.google_cal_id] = acl;

        function isEsperAssistant(x) {
          var assistantEmail = $(".esper-assistant-email").val();
          return x.acl_email === assistantEmail;
        }

        var withEsper = List.find(acl.shared_emails, isEsperAssistant);
        if (withEsper !== null) {
          checkbox.prop("checked", true)
                  .data("aclId", withEsper.acl_id);
        }
        var title =
          $("<span class='esper-cal-title'>" + cal.calendar_title
            + "</span>");
        if (view.hasClass("esper-loading")) {
          view.text("");
          view.removeClass("esper-loading");
        }

        row.append(checkbox).append(" ").append(title)
           .appendTo(view);
      });
    });
  }

  function saveCalendarShares(team, view, share, allCals, onboarding) {
    var calls = [];
    var teamCals = [];
    view.find(".esper-cal-row").each(function() {
      var row = $(this);
      var checkbox = row.find(".esper-cal-check");
      var isChecked = checkbox.is(":checked");
      var calendarId = checkbox.data("calendarId");

      List.iter(Login.data.team_members, function(tm : ApiT.TeamMember) {
        if (List.mem(team.team_assistants, tm.member_uid)) {
          var assistantEmail = tm.member_email;
          if (isChecked) {
            teamCals.push({
              google_cal_id: calendarId,
              calendar_timezone: checkbox.data("timezone"),
              calendar_title: checkbox.data("title")
            });
            calls.push(Api.putCalendarShare(calendarId, assistantEmail));
          } else {
            var aclId = checkbox.data("aclId");
            if (Util.isString(aclId))
              calls.push(Api.deleteCalendarShare(calendarId, aclId));
          }
        }
      });
    });

    function goToAboutPage() {
      var freePlan = "Basic_20150123";
      Api.setSubscription(team.teamid, freePlan)
        .done(function() {
          TeamSettings.switchTabByName("abt");
        });
    }

    share.text("Sharing...").attr("disabled", "true");
    Deferred.join(calls).done(function() {
      Api.putTeamCalendars(team.teamid, { calendars: teamCals })
        .done(function() {
          if (onboarding) {
            if (team.team_name === "") goToAboutPage();
            else {
              /* During onboarding, create a "ghost calendar" for the EA to
                 keep negative time (no scheduling), notes, etc. */
              var primary = List.find(allCals, function(cal : ApiT.Calendar) {
                return cal.is_primary;
              });
              var tz = primary.calendar_timezone;
              if (tz === undefined) tz = "America/Los_Angeles";
              /* Because we're onboarding, this team has an Esper assistant.
                 It should be the first (and only) assistant.
                 This may change in the future, and then we'd have to check.
              */
              var esperAsst = team.team_assistants[0];
              Api.createTeamCalendar(esperAsst, team.teamid, tz,
                                     team.team_name + " Ghost")
                .done(goToAboutPage);
            }
          } else window.location.reload();
        });
    });
  }

  function makeAliasSection(team, root) {
'''
<div #view>
  <div style="float: left; width: 40%">
    <div style="width: 80%">
      <b>Email addresses for calendar invites and reminders:</b>
    </div>
    <select #teamAliases multiple size=3 style="width: 80%"/>
  </div>
  <div>
    <div><b>Add an email address:</b></div>
    <input #newAlias type="text"/>
    <button #saveAlias class="button-primary">Add</button>
  </div>
</div>
'''
    function setTeamEmails() {
      var teamOpts = teamAliases.find(".esper-email-alias");
      var teamEmails = [];
      teamOpts.each(function(i) {
        var opt = $(teamOpts[i]);
        teamEmails.push(opt.text());
      });
      // remove duplicates
      var uniqueEmails = List.union(teamEmails, [], undefined);
      Api.putTeamEmails(team.teamid, { emails: uniqueEmails })
        .done(function() { team.team_email_aliases = uniqueEmails; });
    }

    function removeOpt() {
      $(this).remove();
      setTeamEmails();
    }

    List.iter(team.team_email_aliases, function(email) {
      var opt = $("<option class='esper-email-alias'>"
                  + email + "</option>");
      opt.dblclick(removeOpt)
         .appendTo(teamAliases);
    });

    saveAlias.click(function() {
      var email = newAlias.val();
      if (email === "") return;
      newAlias.val("");
      $("<option class='esper-email-alias'>" + email + "</option>")
        .dblclick(removeOpt)
        .appendTo(teamAliases);
      setTeamEmails();
    });

    root.append(view);
  }

  export function load(team, onboarding?) {
'''
<div #view>
  <div #teamCalendars>
    <div class="esper-h1">Team Calendars</div>
    <div #description class="calendar-setting-description">
      Welcome to Esper! So we can start scheduling, please select
      which calendars to share with your Esper assistant.
    </div>
    <div #calendarView class="esper-loading">Loading...</div>
    <button #share class="button-primary">Share Calendars</button>
  </div>
  <br/>
  <div #calendarSelector/>
  <br/>
  <div #emailAliases/>
</div>
'''
    if (!Login.isExecCustomer(team)) {
      teamCalendars.hide();
      makeCalendarSelectors(team, calendarSelector);
      makeAliasSection(team, emailAliases);
    } else {
      calendarSelector.hide();
      emailAliases.hide();

      Api.getCalendarList().done(function(response) {
        displayCalendarList(calendarView, response.calendars);

        share.click(function() {
          saveCalendarShares(team, calendarView, share,
                             response.calendars, onboarding);
        });
      });

      if (onboarding) {
        share.css("float", "right");
      } else {
        description.text("Please select which calendars to share " +
                         "with your Esper assistant.");
      }
    }

    return view;
  }

}
