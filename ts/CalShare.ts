module CalShare {

  function displayCalendarList(view, calendars) {
    List.iter(calendars, function(cal) {
      if (cal.google_access_role !== "Owner") return;
      var row = $("<div class='esper-cal-row'/>");
      var checkbox = $("<input class='esper-cal-check' type='checkbox'/>");
      checkbox.data({
        calendarId: cal.google_cal_id,
        timezone: cal.calendar_timezone,
        title: cal.calendar_title
      });
      Api.getCalendarShares(cal.google_cal_id).done(function(acl) {
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

  function saveCalendarShares(view, team) {
    var calls = [];
    var teamCals = [];
    view.find(".esper-cal-row").each(function() {
      var row = $(this);
      var checkbox = row.find(".esper-cal-check");
      var isChecked = checkbox.is(":checked");
      var calendarId = checkbox.data("calendarId");
      var assistantEmail = $(".esper-assistant-email").val();
      if (isChecked) {
        teamCals.push({
          google_cal_id: calendarId,
          calendar_timezone: checkbox.data("timezone"),
          calendar_title: checkbox.data("title")
        });
        calls.push(Api.putCalendarShare(calendarId, assistantEmail));
      } else {
        var aclId = checkbox.data("aclId");
        calls.push(Api.deleteCalendarShare(calendarId, aclId));
      }
    });
    Deferred.join(calls).done(function() {
      Api.putTeamCalendars(team.teamid, { calendars: teamCals })
        .done(function() {
          window.location.reload();
        });
    });
  }

  export function load(root, team) {
'''
<div #view class="settings-container">
  <div class="header clearfix">
    <a #logoContainer href="#"
       class="img-container-left"/>
    <div class="header-title">Share your calendars</div>
    <span #signOut class="header-signout clickable">Sign out</span>
  </div>
  <div class="divider"/>
  <div #main class="clearfix">
    <div>
      Welcome to Esper! So we can start scheduling, please select
      which calendars to share with your Esper assistant.
    </div>
    <div>Assistant's email: <input #asst class="esper-assistant-email"/></div>
    <div #calendarView class="esper-loading">Loading...</div>
    <button #share class="button-primary">Share</button>
  </div>
  <div #footer/>
</div>
'''
    root.append(view);
    document.title = "Share your calendars - Esper";
    asst.val("brian.jm.esper@gmail.com");

    var logo = $("<img class='svg-block header-logo'/>")
      .appendTo(logoContainer);
    Svg.loadImg(logo, "/assets/img/logo.svg");

    signOut.click(function() {
      Login.clearLoginInfo();
      Signin.signin(function(){}, undefined, undefined, undefined);
      return false;
    });

    footer.append(Footer.load());

    Api.getCalendarList().done(function(response) {
      displayCalendarList(calendarView, response.calendars);
    });

    share.click(function() { saveCalendarShares(calendarView, team); });
  }

}
