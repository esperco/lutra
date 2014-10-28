/*
  Team Settings - Account Tab
*/

module AccountTab {
  declare var Stripe : any;
  declare var Stripe : any;

  function generateInviteURL(team: ApiT.Team,
                             role: string,
                             toEmail: string) {
    var invite = {
      from_uid: Login.me(),
      teamid: team.teamid,
      role: role,
      force_email: toEmail
    };
    Log.p("Invite:", invite);
    return Api.inviteJoinTeam(invite);
  }

  function composeInviteWithURL(team, role, toEmail, link) {
    return generateInviteURL(team, role, toEmail)
      .then(function(urlResult) {
        var url = urlResult.url;
        var body =
          "Please click the link and sign in with your Google account:\n\n"
          + "  " + url;

        var gmailUrl = GmailCompose.makeUrl({
          to: toEmail,
          subject: "Join my team on Esper",
          body: body
        });

        link.attr("href", gmailUrl);
        link.prop("disabled", false);
      });
  }

  function renderInviteDialog(team, table) {
'''
<div #view class="invite-popover overlay-popover click-safe">
  <div class="overlay-popover-header click-safe">Add new team member</div>
  <div class="overlay-popover-body click-safe">
    <input #inviteEmail class="invite-input click-safe"
           autofocus placeholder="name@example.com"/>
    <div #review class="invite-review click-safe">
      Review and send invitation (optional)
    </div>
    <div class="clearfix click-safe">
      <button #addBtn class="button-primary label-btn click-safe" disabled>
        <span>Add</span>
        <span class="caret-south click-safe"/>
      </button>
      <ul #roleSelector class="role-selector overlay-list click-safe">
        <li class="unselectable click-safe">Select a role:</li>
        <li><a #assistant class="click-safe">Assistant</a></li>
        <li><a #executive class="click-safe">Executive</a></li>
      </ul>
      <a #continueBtn class="invite-continue button button-primary"
         target="_blank" disabled>Continue</a>
      <button #cancelBtn class="button-secondary label-btn">Cancel</button>
  </div>
</div>
'''
    Util.afterTyping(inviteEmail, 300, function() {
      if (Util.validateEmailAddress(inviteEmail.val()))
        addBtn.prop("disabled", false);
      else
        addBtn.prop("disabled", true);
    });

    function reset() {
      view.addClass("reset");
      Settings.togglePopover(_view);
    }

    addBtn.click(function() {
      var toEmail = inviteEmail.val();
      Settings.toggleList(roleSelector);

      function selectRole(role) {
        Settings.toggleList(roleSelector);
        review.show();
        inviteEmail.hide();
        cancelBtn.text("Skip");
        addBtn.hide();
        continueBtn.show();
        composeInviteWithURL(team, role, toEmail, continueBtn);
      }

      assistant.click(function() { selectRole("Assistant") });
      executive.click(function() { selectRole("Executive") });
    });

    continueBtn.click(reset);
    cancelBtn.click(reset);

    return _view;
  }

  function displayAssistants(team, table, profiles) {
    List.iter(profiles, function(profile) {
'''
<li #row class="table-row assistants-table clearfix">
  <div class="col-xs-6">
    <div #name/>
    <div #email class="gray"/>
  </div>
  <div class="col-xs-1 assistant-row-status">
    <div #statusContainer
         data-toggle="tooltip"
         data-placement="right"
         title="Reauthorization required."/>
  </div>
  <div #actions class="col-xs-5 assistant-row-actions"/>
</li>
'''
      function refresh() {
        /*
          Reload the whole document.
          It could be improved but the team structure known by the login module
          would need to be refreshed.
        */
        location.reload(true);
      }

      var execUid = team.team_executive;
      var memberUid = profile.profile_uid;

      name.text(profile.display_name);
      email.text(profile.email);

      if (!profile.google_access) {
        var warning = $("<img class='svg-block'/>")
          .appendTo(statusContainer);
        Svg.loadImg(warning, "/assets/img/warning.svg");
        (<any> statusContainer).tooltip(); // FIXME
      }

(function(){ // a block scope, a block scope, my kingdom for a block scope!
      if (memberUid !== Login.me()
          && List.mem(team.team_assistants, memberUid)) {
'''
<span #removeSpan>
  <a #removeLink href="#" class="danger-link">Remove</a>
</span>
'''
        removeLink.appendTo(actions)
        removeLink.click(function() {
          Api.removeAssistant(team.teamid, memberUid)
            .done(function() { refresh(); });
        });

        actions.append($("<span class='text-divider'>|</span>"));
      } else {
        name
          .text("")
          .append($("<span>" + profile.display_name + "</span>"))
          .append($("<span class='semibold'> (Me)</span>"));
      }
})();

(function(){
      if (memberUid !== execUid) {
'''
<span #makeExecSpan>
  <a #makeExecLink href="#" class="link">Make Executive</a>
</span>
'''
        makeExecSpan.appendTo(actions);
        makeExecLink.click(function() {
          Api.setExecutive(team.teamid, memberUid)
            .done(function() { refresh(); });
        });
      }
})();

      table.append(row);
    });
  }

  function showPaymentModal(purpose, teamid) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog preference-modal">
    <div class="modal-content">
      <div class="modal-header">
        <div #iconContainer class="img-container-left modal-icon"/>
        <div #title class="modal-title"/>
      </div>
      <div #content class="preference-form">
          <form #paymentForm method="POST" autocomplete="on">
            <div class="semibold">Card Number</div>
            <input #ccNum type="tel" size="22" data-stripe="number"
                   class="preference-input" required/>
            <div class="payment-col left">
              <div class="semibold">CVC</div>
              <input #cvcNum type="text" size="22" data-stripe="cvc"
                     placeholder="•••" required autocomplete="off"/>
            </div>
            <div class="payment-col right">
              <div class="semibold">Expiration</div>
              <div>
                <select #expMonth data-stripe="exp-month"
                        style="margin-right:6px" required/>
                <select #expYear data-stripe="exp-year" required/>
              </div>
            </div>
          </form>
      </div>
      <div class="modal-footer">
        <button #primaryBtn class="button-primary modal-primary"/>
        <button #cancelBtn class="button-secondary modal-cancel">Cancel</button>
      </div>
    </div>
  </div>
</div>
'''
    if (purpose == "Add") {
      title.text("Add Payment Method");
      primaryBtn.text("Add");
    } else {
      title.text("Change Payment Method");
      primaryBtn.text("Save");
      ccNum.attr("placeholder", "•••• •••• •••• ••••");
      cvcNum.attr("placeholder", "•••");
    }

    var icon = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(iconContainer);
    Svg.loadImg(icon, "/assets/img/creditcard.svg");

    // Restricts the inputs to numbers
    ccNum['payment']('formatCardNumber');
    cvcNum['payment']('formatCardCVC');

    for (var i = 1; i < 13; i++) {
      var month;
      if (i < 10) {
        month = "0" + i.toString();
      } else {
        month = i.toString();
      }
      expMonth.append($("<option value=" + i + ">" + month + "</option>"));
    }

    var currentYear = (new Date).getFullYear();
    var limitYear = currentYear + 20;
    for (var i = currentYear; i < limitYear; i++) {
      var year = i.toString();
      expYear.append($("<option value=" + i + ">" + year + "</option>"));
    }

    Stripe.setPublishableKey('pk_test_QS0EG9icW0OMWao2h4JPgVTY');

    var checkInput = function(ccInfo, valid, date){
      if(!valid){
        ccInfo.val("");
        ccInfo.addClass("cc-error");
        if(!date){
          ccInfo.attr("placeholder", "Invalid Number");
        }
      } else {
        ccInfo.removeClass('cc-error');
        ccInfo.attr("placeholder", "");
      }
    };

    var stripeResponseHandler = function(status, response) {
      if (response.error) {
        var cardType = $["payment"].cardType(ccNum.val());

        // Handles whether the cards are valid, independent of Stripe
        var validCard = $["payment"].validateCardNumber(ccNum.val());
        var validCVC = $["payment"].validateCardCVC(cvcNum.val(), cardType);
        var validExpiry = $["payment"].validateCardExpiry(expMonth, expYear);

        checkInput(ccNum, validCard, false);
        checkInput(cvcNum, validCVC, false);
        checkInput(expMonth, validExpiry, true);
        checkInput(expYear, validExpiry, true);

        primaryBtn.prop('disabled', false);
      } else {
        paymentForm
          .append($('<input type="hidden" name="stripeToken"/>')
            .val(response.id));

        alert("Your card was successfully charged. Thanks for joining Esper!");

        (<any> paymentForm.get(0)).reset();
      }
    };

    paymentForm.submit(function() { return false; });

    primaryBtn.click(function() {
      primaryBtn.prop('disabled', true);
      Stripe.card.createToken(paymentForm, stripeResponseHandler);
      return false;
    });

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    (<any> modal).modal({}); // FIXME
  }

  function showNameModal(teamid) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog preference-modal">
    <div class="modal-content">
      <div class="modal-header">
        <div #iconContainer class="img-container-left modal-icon"/>
        <div #title class="modal-title">Change Display Name</div>
      </div>
      <div #content class="preference-form">
      </div>
      <div class="modal-footer">
        <button #saveBtn class="button-primary modal-primary">Save</button>
        <button #cancelBtn class="button-secondary modal-cancel">Cancel</button>
      </div>
    </div>
  </div>
</div>
'''
    saveBtn.click(function() {
    });

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    (<any> modal).modal({}); // FIXME
  }

  function displayMembership(teamid) {
'''
<div #view class="membership">
  <div>Member since November 2014</div>
  <div><a #changeName class="link">Change display name</a></div>
  <div><a #payment class="link">Change payment method</a></div>
  <div><a #suspendAcct class="link">Suspend my account</a></div>
  <div><a #deleteAcct class="danger-link">Delete my account</a></div>
</div>
'''
    changeName.click(function() { showNameModal(teamid) });

    payment.click(function() { showPaymentModal("Change", teamid) });

    return view;
  }

  export function load(team) {

'''
<div #view>
  <div class="table-header">Membership & Billing</div>
  <div #membership class="table-list"/>
  <div class="table-header">Assistants</div>
  <ul #assistantsList class="table-list">
    <div #spinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">There are no assistants on this team.</div>
  </ul>
  <div class="clearfix">
    <div #emailContainer class="img-container-left"/>
    <a #invite disabled
       class="link popover-trigger click-safe"
       style="float:left">Add new team member</a>
  </div>
</div>
'''
    var emailIcon = $("<img class='svg-block invite-icon'/>")
      .appendTo(emailContainer);
    Svg.loadImg(emailIcon, "/assets/img/email.svg");

    membership.append(displayMembership(team.teamid));

    spinner.show();

    Deferred.join(List.map(team.team_assistants, function(uid) {
      return Api.getProfile(uid, team.teamid);
    }))
      .done(function(profiles) {
        spinner.hide();
        if (profiles.length > 0)
          displayAssistants(team, assistantsList, profiles);
        else
          tableEmpty.show();
      });

    var popover = renderInviteDialog(team, _view);
    view.append(popover.view);
    invite.click(function() { Settings.togglePopover(popover); });

    return view;
  }

}
