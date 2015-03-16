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

  function sendInvite(team: ApiT.Team,
                      role: string,
                      toEmail: string):
  JQueryPromise<void> {
    var invite = {
      from_uid: Login.me(),
      teamid: team.teamid,
      role: role,
      force_email: toEmail
    };
    Log.d("Invite:", invite);
    return Api.inviteJoinTeam(invite);
  }

  export interface InviteDialog {
    view: JQuery;
    inviteEmail: JQuery;
    invited: JQuery;
    addBtn: JQuery;
    roleSelector: JQuery;
    assistant: JQuery;
    executive: JQuery;
    doneBtn: JQuery;
    cancelBtn: JQuery;
  }

  function renderInviteDialog(team, table): InviteDialog {
'''
<div #view class="invite-popover overlay-popover click-safe">
  <div class="overlay-popover-header click-safe">Add new team member</div>
  <div class="overlay-popover-body click-safe">
    <input #inviteEmail type="email" class="invite-input click-safe"
           autofocus placeholder="name@example.com"/>
    <div #invited class="invite-review click-safe"></div>
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
      <a #doneBtn class="invite-continue button button-primary"
         target="_blank">Done</a>
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

    function selectRole(role: string, toEmail: string) {
      Settings.toggleList(roleSelector);
      inviteEmail.hide();
      addBtn.hide();
      cancelBtn.hide();
      sendInvite(team, role, toEmail)
        .done(function() {
          var text = Login.isAdmin() ? "Added!" : "Invite sent!";
          invited.text(text);
          invited.show();
          doneBtn.show();
        });
    }

    addBtn.click(function() {
      var toEmail = inviteEmail.val();
      Settings.toggleList(roleSelector);

      assistant.click(function() { selectRole("Assistant", toEmail); });
      executive.click(function() { selectRole("Executive", toEmail); });
    });

    doneBtn.click(reset);
    cancelBtn.click(reset);

    return _view;
  }

  function showSignatureModal(teamid, memberUid, currentSig) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog preference-modal">
    <div class="modal-content">
      <div class="modal-header">
        <div #iconContainer class="img-container-left modal-icon"/>
        <div #title class="modal-title">Edit Email Signature</div>
      </div>
      <div #content class="preference-input">
        <textarea #signature class="fit-parent" rows=5 tabindex="-1"/>
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

    signature.val(currentSig);

    saveBtn.click(function() {
      Api.setSignature(teamid, memberUid, { signature: signature.val() })
        .done(function() {
          (<any> modal).modal("hide"); // FIXME
        });
    });

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    return _view;
  }

  function displayAssistants(team, table, profiles) {
    List.iter(profiles, function(profile) {
'''assistantView
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
      var myUid = Login.me();
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

      if ((memberUid !== Login.me() || Login.isAdmin())
          && List.mem(team.team_assistants, memberUid)) {
'''removeLinkView
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

      if (myUid === execUid || myUid === memberUid) {
'''sigLinkView
<span #signatureSpan>
  <a #signatureLink href="#" class="link">Edit Signature</a>
</span>
'''
        signatureSpan.appendTo(actions);
        signatureLink.click(function() {
          Api.getSignature(team.teamid, memberUid).done(function(x) {
            var view =
              showSignatureModal(team.teamid, memberUid, x.signature);
            (<any> view.modal).modal({});
          });
        });
        actions.append($("<span class='text-divider'>|</span>"));
      }

      if (memberUid !== execUid) {
'''makeExecView
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
        .text("You can reactivate your membership at any point in the future.");
      primaryBtn.text("Yes");
      cancelBtn.text("Cancel");
    }

    primaryBtn.click(function() {
      if (action == "suspend") {
        var teamid = team.teamid;
        Api.cancelSubscription(teamid);

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

  function showPaymentModal(purpose, team, membership) {
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
          <form action="">
            <div class="payment-col left">
              <div class="semibold">Make Default Card</div>
            </div>
            <div class="payment-col right">
              <input #defaultBox type="checkbox" name="default" value="card">
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

    var checkInput = function(ccInfo, valid, date) {
      if (!valid) {
        ccInfo.val("");
        ccInfo.addClass("cc-error");
        if (!date) {
          ccInfo.attr("placeholder", "Invalid Number");
        }
      } else {
        ccInfo.removeClass('cc-error');
        ccInfo.attr("placeholder", "");
      }
    };
    var teamid = team.teamid;

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
        Api.addNewCard(teamid, stripeToken).done(function(card) {
          if (membership !== null) {
            Api.setSubscription(teamid, membership);
            $(".next-step-button").prop("disabled", false);
            (<any> paymentForm.get(0)).reset();
            (<any> modal).modal("hide"); // FIXME
            if (defaultBox.prop("checked")) {
              Api.setDefaultCard(teamid, card.id).done(refresh);
            } else {
              refresh();
            }
          }
        });
      }
    };

    paymentForm.submit(function() { return false; });

    primaryBtn.click(function() {
      primaryBtn.prop('disabled', true);
      Stripe.card.createToken(paymentForm, stripeResponseHandler);
      (<any> modal).modal("hide"); // FIXME
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

    switch(membership) {
    case "Basic":
      price.text("Free");
      break;
    case "Standard":
      price.text("$199/mo");
      break;
    case "Enhanced":
      price.text("$399/mo");
      break;
    case "Pro":
      price.text("$599/mo");
      break;
    case "Employee":
      price.text("Free");
      break;
    }

    return view;
  }

  function showMembershipModal(team) {
    Log.d("showMembershipModal");
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
          <div #planFree class="membership-option"/>
          <div #planLo class="membership-option"/>
          <div #planMid class="membership-option"/>
          <div #planHi class="membership-option"/>
          <div #planX class="membership-option hide"/>
        </div>
        <label class="checkbox membership-modal-check">
          <input #noEsper type="checkbox"></input>
          no Esper branding in external email communications
          <span #noEsperPrice></span>
        </label>
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

    var teamid = team.teamid;

    /*
      Employee plan is only shown to admins and to users already under
      that plan.
     */
    if (Login.isAdmin())
      planX.removeClass("hide");

    Api.getSubscriptionStatus(teamid)
      .done(initModal);

    function initModal(customerStatus) {
      var membershipPlan = customerStatus.plan;
      var membershipStatus = customerStatus.status;
      var isFreeMembership = true;
      if (membershipStatus === "Trialing" && membershipPlan === undefined) {
        var end = customerStatus.trial_end;
        var timeLeft = moment.duration(moment().diff(end)).humanize();
'''trialMsgView
<span #trialMsg>
  You have <span class="bold">{{timeLeft}}</span>
  remaining in your free trial.
  <br>
  Select a membership option below to continue using
  Esper beyond your trial period.
</span>
'''
        daysRemaining
          .append(trialMsg)
          .show();
      } else if (membershipStatus == "Past-due" ||
                 membershipStatus == "Unpaid" ||
                 membershipStatus == "Canceled" ||
                 membershipStatus == undefined) {
        suspension
          .text("Select a membership option below to reactivate your account.")
          .show();
      } else { // already picked a plan
        var planName = Plan.nameOfPlan(membershipPlan);
        var selectedPlanId = membershipPlan;

        switch(Plan.nameOfPlan(selectedPlanId)) {
        case "Basic":
          selectFree();
          break;
        case "Basic Plus":
          noEsper.prop("checked", true);
          selectFree();
          break;
        case "Standard":
          selectLo();
          break;
        case "Standard Plus":
          noEsper.prop("checked", true);
          selectLo();
          break;
        case "Enhanced":
          selectMid();
          break;
        case "Enhanced Plus":
          noEsper.prop("checked", true);
          selectMid();
          break;
        case "Pro":
          selectHi();
          break;
        case "Employee":
          selectX();
          break;
        default:
          Log.e("Unknown plan type: ", membershipPlan);
        }
      }

      function readCheckBox() {
        var checked = noEsper.prop("checked");
        switch(Plan.nameOfPlan(selectedPlanId)) {
        case "Basic":
          if (checked)
            selectedPlanId = Plan.basicPlus;
          break;
        case "Basic Plus":
          if (!checked)
            selectedPlanId = Plan.basic;
          break;
        case "Standard":
          if (checked)
            selectedPlanId = Plan.standardPlus;
          break;
        case "Standard Plus":
          if (!checked)
            selectedPlanId = Plan.standard;
          break;
        case "Enhanced":
          if (checked)
            selectedPlanId = Plan.enhancedPlus;
          break;
        case "Enhanced Plus":
          if (!checked)
            selectedPlanId = Plan.enhanced;
          break;
        case "Pro":
        case "Employee":
          break;
        default:
          Log.e("Unknown plan ID: ", selectedPlanId);
        }
      }

      planFree.append(viewOfMembershipOption("Basic"));
      planLo.append(viewOfMembershipOption("Standard"));
      planMid.append(viewOfMembershipOption("Enhanced"));
      planHi.append(viewOfMembershipOption("Pro"));
      planX.append(viewOfMembershipOption("Employee"));

      function selectMembership(option) {
        primaryBtn.prop("disabled", false);
        planFree.removeClass("selected");
        planLo.removeClass("selected");
        planMid.removeClass("selected");
        planHi.removeClass("selected");
        planX.removeClass("selected");
        option.addClass("selected");
        noEsper.removeClass("hide");
      }

      function selectFree() {
        selectMembership(planFree);
        noEsperPrice.text("for $99/mo");
        if (noEsper.prop("checked")) {
          selectedPlanId = Plan.basicPlus;
          isFreeMembership = false;
        } else {
          selectedPlanId = Plan.basic;
          isFreeMembership = true;
        }
      }
      function selectLo() {
        selectMembership(planLo);
        noEsperPrice.text("for $99/mo");
        isFreeMembership = false;
        selectedPlanId = noEsper.prop("checked") ?
          Plan.standardPlus : Plan.standard;
      }
      function selectMid() {
        selectMembership(planMid);
        noEsperPrice.text("for $49/mo");
        isFreeMembership = false;
        selectedPlanId = noEsper.prop("checked") ?
          Plan.enhancedPlus : Plan.enhanced;
      }
      function selectHi() {
        selectMembership(planHi);
        noEsperPrice.text("- included");
        isFreeMembership = false;
        noEsper.addClass("hide");
        selectedPlanId = Plan.pro;
      }
      function selectX() {
        planX.removeClass("hide");
        selectMembership(planX);
        noEsperPrice.text("- not available for this plan");
        isFreeMembership = true;
        noEsper.addClass("hide");
        selectedPlanId = Plan.employee;
      }

      planFree.click(selectFree);
      planLo.click(selectLo);
      planMid.click(selectMid);
      planHi.click(selectHi);
      planX.click(selectX);

      primaryBtn.click(function() {
        $(".next-step-button").prop("disabled", false);
        (<any> modal).modal("hide"); // FIXME
        readCheckBox();
        Log.d("Selected plan ID: " + selectedPlanId);
        Api.setSubscription(teamid, selectedPlanId)
          .done(function() {
            if (!isFreeMembership) {
              Api.getSubscriptionStatusLong(team.teamid)
                .done(function(status){
                  if (status.cards.length === 0)
                    showPaymentModal("Add", team, selectedPlanId);
                });
            }
          });
      });

      cancelBtn.click(function() {
        (<any> modal).modal("hide"); // FIXME
      });
      if (membershipStatus == "Past-due" ||
          membershipStatus == "Unpaid" ||
          membershipStatus == "Canceled") {
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

  function showCardModal(team) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog card-modal">
    <div class="modal-content">
      <div class="modal-header">
        <div #iconContainer class="img-container-left modal-icon"/>
        <div #title class="modal-title">Account Info</div>
      </div>
      <div class="info-col left">
        <div>Membership:</div>
        <div>Status:</div>
        <div>Cards:</div>
      </div>
      <div class="info-col right">
        <div #memPlan class="plan"/>
        <div #memStatus class="status"/>
      </div>
      <div class="modal-footer">
        <button #cancelBtn class="button-secondary modal-cancel">Close</button>
      </div>
    </div>
  </div>
</div>
'''
    var execid = team.team_executive;
    var teamid = team.teamid;

    Api.getSubscriptionStatus(teamid)
      .done(function(customerStatus) {
        memPlan.append(customerStatus.plan);
        memStatus.append(customerStatus.status);
    });

    Api.getSubscriptionStatusLong(teamid).done(function(status) {
      if (status.cards.length < 1) {
        memStatus.append( "<br> No Cards");
      }
      else {
        for (var i = 0; i < status.cards.length; i++) {
          memStatus.append("<br> •••• •••• •••• ");
          memStatus.append(<any>status.cards[i].last4);
'''rmCardView
<span #removeCardSpan>
  <span class="text-divider"></span><a #removeCardLink>Remove</a>
</span>
'''
          memStatus.append(removeCardSpan);

          if (status.cards.length > 1) {
            var cardid = status.cards[i].id;
            removeCardLink.addClass("danger-link");
            removeCardLink.click(function() {
              Log.d(execid, teamid, cardid);
              Api.deleteCard(teamid, cardid).done(refresh);
            });
          }
        }
      }
    });

    var icon = $("<img class='svg-block preference-option-icon'/>")
      .appendTo(iconContainer);
    Svg.loadImg(icon, "/assets/img/membership.svg");

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
  <div class="membership-col center">
    <div><a #changeName class="link">Change display name</a></div>
    <div class="clearfix">
      <a #changeMembership class="link" style="float:left">Change membership</a>
      <span #membershipBadge class="membership-badge"/>
    </div>
    <div><a #changePayment class="link">Add payment method</a></div>
  </div>
  <div class="membership-col right">
    <div><a #cardInfo class="link">View card information</a></div>
  </div>
</div>
'''
    var teamid = team.teamid;

    if (Login.isExecCustomer(team)) {
      changeName.parent().remove();
    }

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

    var cardModal = showCardModal(team);
    cardInfo.click(function() {
      (<any> cardModal.modal).modal();
    });

    var execUid = team.team_executive;

    Api.getSubscriptionStatus(teamid)
      .done(function(x) { Log.d("getSubscriptionStatus.done");
                          updateStatus(x); });

    function updateStatus(customer) {
      Log.d("updateStatus");
      var mem = customer.status;
      var plan = customer.plan;

      if (mem == "Trialing" || mem == "Active") {
        membershipBadge.addClass("active");
      } else if (mem == "Unpaid" || mem == "Past_due" || mem == "Canceled") {
        membershipBadge.addClass("suspended");
      } else if (mem === undefined) {
        membershipBadge.text("None");
        membershipBadge.addClass("suspended");
      }

      if (mem === "Active" && plan !== undefined) {
        membershipBadge.text(Plan.classOfPlan(plan).toUpperCase());
      } else if (mem !== undefined)
        membershipBadge.text(mem.toUpperCase());

      changeMembership.click(function() { showMembershipModal(team); });

      changePayment.click(function() {
        showPaymentModal("Change", team, null)
      });
    }

    return view;
  }

  export function load(team : ApiT.Team) {
'''
<div #view>
  <div #notes/>
  <div class="table-header">Membership & Billing</div>
  <div #membership class="table-list"/>
  <div #assistantsHeader class="table-header">Assistants</div>
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

    if (Login.isExecCustomer(team)) {
      // Executives are getting confused by this and messing teams up
      assistantsHeader.hide();
      assistantsList.hide();
      emailContainer.hide();
      invite.hide();
    } else {
      invite.click(function() { Settings.togglePopover(popover); });
    }

    return view;
  }

}
