/*
  Onboarding page(s)
*/

/// <reference path="TeamSettings.ts"/>

module Onboarding {
  // Routes to a particular onboarding step
  export function goToStep(step: number) {
    Route.nav.path("#!join/" + step);
  }

  // Returns the root container object into which we insert onboarding stuff
  function rootElm(): JQuery {
    return $("#onboarding-interface");
  }

  // Interface for references from string names to jQuery wrapper
  interface IJQMap {
    [index: string]: JQuery;
  }

  // Loads the main wrapper UX for onboarding, returns a JQuery wrapper for
  // where step-specific content should go
  function loadContainer(): IJQMap {
'''
<div #view class="onboarding">
  <div class="container">
    <div class="progress">
      <div #progress class="progress-bar progress-bar-info" role= "progressbar" />
    </div>
    <div class="row onboarding-text">
      <div #content class="col-sm-offset-2 col-sm-8" />
    </div>
  </div>
</div>
'''
    var root = rootElm();
    root.children().remove();
    root.append(view);
    return {
      view: view,
      progress: progress,
      content: content
    };
  }

  let steps = [step0, step1, step2, step3, step4];

  export function load(step = 0,
                       opts?: {fromLogin?: boolean, inviteCode?: string}) {
    var refs = loadContainer();
    if (opts && opts.fromLogin) {
      step0FromLogin(refs);
    } else if (opts && opts.inviteCode) {
      step0FromInvite(refs, opts.inviteCode);
    } else {
      steps[step](refs);
    }
  }

  // Takes a JQuery-wrapped submit button and makes it look "busy"
  function makeBusy(button: JQuery, text = "Saving ..."): void {
    button.text(text);
    button.prop("disabled", true);
  }

  // Undoes makeBusy
  function unmakeBusy(button: JQuery, text = "Save"): void {
    button.text(text);
    button.prop("disabled", false);
  }

  // Base function for our "step 0" join page -- takes a custom message
  function _step0(refs: IJQMap, customMsg?: string, inviteCode?: string): void {
    refs["progress"].width("20%");

    // Log out if applicable
    if (Login.data) {
      Login.clearLoginInfo();
    }
'''
<div #view style="text-align: center">
  <div #msg>
    <strong>Awesome.</strong> Our assistants need access to your calendar to
    assist you with scheduling.<br />
    Please sign in with the account tied to your primary calendar
    to continue.
  </div>
  <div #buttonContainer style="padding:40px 0">
  </div>
  <div>
    Use Microsoft Office or Exchange for calendaring?<br />Contact us at
    <a #exchangeLink href="mailto:support@esper.com">
      support@esper.com</a> to get set up.
    <br /><br />
    <a href="http://esper.com/mailing-list">
      Use something else? Click here.
    </a>
    <br /><br />
    By signing in, you agree to Esper's
    <a href="http://esper.com/terms-of-use">Terms of Use.</a>
  </div>
</div>
'''
    if (customMsg) {
      msg.html(customMsg);
    }

    var exchangeEmailSubject = "Join Esper (Microsoft Office / Exchange)";
    var exchangeEmailBody = "Hi, I'd like to sign up for Esper!";
    exchangeEmailSubject = encodeURIComponent(exchangeEmailSubject);
    exchangeEmailBody = encodeURIComponent(exchangeEmailBody);
    exchangeLink.attr('href', "mailto:support@esper.com?subject=" +
      exchangeEmailSubject + "&body=" + exchangeEmailBody);

    buttonContainer.append(
      Signin.googleButton(
        /* landingUrl */ "#!join/1",
        /* optInvite  */ inviteCode,
        /* optEmail   */ undefined,
        /* optSignup  */ true));

    buttonContainer.append(
      Signin.exchangeButton(
        /* landingUrl */ "#!join/1",
        /* optInvite  */ inviteCode,
        /* optEmail   */ undefined,
        /* optSignup  */ true));

    let content = refs["content"];
    content.append(view);
  }

  /* Step 0 => Sign in normally */
  function step0(refs: IJQMap): void {
    _step0(refs);
  }

  function step0FromLogin(refs: IJQMap): void {
    _step0(refs, `We don't have a registered account for you.<br />
      Please sign in again to create an account.`);
  }

  function step0FromInvite(refs: IJQMap, inviteCode: string): void {
    _step0(refs, `Thanks for accepting our invite!<br />
      Our assistants need access to your calendar to assist with scheduling.
      Please sign in with the account tied to your primary calendar to
      continue.`, inviteCode);
  }

  // Use to get current team if we're working form Onboarding flow
  function getTeam(): ApiT.Team {
    var team = Login.getTeam();
    if (!team) {
      let teams = Login.getTeams() || [];
      if (teams.length) {
        var joinTeamId = Login.data.missing_shared_calendar;
        if (joinTeamId) {
          team = List.find(Login.getTeams(), function(t : ApiT.Team) {
            return t.teamid === joinTeamId;
          });
        } else {
          team = teams[0];
        }
      }
    }

    if (team) {
      Login.setTeam(team);
      return team;
    }
  }

  /* Step 1 => Confirm executive name */
  function step1(refs: IJQMap): void {
    refs["progress"].width("40%");
'''
<form #form class="form">
  <div class="page-header">
    <h2>
      Thanks!
      <small>We need some additional info to continue.</small>
    </h2>
  </div>
  <div #nameGroup class="form-group row">
    <label class="col-xs-12 control-label" for="step0-name">Name</label>
    <div class="col-xs-12">
      <input #name type="text" id="step0-name" class="form-control"
             placeholder="Your Name Here" />
    </div>
  </div>
  <div #phoneGroup class="form-group row">
    <label for="step0-phone" class="col-xs-12 control-label">
      Phone Number</label>
    <div class="col-sm-4">
      <select class="form-control ignore-error" #phoneType>
        <option value="Mobile" selected="selected">mobile</option>
        <option value="Work">work</option>
        <option value="Home">home</option>
        <option value="Other">other</option>
      </select>
    </div>
    <div class="xs-spacer"></div>
    <div class="col-sm-8">
      <input #phone type="text" class="form-control" id="step0-phone"
             placeholder="555-555-5555" />
    </div>
  </div>
  <div class="form-group row"><div class="col-xs-12">
    <button #submit type="submit" class="btn btn-primary">Save</button>
  </div></div>
</form>
'''
    // Set default name (in case we got this info from elsewhere)
    // NB: It'd be nice if we could check if there was currently a phone
    // number set too, but it's not worth making an extra API call, especially
    // if we expect the number of people with pre-set phone numbers to below
    let team = getTeam();
    if (team && team.team_name && team.team_name !== Login.data.email) {
      name.attr("value", team.team_name);
    }

    // Submit handler
    form.submit(function(e) {
      let isValid = true;

      // Reset validation
      nameGroup.removeClass("has-error");
      phoneGroup.removeClass("has-error");

      // Get & validate name
      let nameVal = name.val();
      if (! nameVal) {
        nameGroup.addClass("has-error");
        isValid = false;
      }

      // Get & validate phone number
      let phoneVal = phone.val();
      let phoneTypeVal = phoneType.val();
      if (! phoneVal) {
        phoneGroup.addClass("has-error");
        isValid = false;
      }

      // Validation failure -> exit
      if (! isValid) {
        return false;
      }

      // Disable submit button, mark as "Saving ..."
      makeBusy(submit);

      // Insert into meetingTypes object because that's what the API expects
      let meetingTypes = Preferences.defaultPreferences().meeting_types;
      meetingTypes.phone_call.phones.push({
        phone_type: phoneTypeVal,
        phone_number: phoneVal,
        share_with_guests: false
      });

      let calls = [
        Api.setTeamName(team.teamid, nameVal),
        Api.setMeetingTypes(team.teamid, meetingTypes)
      ];

      // AJAX calls for name and phone nubmer, then load step 1
      //
      // TODO: Create new API endpoint for setting name and phone number
      // rather than shoehorn two calls together
      //
      Deferred.join(calls)
        .then(function() {
          goToStep(2);
        });

      // Prevent page reload
      return false;
    });

    let content = refs["content"];
    content.append(form);
    name.focus();
  }

  /* Step 2 => Share calendars */
  function step2(refs: IJQMap): void {
    refs["progress"].width("60%");
'''
<div #view>
  <div class="page-header">
    <h2>Please share a calendar.</h2>
  </div>
  <div #description class="description calendar-setting-description">
    Please select which calendars to share with your Esper assistant.
    We need you to share at least one calendar to get started, but you can
    share or unshare additional calendars later.
  </div>
  <div class="panel panel-default">
    <div #calendarView class="esper-loading panel-body">Loading...</div>
  </div>
  <button #share class="button-primary">
    Share Calendars
  </button>
</div>
'''
    let team = getTeam();

    Api.getCalendarList(team.teamid)
      .done(function(response) {
        CalendarsTab.displayCalendarList(calendarView, response.calendars);

        share.click(function() {
          let allCals = response.calendars;
          CalendarsTab.saveCalendarShares(team, calendarView, share, allCals)

            // Then create ghost calendar for EA
            .then(function() {
              if (team.team_name) {
                /* During onboarding, create a "ghost calendar" for the EA to
                   keep negative time (no scheduling), notes, etc. */
                var primary = List.find(allCals,
                  function(cal: ApiT.Calendar) {
                    return cal.is_primary;
                  });
                var tz = primary.calendar_timezone;
                if (tz === undefined) { tz = "America/Los_Angeles"; }
                /* Because we're onboarding, this team has an Esper assistant.
                   It should be the first (and only) assistant.
                   This may change in the future, and then we'd have to check.
                */
                var esperAsst = team.team_assistants[0];
                return Api.createTeamCalendar(esperAsst, team.teamid, tz,
                  team.team_name + " Ghost");
              }
            })

            // Then redirect to next / final step
            .then(function() {
              goToStep(3);
            });
        });
      });

    let content = refs["content"];
    content.append(view);
  }

  function step3(refs: IJQMap): void {
    refs["progress"].width("80%");
'''
<div #view>
  <div class="page-header">
    <h2>Please enter in your payment info.</h2>
  </div>
  <div class="description">
    <p>
      We need a credit card to continue. Don't worry though. New users
      start with a 14-day free trial, during which we won't bill your credit
      card. After the free trial expires, we'll switch you to a pay-as-you-go
      plan and will only bill you based on your Esper usage.
    </p>
    <p><b>You can change or cancel your plan at any time.</b></p>
  </div>
  <div class="panel panel-default">
    <div #formContainer class="panel-body" />
  </div>
  <button #primaryBtn class="button-primary modal-primary"/>
</div>
'''
    var paymentRefs = AccountTab.getPaymentForm(
      Login.getTeam(), Plan.basic, function(err) {
        if (err) {
          unmakeBusy(primaryBtn);
        } else {
          goToStep(4);
        }
      });
    formContainer.append(paymentRefs.form);

    unmakeBusy(primaryBtn);
    primaryBtn.click(function() {
      makeBusy(primaryBtn);
      paymentRefs.form.submit();
    });

    let content = refs["content"];
    content.append(view);
  }

  /* Step 4 => complete */
  function step4(refs: IJQMap): void {
    refs["progress"].width("100%");
'''
<div #view>
  <div class="page-header">
    <h2>Congratulations!</h2>
  </div>
  <div class="description">
    <p>You've signed up for your very own Esper Assistant.
      You can get started right away by contacting your assistant at
      <b><a target="_blank" #mailToLink></a></b>.
    </p>
    <p>Click below to send the following email and set up a call:</p>
    <p style="margin-top:40px; cursor:pointer;">
      <a class="well" style="display:block" target="_blank" #mailMsgLink></a>
    </p>
  </div>
  <div align=right style="padding-top:20px; padding-bottom:40px;">
    <a target="_blank" href="http://esper.com/faqs">
      <button class="button-primary">
        Learn more about Esper &nbsp;&nbsp;<i class="fa fa-arrow-right"></i>
      </button>
    </a>
  </div>
</div>
'''
    let team = getTeam();
    var asstEmail = team.team_email_aliases[0];
    var asstName = asstEmail.split("@")[0];
    asstName = asstName.charAt(0).toUpperCase() + asstName.slice(1);
    var teamName = team.team_name;

    var emailText = `Hi ${asstName},\n\n` +
      `Great to meet you! I'm excited to have you as an assistant. ` +
      `I'd love to speak with you and learn more about what you can do for ` +
      `me. Can you help find a good time for a phone call that works for ` +
      `both of us?\n\n` +
      `Cheers,\n` +
      teamName;
    var emailSubj = "Nice to meet you";

    mailToLink.text(asstEmail);
    mailToLink.attr("href", "mailto:" + asstEmail);
    mailMsgLink.html(emailText.replace(/\n/g, "<br />"));

    // Gmail
    mailMsgLink.attr("href",
      "https://mail.google.com/mail/u/0/?view=cm&fs=1&to=" + asstEmail +
      "&su=" + encodeURIComponent(emailSubj) +
      "&body=" + encodeURIComponent(emailText));

    // Non-Gmail (add Boolean check when Nylas integration done)
    // mailMsgLink.attr("href", "mailto:" + asstEmail +
    //   "?subject=" + encodeURIComponent(emailSubj) +
    //   "&body=" + encodeURIComponent(emailText));

    let content = refs["content"];
    content.append(view);
  }
}