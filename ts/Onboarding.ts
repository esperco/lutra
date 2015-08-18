/*
  Onboarding page(s)
*/

/// <reference path="TeamSettings.ts"/>

module Onboarding {
  // Interface for references from string names to jQuery wrapper
  interface IJQMap {
    [index: string]: JQuery;
  }

  let googleSteps = [ step0,
                      stepInfoGoogle,
                      stepCalendar,
                      stepCC,
                      stepSendMail ];
  let exchangeSteps = [  step0,
                         stepInfoExchange,
                         // Skip calendar
                         stepCC,
                         stepSendMail ];

  // Object to store onboarding state for other functions
  interface ICurrentState {
    step: number;
    flow: { (refs: IJQMap): void; } [];
  };
  let currentState: ICurrentState = {
    step: 0,
    flow: googleSteps
  };

  // Checks if current user needs onboarding. If onboarding is required,
  // returns false and changes hash to trigger redirect. Else returns true.
  export function checkStatus(): boolean {
    // To prevent redirect loop
    if (location.hash.slice(0, 6) === "#!join") {
      return true;
    }

    var teams = Login.getTeams();
    if (teams.length === 1 && teams[0] !== null) {
      var team = teams[0];

      if (!Util.isString(team.team_name) ||
          !team.team_name.trim() ||
          Login.data.email === team.team_name) {
        if (Login.isNylas()) {
          Route.nav.path("join/exchange/1");
        } else {
          Route.nav.path("join/1");
        }
        return false;
      }

      else if (Login.data.missing_shared_calendar) {
        Route.nav.path("join/2"); // calendar step
        return false;
      }

      else if (Login.isNylas() && Login.data.waiting_for_sync) {
        Route.nav.path("join/exchange/" + (exchangeSteps.length - 1));
        return false;
      }
    }
    return true;
  }

  // Routes to next onboarding step
  export function goToNext() {
    let basePath = "join/";
    if (currentState.flow === exchangeSteps) {
      basePath += "exchange/";
    }
    let step = currentState.step || 0;
    step += 1;
    if (step > currentState.flow.length - 1) {
      step = 0;
    }
    Route.nav.path(basePath + step);
  }

  // Returns the root container object into which we insert onboarding stuff
  function rootElm(): JQuery {
    return $("#onboarding-interface");
  }

  // Loads the main wrapper UX for onboarding, returns a JQuery wrapper for
  // where step-specific content should go
  interface IOnboardingMap extends IJQMap {
    view: JQuery;
    progress: JQuery;
    content: JQuery;
  };

  function loadContainer(): IOnboardingMap {
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

  export function load(step = 0,
                       opts?: {fromLogin?: boolean,
                               inviteCode?: string,
                               exchange?: boolean}) {
    var refs = loadContainer();
    currentState.step = step;
    currentState.flow = (opts && opts.exchange) ? exchangeSteps : googleSteps;

    var progress = Math.round(100 * ((step + 1) / currentState.flow.length));
    refs.progress.width(progress + "%");

    if (opts && opts.fromLogin) {
      step0FromLogin(refs);
    } else if (opts && opts.inviteCode) {
      step0FromInvite(refs, opts.inviteCode);
    } else {
      currentState.flow[step](refs);
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
    // Log out if applicable
    if (Login.data) {
      Login.clearLoginInfo();
    }
'''
<div #view style="text-align: center">
  <div #msg>
    <span class="block-lg">
      <strong>Awesome.</strong> Our assistants need access to your calendar to
      assist you with scheduling.
    </span>
    <div class="block-lg">
      Please sign in with the account tied to your
      primary calendar to continue.
    </div>
  </div>
  <div #buttonContainer style="padding:40px 0">
  </div>
  <div>
    <a href="http://esper.com/mailing-list">
      Don't use Google or Microsoft Exchange?
      <span class="text-nowrap">Click here.</span>
    </a>
    <br /><br />
    By signing in, you agree to Esper's
    <a class="text-nowrap"
       href="http://esper.com/terms-of-use">Terms of Use.</a>
  </div>
</div>
'''
    if (customMsg) {
      msg.html(customMsg);
    }

    var googleButton = Signin.googleButton(
      /* landingUrl */ "#!join/1",
      /* optInvite  */ inviteCode,
      /* optEmail   */ undefined,
      /* optSignup  */ true);
    googleButton.click(function() {
      Analytics.track(Analytics.Trackable.ClickSignIn, {
        signinType: "Google",
        optInvite: inviteCode,
        optSignup: true
      });
    });
    buttonContainer.append(googleButton);

    var exchangeButton = Signin.exchangeButton(
      /* landingUrl */ "#!join/exchange/1",
      /* optInvite  */ inviteCode,
      /* optEmail   */ undefined,
      /* optSignup  */ true);
    exchangeButton.click(function() {
      Analytics.track(Analytics.Trackable.ClickSignIn, {
        signinType: "Exchange",
        optInvite: inviteCode,
        optSignup: true
      });
    });
    buttonContainer.append(exchangeButton);

    let content = refs["content"];
    content.append(view);
  }

  /* Step 0 => Sign in normally */
  function step0(refs: IOnboardingMap): void {
    _step0(refs);
  }

  function step0FromLogin(refs: IOnboardingMap): void {
    _step0(refs, `We don't have a registered account for you.<br />
      Please sign in again to create an account.`);
  }

  function step0FromInvite(refs: IOnboardingMap, inviteCode: string): void {
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

  /* Step 1 => Confirm executive name and other info */
  function _stepInfo(refs: IOnboardingMap, tzSelector?: boolean): void {
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
  <div #tzGroup class="form-group row">
    <label class="col-xs-12 control-label" for="step0-tz">
      Preferred Timezone</label>
    <div #tzSelectorDiv class="col-xs-12 js-tz"></div>
  </div>
  <div class="form-group row"><div class="col-xs-12">
    <button #submit type="submit" class="btn btn-primary">Save</button>
  </div></div>
</form>
'''
    // Add or hide timezone element
    var tzSelectorInput;
    if (tzSelector) {
      tzSelectorInput = PreferencesTab.timeZoneSelectorView();
      tzSelectorInput.attr("id", "step0-tz");
      tzSelectorInput.addClass("form-control");
      tzSelectorDiv.append(tzSelectorInput);
    } else {
      tzGroup.hide();
    }

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
      if (!nameVal || nameVal === Login.data.email) {
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

      // Get & validate timezone
      let tzVal = tzSelectorInput && tzSelectorInput.val();
      if (tzSelectorInput && !tzVal) {
        tzGroup.addClass("has-error");
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

      // Add timezone info for Nylas if applicable
      if (tzVal) {
        calls.push(Api.setupNylasCalendar(team.teamid, nameVal, tzVal));
      }

      // AJAX calls for name and phone number, then load step 1
      //
      // TODO: Create new API endpoint for setting name and phone number
      // rather than shoehorn two calls together
      //
      Deferred.join(calls, true).then(goToNext);

      // Prevent page reload
      return false;
    });

    refs.content.append(form);
    name.focus();
  }

  function stepInfoGoogle(refs: IOnboardingMap): void {
    _stepInfo(refs, false);
  }

  function stepInfoExchange(refs: IOnboardingMap): void {
    _stepInfo(refs, true);
  }

  /* Step 2 => Share calendars */
  function stepCalendar(refs: IOnboardingMap): void {
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
          Analytics.track(Analytics.Trackable.ClickShareCalendar);
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
              goToNext();
            });
        });
      });

    refs.content.append(view);
  }

  function stepCC(refs: IOnboardingMap): void {
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
          goToNext();
        }
      });
    formContainer.append(paymentRefs.form);

    unmakeBusy(primaryBtn);
    primaryBtn.click(function() {
      makeBusy(primaryBtn);
      Analytics.track(Analytics.Trackable.ClickCreditCard);
      paymentRefs.form.submit();
    });

    refs.content.append(view);
  }

  /* Step 4 => complete */
  function stepSendMail(refs: IOnboardingMap): void {
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
    <a #faqLink target="_blank" href="http://esper.com/faqs">
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

    mailMsgLink.click(function() {
      Analytics.track(Analytics.Trackable.ClickCongratsEmail);
    });

    faqLink.click(function() {
      Analytics.track(Analytics.Trackable.ClickLearnMoreAboutEsper);
    });

    refs.content.append(view);
  }
}