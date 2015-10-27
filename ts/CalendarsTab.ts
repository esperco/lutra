/*
  Team Settings - Calendars Tab
*/

module Esper.CalendarsTab {

  var calendarAcls = {}; // cache of API call results

  function makeCalendarRow(teamid, cal, shared=true) {
'''
<tr #view class="esper-calendar-option">
  <td><input #viewBox type="checkbox" class="esper-cal-view"></td>
  <td><input #writeBox type="checkbox" class="esper-cal-write"></td>
  <td><input #dupeBox type="checkbox" class="esper-cal-dupe"></td>
  <td><input #agendaBox type= "checkbox" class="esper-cal-agenda"></td>
  <td #calName class="esper-cal-name"/>
  <td><a #csvButton href="#">
    <i class="fa fa-fw fa-cloud-download"></i> Export to CSV
  </a></td>
</tr>
'''
    calName.text(cal.calendar_title);

    if (shared) {
      if (cal.calendar_default_view)
        viewBox.prop("checked", true);
      if (cal.calendar_default_write)
        writeBox.prop("checked", true);
      if (cal.calendar_default_dupe) {
        dupeBox.prop("checked", true);
        viewBox.prop("checked", true).prop("disabled", true);
      }
      if (cal.calendar_default_agenda) {
        agendaBox.prop("checked", true);
        viewBox.prop("checked", true).prop("disabled", true);
      }

      csvButton.click(function() {
        var now = new Date();
        var start = new Date(now.getTime() - 31*86400000);
        var q = {
          window_start: XDate.toString(start),
          window_end:   XDate.toString(now)
        }
        Api.postForCalendarEventsCSV(teamid, cal.google_cal_id, q)
          .done(function(csv) {
            window.open("data:text/csv;charset=utf-8," + encodeURI(csv));
          });
      });
    } else {
      csvButton.hide();
    }

    view.data("calid", cal.google_cal_id)
        .data("authorized", cal.authorized_as)
        .data("timezone", cal.calendar_timezone);

    dupeBox.change(function(e) {
      if (dupeBox.prop("checked")) {
        viewBox.prop("checked", true).prop("disabled", true);
      } else if (! agendaBox.prop("checked")) {
        viewBox.prop("disabled", false);
      }
    });

    agendaBox.change(function(e) {
      if (agendaBox.prop("checked")) {
        viewBox.prop("checked", true).prop("disabled", true);
      } else if (! dupeBox.prop("checked")) {
        viewBox.prop("disabled", false);
      }
    });

    return view;
  }

  function makeAccountSelector(team, root) {
'''
<div #view>Accounts:<br/>
  <select #calAccounts size=3 style="color: black"/><br/><br/>
  <button #addCalAccount class="button-secondary">Add calendars from another account</button>
</div>
'''
    $("<option/>").text(Login.data.email).appendTo(calAccounts);
    List.iter(team.team_calendar_accounts, function(email:string) {
      $("<option/>").text(email).appendTo(calAccounts);
    });

    addCalAccount.click(function() {
      Api.getGoogleAuthUrlForTeam(team.team_executive, team.teamid,
                                  window.location.href)
      .done(function(x) {
        window.location.href = x.url;
      });
    });

    root.append(view);
  }

  // TODO Styling
  function makeCalendarSelectors(team, root) {
'''
<div #view>
  <h4>Team Calendars <small>(Uncheck All to Unshare)</small></h4>
  <table #teamCals class="table">
    <tr>
      <th>View</th>
      <th>Write</th>
      <th>Dupe</th>
      <th>Agenda</th>
      <th></th>
      <th></th>
    </tr>
  </table>
  <hr />
  <button #saveCals class="button-primary">Save Team Calendars</button>
</div>
'''
    List.iter(team.team_calendars, function(cal) {
      makeCalendarRow(team.teamid, cal).appendTo(teamCals);
    });

    Api.getCalendarList().done(function(x) {
      List.iter(x.calendars, function(cal) {
        var alreadyShared = !!_.find(team.team_calendars,
          function(teamCal: ApiT.Calendar) {
            return teamCal.google_cal_id === cal.google_cal_id;
          });
        if (! alreadyShared) {
          makeCalendarRow(team.teamid, cal, false).appendTo(teamCals);
        }
      });

      saveCals.click(function() {
        saveCals.prop("disabled", true);
        saveCals.text("Saving ...");
        var teamOpts = teamCals.find(".esper-calendar-option");
        var teamCalIDs = [];
        var calData = {};
        teamOpts.each(function(i) {
          var row = $(teamOpts[i]);
          var calID = row.data("calid");
          var authorizedAs = row.data("authorized");

          var calendar_default_view =
            row.find(".esper-cal-view").is(":checked");
          var calendar_default_write =
            row.find(".esper-cal-write").is(":checked");
          var calendar_default_dupe =
            row.find(".esper-cal-dupe").is(":checked");
          var calendar_default_agenda =
            row.find(".esper-cal-agenda").is(":checked");

          if (calendar_default_view || calendar_default_write ||
              calendar_default_dupe || calendar_default_agenda) {
            teamCalIDs.push(calID);
            calData[calID] = {
              google_cal_id: calID,
              authorized_as: authorizedAs,
              calendar_timezone: row.data("timezone"),
              calendar_title: row.find(".esper-cal-name").text(),
              calendar_default_view: calendar_default_view,
              calendar_default_write: calendar_default_write,
              calendar_default_dupe: calendar_default_dupe,
              calendar_default_agenda: calendar_default_agenda
            };
          }
        });

        // remove duplicates
        var uniqueCalIDs = List.union(teamCalIDs, [], undefined);
        var teamCalendars = List.map(uniqueCalIDs, function(calID) {
          return calData[calID];
        });
        Api.putTeamCalendars(team.teamid, teamCalendars)
          .done(function() {
            Route.nav.path("team-settings/" + team.teamid + "/calendars");
            window.location.reload();
          });
      });

      root.empty().append(view);
    });
  }

  export function displayCalendarList(view, calendars: ApiT.Calendar[]) {
    view.children().remove();
    List.iter(calendars, function(cal) {
      if (cal.google_access_role !== "Owner") return;

      var row = $("<div class='esper-cal-row'/>");
      var checkbox = $("<input class='esper-cal-check' type='checkbox'/>");
      checkbox.data({
        calendarSpec: {google_cal_id: cal.google_cal_id,
                       authorized_as: cal.authorized_as},
        timezone: cal.calendar_timezone,
        title: cal.calendar_title
      });

      var cachedAcl = calendarAcls[cal.google_cal_id];
      var getAcl =
        cachedAcl === undefined ?
        Api.getCalendarShares(cal) :
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

  export function saveCalendarShares(team, view, share, allCals) {
    var calls = [];
    var teamCals = [];
    view.find(".esper-cal-row").each(function() {
      var row = $(this);
      var checkbox = row.find(".esper-cal-check");
      var isChecked = checkbox.is(":checked");
      var calendarSpec = checkbox.data("calendarSpec");

      List.iter(Login.data.team_members, function(tm : ApiT.TeamMember) {
        if (List.mem(team.team_assistants, tm.member_uid)) {
          var assistantEmail = tm.member_email;
          if (isChecked) {
            teamCals.push({
              google_cal_id: calendarSpec.google_cal_id,
              calendar_timezone: checkbox.data("timezone"),
              calendar_title: checkbox.data("title")
            });
            calls.push(Api.putCalendarShare(calendarSpec, assistantEmail));
          } else {
            var aclId = checkbox.data("aclId");
            if (Util.isString(aclId))
              calls.push(Api.deleteCalendarShare(calendarSpec, aclId));
          }
        }
      });
    });

    share.text("Sharing...").attr("disabled", "true");

    return Deferred.join(calls)
      .then(function() {
        return Api.putTeamCalendars(team.teamid, teamCals);
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

  export function load(team) {
'''
<div #view>
  <div #container>
    <div #calendarSelector/>
  </div>
</div>
'''
    makeCalendarSelectors(team, calendarSelector);
    return view;
  }

}
