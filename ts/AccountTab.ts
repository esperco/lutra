/*
  Team Settings - Account Tab
*/

module Esper.AccountTab {
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

  function displayAssistants(team, table,
                             profiles: ApiT.Profile[]) {
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
        Api.cancelSubscription(teamid).done(refresh);

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

  // Generates a payment form in jQuery that autoatically assigns
  // membership to team after completion. Takes a callback that returns
  // with an error argment on error, undefined otherwise.
  export function getPaymentForm(team, membership, callback) {
'''
<div #content class="preference-form">
  <form #paymentForm method="POST" autocomplete="on" class="row">
    <div #ccDeclineMsg class="alert alert-danger">
      <i class="fa fa-warning"></i>
      Your credit card was declined.
    </div>
    <div #ccInvalidMsg class="alert alert-danger">
      <i class="fa fa-warning"></i>
      Invalid card data
    </div>
    <div #ccErrorOther class="alert alert-danger">
      <i class="fa fa-warning"></i>
      Something went wrong. Please contact <a href="mailto:support@esper.com">
      support@esper.com</a> for assistance.
    </div>
    <div #ccNumGroup class="form-group col-xs-12">
      <label for="cc-num" class="control-label">Card Number</label>
      <input id="cc-num" #ccNum type="tel" size="20" data-stripe="number"
             class="preference-input form-control"
             placeholder="•••• •••• •••• ••••"
             required/>
    </div>
    <div #cvcNumGroup class="form-group col-xs-6">
      <label class="control-label" for="cvc-num">CVC</label>
      <input #cvcNum id="cvc-num" type="text" size="22" data-stripe="cvc"
             class="form-control"
             placeholder="•••" required autocomplete="off"/>
    </div>
    <div #expDateGroup class="form-group col-xs-6">
      <div class="row">
        <label class="control-label col-xs-12" for="exp-month">Expiration</label>
        <div class="col-xs-6">
          <select id="exp-month" #expMonth class="form-control esper-select"
                  data-stripe="exp-month" required/>
        </div><div class="col-xs-6">
          <select #expYear class="form-control esper-select"
                  data-stripe="exp-year" required/>
        </div>
      </div>
    </div>
  </form>
  <form action="">
    <input id="default-card"
           #defaultBox type="checkbox" name="default" value="card" />
    <label for="default-card">Make Default Card</label>
  </form>
</div>
'''
    // Restricts the inputs to numbers
    ccNum['payment']('formatCardNumber');
    cvcNum['payment']('formatCardCVC');

    // Hide error message for now
    ccInvalidMsg.hide();  // Deesn't validate (e.g. expiration date < now)
    ccDeclineMsg.hide();  // Card valid on-face but declined by Stripe
    ccErrorOther.hide();  // Other error

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

    var checkInputGroup = function(ccGroup, valid) {
      if (! valid) {
        ccGroup.addClass("has-error");
      }
    };
    var teamid = team.teamid;

    var stripeResponseHandler = function(status, response) {
      ccInvalidMsg.hide();
      ccDeclineMsg.hide();
      ccErrorOther.hide();
      ccNumGroup.add(cvcNumGroup).add(expDateGroup).removeClass("has-error");

      if (response.error) {
        var cardType = $["payment"].cardType(ccNum.val());

        // Handles whether the cards are valid, independent of Stripe
        var validCard = $["payment"].validateCardNumber(ccNum.val());
        var validCVC = $["payment"].validateCardCVC(cvcNum.val(), cardType);
        var validExpiry = $["payment"].validateCardExpiry(expMonth, expYear);

        ccInvalidMsg.show();
        checkInputGroup(ccNumGroup, validCard);
        checkInputGroup(cvcNumGroup, validCVC);
        checkInputGroup(expDateGroup, validExpiry);
        callback(response.error);
      } else {
        var stripeToken = response.id;
        Api.noWarn(function() {
          return Api.addNewCard(teamid, stripeToken)
        }).then(
          function(card) {
            (<any> paymentForm.get(0)).reset();
            if (membership !== null) {
              var calls = [];
              calls.push(Api.setSubscription(teamid, membership));
              if (defaultBox.prop("checked")) {
                var setDefaultCall = Api.setDefaultCard(teamid, card.id);
                calls.push(setDefaultCall);
              }
              return Deferred.join(calls, true);
            } else {
              return false;
            }
          }, function (err) {
            if (err["status"] === 402) {
              ccDeclineMsg.show();
            } else {
              console.error(err);
              ccErrorOther.show();
              Status.reportError(err["responseText"]);
            }
            return err;
          })
          .then(function() {
            callback();
          }, function(err) {
            callback(err);
          });
      }
    };

    paymentForm.submit(function() {
      Stripe.card.createToken(paymentForm, stripeResponseHandler);
      return false;
    });

    return {
      content: content,
      form: paymentForm
    };
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
      <div #content />
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

    var refs = getPaymentForm(team, membership, function(err) {
      if (err) {
        primaryBtn.prop('disabled', false);
      } else {
        refresh();
      }
    });
    content.append(refs.content);

    primaryBtn.click(function() {
      primaryBtn.prop('disabled', true);
      refs.form.submit();
      return false;
    });

    cancelBtn.click(function() {
      (<any> modal).modal("hide"); // FIXME
    });

    (<any> modal).modal({}); // FIXME
  }

  function viewOfMembershipOption(planId: string) {
'''
<div #view>
  <div class="membership-name" #name />
  <div #price />
  <div #hours />
  <div>24/7 Availability</div>
  <div #responseWindow class="membership-response-window"/>
  <div #overage />
  <div #checkContainer/>
</div>
'''
    var check = $("<img class='svg-block membership-option-check'/>")
      .appendTo(checkContainer);
    Svg.loadImg(check, "/assets/img/check.svg");

    name.text(Plan.classNameOfPlan(planId));
    switch(Plan.classOfPlan(planId)) {
      case "lo":
        name.text("Silver");
        price.text("$299 / month");
        hours.text("10 hours of service");
        responseWindow.text("< 2 hour response");
        overage.text("Additional hours $35 / hour")
        break;
      case "med":
        name.text("Gold");
        price.text("$699 / month");
        hours.text("25 hours of service");
        responseWindow.text("< 1 hour response");
        overage.text("Additional hours $32 / hour")
        break;
      case "hi":
        name.text("Executive");
        price.text("$1499 / month");
        hours.text("58 hours of service");
        responseWindow.text("< 1 hour response");
        overage.text("Additional hours $30 / hour")
        break;
      case "employee":
        price.text("Free");
        break;
     }

    return view;
  }

  function showMembershipModal(team) {
'''
<div #modal class="modal fade" tabindex="-1" role="dialog">
  <div class="modal-dialog membership-modal">
    <div class="modal-content">
      <div class="modal-header">
        <div #iconContainer class="img-container-left modal-icon"/>
        <div #title class="modal-title">Change Membership</div>
      </div>
      <div #content>
        <div class="membership-options row clearfix">
          <div class="col-sm-4">
            <div #planLo class="membership-option"/>
          </div>
          <div class="col-sm-4">
            <div #planMed class="membership-option"/>
          </div>
          <div class="col-sm-4">
            <div #planHi class="membership-option"/>
          </div>
          <div #planXWrapper class="col-sm-12 hide">
            <div #planX class="membership-option"/>
          </div>
        </div>
        <div class="membership-modal-check">
          <input id="no-esper" #noEsper type="checkbox" />
          <input #noEsperFake type="checkbox" checked="1" disabled="1" />
          <label for="no-esper">
            Use a custom e-mail address for your assistant
            <span #noEsperPrice></span>
          </label>
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

    var teamid = team.teamid;
    var planElmPairs = [
      { elm: planLo, planId: Plan.lo },
      { elm: planMed, planId: Plan.med },
      { elm: planHi, planId: Plan.hi },
      { elm: planX, planId: Plan.employee }
    ];

    /*
      Employee plan is only shown to admins and to users already under
      that plan.
     */
    if (Login.isAdmin()) {
      planXWrapper.removeClass("hide");
    }

    Api.getSubscriptionStatus(teamid)
      .done(initModal);

    function initModal(customerStatus) {
      var membershipPlan = customerStatus.plan;
      var membershipStatus = customerStatus.status &&
        customerStatus.status.toLowerCase();
      var selectedPlanId = membershipPlan;
      noEsperFake.hide();

      if (! membershipStatus) {
        content.prepend(`<div class="membership-modal-note alert alert-warning">
          Select a membership option below to activate your account.
        </div>`);
        suspendBtn.hide();
      }
      else if (membershipPlan === Plan.canceled) {
        content.prepend(`<div class="membership-modal-note alert alert-warning">
          Select a membership option below to reactivate your account.
        </div>`);
        suspendBtn.hide();
      }
      else if (membershipPlan && !Plan.isActive(membershipPlan)) {
        var cutOffDate = moment("2015-09-18");
        var formatEndDate = "your next billing cycle following " +
           cutOffDate.format("MMMM D, YYYY");;
        if (customerStatus.current_period_end) {
          var endDate = moment(customerStatus.current_period_end);
          if ((endDate) < cutOffDate) {
            endDate = endDate.add(1, 'month');
          }
          formatEndDate = endDate.format("MMMM D, YYYY");
        }
        content.prepend(
          $(`<div class="membership-modal-note alert alert-warning">
            We've updated our pricing. Please select a new membership option.
            <br />
            Your old subscription will remain valid through ${formatEndDate}.
            <br />If
            you have not selected a new membership option by that time, you will
            be downgraded to our new Flexible Membership.
          </div>`));
      }
      else if (membershipStatus === "trialing") {
        var end = customerStatus.trial_end;
        var timeLeft = moment.duration(moment().diff(end)).humanize();
        selectPlan();
        content.prepend(`<div class="membership-modal-note alert alert-warning">
          <span>
            You have <span class="bold">${timeLeft}</span>
            remaining in your free trial.
            <br />
            At the end of your trial period, you'll be switched to
            the membership option you pick below.
            <br />
            To cancel before then, click "Suspend Membership" below.
          </span>
        </div>`);
      }
      else if (membershipStatus == "past-due" ||
               membershipStatus == "unpaid" ||
               membershipStatus == "canceled") {
        // If we get here, we've encountered a suspended account. No
        // guarantee Stripe call actually goes through, so let user
        // know to e-mail us.
        //
        // NB: Encountering the "canceled" status on a Stripe call is unusual
        // since canceled plans should be on a special "Cancel" plan. So warn
        // user reactivation might not work properly here.
        //
        content.prepend(`<div class="membership-modal-note alert alert-warning">
          Select a membership option below to reactivate your account. If
          you encounter any issues, please contact
          <a href="mailto:support@esper.com">support@esper.com</a>.
        </div>`);
        suspendBtn.hide();
      }
      else { // already picked a plan
        selectPlan();
      }

      // Update DOM with selectedPlanId
      function selectPlan() {
        let pair = List.find(planElmPairs, function(pair) {
          return (pair.planId === selectedPlanId ||
            Plan.plusPlans[pair.planId] === selectedPlanId);
        });
        if (pair) {
          selectMembership(pair.elm);
          noEsperFake.hide();
          noEsper.show();

          // If Plan is a "plus" plan
          if (Plan.isPlus(selectedPlanId)) {
            noEsper.prop("checked", true);
          }
          // If there is no "plus" option
          else if (!Plan.plusPlans[selectedPlanId]) {
            noEsper.hide();
            noEsperFake.show();
          }

          // Update noEsperPrice text
          switch (pair.planId) { // Use the base plan, not the plus
            case Plan.lo:
              noEsperPrice.text("for $49 / month");
              break;
            default:
              noEsperPrice.text("- included");
          }
        } else {
          Log.e("Unknown plan type: ", selectedPlanId);
        }
      }

      function selectMembership(option) {
        primaryBtn.prop("disabled", false);
        List.iter(planElmPairs, function(pair) {
          pair.elm.removeClass("selected");
        });
        option.addClass("selected");
        noEsper.removeClass("hide");
      }

      function readCheckBox() {
        var checked = noEsper.prop("checked");
        if (checked) {
          var plusPlan = Plan.plusPlans[selectedPlanId];
          if (plusPlan) {
            selectedPlanId = plusPlan;
          }
        }
      }

      List.iter(planElmPairs, function(pair) {
        pair.elm.click(function() {
          selectedPlanId = pair.planId;
          selectPlan();
        });
        pair.elm.append(viewOfMembershipOption(pair.planId));
      });

      primaryBtn.click(function() {
        $(".next-step-button").prop("disabled", false);
        primaryBtn.prop('disabled', true);
        primaryBtn.text('Updating');
        readCheckBox();
        Log.d("Selected plan ID: " + selectedPlanId);
        if (selectedPlanId) {
          let setSub = function() {
            Api.setSubscription(teamid, selectedPlanId)
              .done(function() { refresh(); });
          };
          if (Plan.isFree(selectedPlanId)) {
            setSub();
          }
          else {
            Api.getSubscriptionStatusLong(team.teamid)
              .done(function(status){
                if (status.cards.length === 0) {
                  (<any> modal).modal("hide"); // FIXME
                  showPaymentModal("Add", team, selectedPlanId);
                } else {
                  setSub();
                }
              });
          }
        } else {
          (<any> modal).modal("hide"); // FIXME
        }
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
          (<any> modal).modal("hide");
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
        <div #memCards class="status" />
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
        memPlan.append(Plan.classNameOfPlan(customerStatus.plan));
        if (customerStatus.plan === Plan.canceled) {
          memStatus.append("Canceled");
        } else {
          memStatus.append(customerStatus.status);
        }
    });

    Api.getSubscriptionStatusLong(teamid).done(function(status) {
      if (status.cards.length < 1) {
        memCards.append( "No Cards");
      }
      else {
        for (var i = 0; i < status.cards.length; i++) {
          memCards.append("•••• •••• •••• ");
          memCards.append(<any>status.cards[i].last4);
'''rmCardView
<span #removeCardSpan>
  <span class="text-divider"></span><a #removeCardLink>Remove</a>
</span>
'''
          if (status.cards.length > 1) {
            memCards.append(removeCardSpan);
            var cardid = status.cards[i].id;
            removeCardLink.addClass("danger-link");
            removeCardLink.click(function() {
              Log.d(execid, teamid, cardid);
              Api.deleteCard(teamid, cardid).done(refresh);
            });
          }
          memCards.append('<br />')
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
      .done(updateStatus);

    function updateStatus(customer) {
      var mem = customer.status && customer.status.toLowerCase();
      var plan = customer.plan;

      if (plan === Plan.canceled || mem === 'canceled') {
        membershipBadge.text("CANCELED");
        membershipBadge.addClass("suspended");
      }

      else if (mem == "Unpaid" || mem == "Past_due" || mem == "Canceled") {
        membershipBadge.text("SUSPENDED");
        membershipBadge.addClass("suspended");
      }

      else if (! mem) {
        membershipBadge.text("NONE");
        membershipBadge.addClass("suspended");
      }

      else if (! Plan.isActive(plan)) {
        membershipBadge.text("EXPIRING");
        membershipBadge.addClass("suspended");
      }

      // Membership must be trialing or active to get here
      else if (mem === "trialing") {
        membershipBadge.text("TRIALING");
        membershipBadge.addClass("active");
      }

      else { // active
        membershipBadge.text(Plan.classNameOfPlan(plan).toUpperCase());
        membershipBadge.addClass("active");
      }

      changeMembership.click(function() { showMembershipModal(team); });
      changePayment.click(function() {
        showPaymentModal("Change", team, null)
      });
    }

    return view;
  }

  export function load(team : ApiT.Team, plans? : boolean, payment? : boolean) {
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

    if (plans) showMembershipModal(team);
    if (payment) showPaymentModal("Change", team, null);
    return view;
  }

}
