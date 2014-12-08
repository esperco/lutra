/*
  Team Settings - Account Tab
*/

module AccountTab {
  declare var Stripe : any;
  declare var moment : any;

  function refresh() {
    /*
      Reload the whole document.
      It could be improved but the team structure known by the login module
      would need to be refreshed.
    */
    location.reload(true);
  }

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
    <input #inviteEmail type="email" class="invite-input click-safe"
           autofocus placeholder="name@example.com"/>
    <div #review class="invite-review click-safe">
      Review and send invitation (optional)
    </div>
    <div class="clearfix click-safe">
      <button #addBtn class="button-primary label-btn click-safe" disabled>
        <span class="click-safe">Add</span>
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
      if ((memberUid !== Login.me() || Login.isAdmin())
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

        if (memberUid === Login.me())
          name.append($("<span class='semibold'> (Me)</span>"));

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

  function showConfirmationModal(action, originalModal, team) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog confirmation-modal">
    <div class="modal-content">
      <div #title class="confirmation-title"/>
      <div #content class="confirmation-content"/>
      <div class="modal-footer">
        <div class="centered-buttons clearfix">
          <button #primaryBtn class="button-primary modal-primary"/>
          <button #cancelBtn class="button-secondary modal-cancel"/>
        </div>
      </div>
    </div>
  </div>
</div>
'''
    if (action == "suspend") {
      title.text("Suspend membership?");
      content
        .text("You can reactive your membership at any point in the future.");
      primaryBtn.text("Yes");
      cancelBtn.text("Cancel");
    }

    primaryBtn.click(function() {
      if (action == "suspend") {
        var teamid = team.teamid;
        var execUid = team.team_executive;
        Api.cancelSubscription(execUid, teamid);

        (<any> modal).modal("hide"); // FIXME
        if (originalModal !== undefined)
          (<any> originalModal).modal("hide"); // FIXME
      }
    });

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    (<any> modal).modal({}); // FIXME
  }

  function showPaymentModal(purpose, team, membership) { //TODO: make Post request handle name to identify customer
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
            <input #ccNum type="tel" size="20" data-stripe="number"
                   class="preference-input" placeholder="•••• •••• •••• ••••"
                   required/>
            <div class="payment-col left">
              <div class="semibold">CVC</div>
              <input #cvcNum type="text" size="22" data-stripe="cvc"
                     placeholder="•••" required autocomplete="off"/>
            </div>
            <div class="payment-col right">
              <div class="semibold">Expiration</div>
              <div>
                <select #expMonth data-stripe="exp-month" class="esper-select"
                        style="margin-right:6px" required/>
                <select #expYear data-stripe="exp-year" class="esper-select"
                        required/>
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

    Stripe.setPublishableKey('pk_test_tDzGbpaybyFQ3A7XGF6ctE3f'); //TODO: Change this to live key

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
    var teamid = team.teamid;
    var execUid = team.team_executive;

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
        var stripeToken = response.id;
        Api.addNewCard(execUid, teamid, stripeToken).done(function() {
          alert("Your card was successfully charged. Thanks for joining Esper!");
          if (membership == "Entrepreneur") {
            Api.setSubscription(execUid, teamid, "Entrepreneur");
          }
          else if (membership == "Executive") {
            Api.setSubscription(execUid, teamid, "Executive");
          }
          else if (membership == "VIP") {
            Api.setSubscription(execUid, teamid, "VIP");
          }
          (<any> paymentForm.get(0)).reset();
          (<any> modal).modal("hide"); // FIXME
        });
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

  function viewOfMembershipOption(membership) {
'''
<div #view>
  <div #name class="membership-name"/>
  <div #price class="membership-price"/>
  <div #checkContainer/>
</div>
'''
    var check = $("<img class='svg-block membership-option-check'/>")
      .appendTo(checkContainer);
    Svg.loadImg(check, "/assets/img/check.svg");

    name.text(membership);

    if (membership == "Entrepreneur") {
      price.text("$299/mo");
    } else if (membership == "Executive") {
      price.text("$599/mo");
    } else if (membership == "VIP") {
      price.text("$1,199/mo");
    }

    return view;
  }

  function showMembershipModal(team) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog membership-modal">
    <div class="modal-content">
      <div class="modal-header">
        <div #iconContainer class="img-container-left modal-icon"/>
        <div #title class="modal-title">Change Membership</div>
      </div>
      <div #content>
        <div #daysRemaining class="membership-modal-note"/>
        <div #suspension class="membership-modal-note"/>
        <div class="membership-options clearfix">
          <div #entrepreneur class="membership-option"/>
          <div #executive class="membership-option"/>
          <div #VIP class="membership-option"/>
        </div>
      </div>
      <div class="modal-footer">
        <button #primaryBtn class="button-primary modal-primary" disabled>
          Update
        </button>
        <button #cancelBtn class="button-secondary modal-cancel">
          Cancel
        </button>
        <button #suspendBtn class="button-secondary modal-delete">
          Suspend Membership
        </button>
      </div>
    </div>
  </div>
</div>
'''
    var icon = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(iconContainer);
    Svg.loadImg(icon, "/assets/img/membership.svg");

    // Gets membership status - default is trialing
    var teamid = team.teamid;
    var execUid = team.team_executive;

    Api.getSubscriptionStatus(execUid, teamid)
      .done(updateModal);

    function updateModal(customerStatus) {
      var membershipPlan = customerStatus.plan;
      var membershipStatus = customerStatus.status;
      if (membershipStatus == "Trialing") {
        var end = customerStatus.trial_end;
        var timeLeft = moment.duration(moment().diff(end)).humanize();
        daysRemaining
          .append($("<span>You have </span>"))
          .append($("<span class='bold'>" + timeLeft + "</span>"))
          .append($("<span> remaining in your free trial.</span><br>"))
          .append($("<span>Select a membership option below to continue using " +
            "Esper beyond your trial period.</span>"))
          .show();
      } else if (membershipStatus == "Past-due" ||
                 membershipStatus == "Unpaid" ||
                 membershipStatus == "Canceled") {
        suspension
          .text("Select a membership option below to reactivate your account.")
          .show();
      } else { // must be active
        if (membershipPlan == "Entrepreneur") {
          entrepreneur.addClass("selected");
        } else if (membershipPlan == "Executive") {
          executive.addClass("selected");
        } else if (membershipPlan == "VIP") {
          VIP.addClass("selected");
      }
      }

      entrepreneur.append(viewOfMembershipOption("Entrepreneur"));
      executive.append(viewOfMembershipOption("Executive"));
      VIP.append(viewOfMembershipOption("VIP"));

      var paymentMethod = false; // TODO: get payment method
      var selectedMembership = ""; //empty unless a choice is made
      function selectMembership(option) {
        primaryBtn.prop("disabled", false);
        entrepreneur.removeClass("selected");
        executive.removeClass("selected");
        VIP.removeClass("selected");
        option.addClass("selected");
      }

      entrepreneur.click(function() { selectMembership(entrepreneur);
        selectedMembership = "Entrepreneur";
        });
      executive.click(function() { selectMembership(executive);
        selectedMembership = "Executive";
        });
      VIP.click(function() { selectMembership(VIP);
        selectedMembership = "VIP";
        });

      primaryBtn.click(function() {
        if (paymentMethod == false) {
          (<any> modal).modal("hide"); // FIXME
          showPaymentModal("Add", team, selectedMembership);
        } else {
          (<any> modal).modal("hide"); // FIXME
        }
      });

      cancelBtn.click(function() {
        (<any> modal).modal("hide"); // FIXME
      });
      if ((membershipStatus == "Past-due" || membershipStatus == "Unpaid" || membershipStatus == "Caneled")) {
        suspendBtn.hide();
      } else {
        suspendBtn.click(function() {
          showConfirmationModal("suspend", modal, team);
        });
      }

      (<any> modal).modal({}); // FIXME
    }
  }
  function showNameModal(team) {
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
      <div #content class="preference-input">
        <input #displayName id="display-name" type="text" tabindex="-1"
               placeholder="Display Name" onclick="this.select();"/>
      </div>
      <div class="modal-footer">
        <button #saveBtn class="button-primary modal-primary">Save</button>
        <button #cancelBtn class="button-secondary modal-cancel">Cancel</button>
      </div>
    </div>
  </div>
</div>
'''
    var icon = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(iconContainer);
    Svg.loadImg(icon, "/assets/img/displayname.svg");

    if (team.team_name !== undefined)
      displayName.val(team.team_name);

    saveBtn.click(function() {
      Api.setTeamName(team.teamid, displayName.val());
      refresh();
    });

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    return _view;
  }

  function displayMembership(team) {
'''
<div #view class="membership">
  <div class="membership-col left">
    <div #profPic class="profile-pic"/>
    <div #name class="profile-name"/>
    <div #email class="profile-email gray"/>
  </div>
  <div class="membership-col right">
    <div><a #changeName class="link">Change display name</a></div>
    <div class="clearfix">
      <a #changeMembership class="link" style="float:left">Change membership</a>
      <span #membershipBadge class="membership-badge"/>
    </div>
    <div><a #changePayment class="link">Change payment method</a></div>
  </div>
</div>
'''
    var teamid = team.teamid;

    Api.getProfile(team.team_executive, teamid)
      .done(function(profile) {
        if (profile.image_url !== undefined)
          profPic.css("background-image", "url('" + profile.image_url + "')");
        name.text(team.team_name);
        email.text(profile.email);
      });;

    var nameModal = showNameModal(team);
    changeName.click(function() {
      (<any> nameModal.modal).modal();
      nameModal.displayName.click();
    });

    //retrieves the membership status
    var membership="";
    var execUid = team.team_executive;

    //gets subscription status
    Api.getSubscriptionStatus(execUid, teamid)
      .done(function(customerStatus){
        membership = customerStatus.status;
        updateStatus(membership);
    });

    //updates the status
    function updateStatus(mem){
      if (mem == "Trialing") {
        membershipBadge.addClass("free-trial");
        changePayment.addClass("disabled");
      } else if (mem == "Unpaid") {
        membershipBadge.addClass("suspended");
      } else if (mem == "Past_due"){
        membershipBadge.addClass("suspended");
      } else if (mem == "Canceled"){
         membershipBadge.addClass("suspended");
      }
      else {
        membershipBadge.addClass("Active");
      }
      membershipBadge.text(membership.toUpperCase());
      changeMembership.click(function() { showMembershipModal(team) });

      changePayment.click(function() {
        showPaymentModal("Change", team, null)
      });
    }

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

    membership.append(displayMembership(team));

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
