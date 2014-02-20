/*
  Settings Page
*/

var settings = (function() {
  var mod = {};

  var malePrefixes = ["Mr."];
  var femalePrefixes = ["Ms.", "Mrs.", "Miss"];
  var commonPrefixes = ["Dr.", "Prof."];

  var asstProfile = null;
  var execProfile = null;
  var asstNamePrefixSel = null;
  var execNamePrefixSel = null;
  var originalExecPhone = null;

  function displayNamePrefixes(view, gender, chosenPrefix) {
    view.children().remove();
    var prefixes;
    if (!gender) {
      prefixes = malePrefixes.concat(femalePrefixes, commonPrefixes);
    } else if (gender === "Male") {
      prefixes = malePrefixes.concat(commonPrefixes);
    } else if (gender === "Female") {
      prefixes = femalePrefixes.concat(commonPrefixes);
    } else {
      // Invalid gender from API, should never happen
      prefixes = malePrefixes.concat(femalePrefixes, commonPrefixes);
    }
    var options = list.map(prefixes, function(prefix) {
      return { label: prefix, value: prefix };
    });
    var prefixSel = select.create({
      options: options,
      initialKey: chosenPrefix,
      defaultAction: function() {
        $("#settings-update-name").prop("disabled", false);
      }
    });
    prefixSel.view.appendTo(view);
    return prefixSel;
  }

  function displayNoMoreExecs() {
    var view = $("<div class='exec-row clearfix'/>");
    var img = $("<img/>", {
      id: "settings-plus-exec",
      "class": "svg",
      src: "/assets/img/settings.svg"
    });
    $("<div class='add-exec-circ disabled'/>")
      .append(img)
      .appendTo(view);
    var text = $("<div class='add-exec-text ellipsis'/>")
      .text("You may only assist one executive at this time.");
    $("<div class='add-exec-details'/>")
      .append(text)
      .appendTo(view);
  }

  function updateExecProfile(teamid) {
    var prefix = execNamePrefixSel.get();
    var firstName = $("#settings-exec-first-name").val();
    var lastName = $("#settings-exec-last-name").val();
    var pseudo = $("#settings-exec-pseudonym").val();
    var firstLast = null;
    if (firstName != "" && lastName != "")
      firstLast = [firstName, lastName];

    /* TODO Phone number stuff
    var phoneNumber = $("#settings-exec-phone").val();
    var contact = {
      contact_kind: "Phone_number",
      contact_data: phoneNumber
    };
    var apiCall = deferred.defer(null);
    if (phoneNumber !== originalExecPhone) {
      apiCall =
        api.postContactInfo(execProfile.profile_uid, teamid, contact);
    } else if (phoneNumber === "" && originalExecPhone !== "") {
      apiCall =
        api.deleteContactInfo(execProfile.profile_uid, teamid, contact);
    }
    */

    var profileEdit = {
      profile_uid: execProfile.profile_uid,
      prefix: prefix,
      first_last: firstLast,
      pseudonym: (pseudo != "" ? pseudo : null),
      gender: execProfile.gender
    };
    api.postProfile(profileEdit, teamid).done(function(prof) {
      api.getProfile(execProfile.profile_uid).done(function(prof) {
        execProfile = prof;
        profile.set(prof);
        $(".exec-settings-modal").modal("hide");
        home.load(); // To update top left corner
        settings.load();
      });
    });
  }

  function showOnlyPseudonym() {
    $("#pseudonym-option").addClass("checkbox-selected");
    $("#settings-exec-title").addClass("hide");
    $("#settings-exec-legal-name").addClass("hide");
    $("#pseudonym-optional-label").addClass("hide");
  }

  function showFirstLastPseudonym() {
    $("#pseudonym-option").removeClass("checkbox-selected");
    $("#settings-exec-title").removeClass("hide");
    $("#settings-exec-legal-name").removeClass("hide");
    $("#pseudonym-optional-label").removeClass("hide");
  }

  function execSettingsModal(execUID, teamid) {
    api.getProfile(execUID).done(function(execProf) {
      execProfile = execProf;
      api.getEmails(execUID, teamid).done(function(execEmails) {
      api.getContactInfo(execUID, teamid).done(function(execContactInfo) {
        var firstName = "";
        var lastName = "";
        var pseudonym = "";
        var modalCirc = $("#settings-modal-circ");
        var modalTitle = $("#exec-settings-title");
        if (execProf.first_last) {
          firstName = execProf.first_last[0];
          lastName = execProf.first_last[1];
          if (execProf.pseudonym) {
            pseudonym = execProf.pseudonym;
            modalCirc.text(pseudonym[0].toUpperCase());
            modalTitle.text("Settings for " + pseudonym);
          } else {
            modalCirc.text(firstName[0].toUpperCase());
            modalTitle.text("Settings for " + firstName);
          }
          showFirstLastPseudonym();
        } else {
          pseudonym = execProf.pseudonym;
          modalCirc.text(pseudonym[0].toUpperCase());
          modalTitle.text("Settings for " + pseudonym);
          showOnlyPseudonym();
        }

        execNamePrefixSel = displayNamePrefixes(
          $("#settings-exec-name-prefix"),
          execProf.gender,
          execProf.prefix
        );
        $("#settings-exec-first-name").val(firstName);
        $("#settings-exec-last-name").val(lastName);
        $("#settings-exec-pseudonym").val(pseudonym);
        $("#pseudonym-option")
          .unbind("click")
          .click(function() {
            if ($(this).hasClass("checkbox-selected")) {
              showFirstLastPseudonym();
            } else {
              showOnlyPseudonym();
            }
          });

        var emailView = $("#settings-exec-emails");
        emailView.children().remove();
        var ea = false;
        list.iter(execEmails, function(email) {
          displayEmail(emailView, ea, email, execUID, teamid, function() {
            execSettingsModal(execUID, teamid);
          });
        });

        /* TODO: Only showing one piece of contact info, a phone number.
                 The backend supports storing others too, like Skype ID. */
        /*
        var phoneNumber = execContactInfo.length ? execContactInfo[0][1] : "";
        $("#settings-exec-phone").val(phoneNumber);
        originalExecPhone = phoneNumber;
        */

        displayEmailAdd(emailView, execUID, teamid, function() {
          execSettingsModal(execUID, teamid);
        });
        $("#exec-settings-save").off("click");
        $("#exec-settings-save").click(function() {
          updateExecProfile(teamid);
        });
        $(".exec-settings-modal").modal({});
      });
      });
    });
  }

  function createExecRow(execEmails, prof, teamid) {
    var primaryOnly =
      execEmails.filter(function(e) { return e.email_primary; });
    var primaryEmail = primaryOnly[0].email;
    var row = $("<div class='exec-row clearfix'/>");
    var firstLast = "";
    var pseudonym = "";
    var profCirc = $("<div class='settings-prof-circ'/>");
    if (prof.first_last) {
      firstLast = prof.first_last[0] + " " + prof.first_last[1];
      if (prof.pseudonym) {
        pseudonym = prof.pseudonym;
        profCirc.text(pseudonym[0].toUpperCase());
      } else {
        profCirc.text(firstLast[0].toUpperCase());
      }
    } else {
      pseudonym = prof.pseudonym;
      profCirc.text(pseudonym[0].toUpperCase());
    }
    profCirc.appendTo(row);
    var gear = $("<a/>", {
      href: "#",
      "data-toggle": "tooltip",
      placement: "left",
      title: "Settings",
      "class": "exec-settings-div"
    });
    gear.click(function() {
      execSettingsModal(prof.profile_uid, teamid);
    });
    $("<img/>")
      .addClass('svg exec-settings')
      .attr('src', '/assets/img/settings.svg')
      .appendTo(gear);
    gear.appendTo(row);
    var details = $("<div class='exec-details'/>");
    $("<div class='exec-name ellipsis'/>")
      .text(pseudonym ? pseudonym : firstLast)
      .appendTo(details);
    $("<div class='exec-email ellipsis'/>")
      .text(primaryEmail)
      .appendTo(details);
    details.appendTo(row);
    return row;
  }

  function findTeam(teams, execUid) {
    return list.find(teams, function(team) {
      return team.team_leaders[0] === execUid;
    });
  }

  function displayExecutives(teams) {
    var view = $("#settings-executives");
    view.children().remove();
<<<<<<< HEAD
    var uniqUIDs = list.unique(Object.keys(leaders));
=======
    var leaderUids = list.map(teams, function(team) {
      return team.team_leaders[0];
    });
>>>>>>> be21f16e539ef1d1bed23ed6b98af0da8298d226
    var deferredDeferredRows =
      profile.mget(leaderUids).then(function(execProfs) {
        return list.map(execProfs, function(execProf) {
          var prof = execProf.prof;
          var execUid = prof.profile_uid;
          var team = findTeam(teams, execUid);
          var teamid = team.teamid;
          var deferredRow = api.getEmails(execUid, teamid)
            .then(function(execEmails) {
              return createExecRow(execEmails, prof, teamid);
            });
          return deferredRow;
        });
      });
    deferredDeferredRows.then(function(deferredRows) {
      deferred.join(deferredRows)
        .done(function(rows) {
          list.iter(rows, function(row) {
            row.appendTo(view);
          });
          displayNoMoreExecs();
        });
    });
  }

  function editSignature(myUID, theirUID, teamid, email) {
    $("#edit-signature-input").val(email.email_signature);
    $(".edit-signature-modal").modal({});

    $("#edit-signature-save").off("click");
    $("#edit-signature-save").one("click", function() {
      var sig = $("#edit-signature-input").val();
      api.postEmailSignature(myUID, theirUID, teamid, {
        email_address: email.email,
        email_signature: sig
      }).done(function() {
        $(".edit-signature-modal").modal("hide");
        settings.load();
      });
    });
  }

  function displayEmail(view, isEA, email, uid, teamid, done) {
    var divEmailRow = $("<div class='email-row clearfix'/>");
    var divEmailRowContent = $("<div class='email-row-content'/>")
      .appendTo(divEmailRow);

    if (isEA && email.email_confirmed) {
      $("<button class='btn btn-default edit-signature'/>")
        .text("Edit signature")
        .click(function() { editSignature(uid, uid, teamid, email); })
        .appendTo(divEmailRowContent);
    }

    var emailLine = $("<div class='email-line ellipsis'/>")
      .appendTo(divEmailRowContent);
    $("<span class='email-address primary ellipsis'/>")
      .text(email.email)
      .appendTo(emailLine);
    if (email.email_primary) {
      $("<span class='email-label primary-label unselectable'/>")
        .text("PRIMARY")
        .appendTo(emailLine);
    } else if (!email.email_confirmed) {
      $("<span class='email-label not-verified-label unselectable'/>")
        .text("NOT VERIFIED")
        .appendTo(emailLine);
    }

    var divEmailActions = $("<div class='email-actions'/>")
        .appendTo(divEmailRowContent);
    if (!email.email_primary && email.email_confirmed) {
      $("<a href='#' class='email-action'/>")
        .text("Make primary")
        .click(function() { /* TODO */ return false; })
        .appendTo(divEmailActions);
    } else if (email.email_confirmed) {
      $("<span class='verified-label unselectable'/>")
        .text("Verified")
        .appendTo(divEmailActions);
    } else if (!email.email_confirmed) {
      $("<a href='#' class='email-action'/>")
        .text("Resend verification email")
        .click(function() {
          var json = { email_address: email.email };
          api.resendEmailToken(login.me(), uid, teamid, json);
          return false;
        })
        .appendTo(divEmailActions);
    }
    if (!(email.email_primary)) {
      $("<span class='vertical-divider'/>")
        .text("|")
        .appendTo(divEmailActions);
      $("<a href='#' class='email-action'/>")
        .text("Remove")
        .click(function() {
          var json = { email_address: email.email };
          api.deleteEmail(login.me(), uid, teamid, json)
            .done(done);
          return false;
        })
        .appendTo(divEmailActions);
    }

    var googleDisconnectButton = $("#connect-google");
    googleDisconnectButton
      .off("click")
      .click(function() { api.postCalendarRevoke(uid); });

    divEmailRow.appendTo(view);
  }

  function displayEmailAdd(view, uid, teamid, done) {
    var divEmailAdd = $("<div class='input-group'/>");

    $("<div class='text-field-label'/>")
      .text("Add another email:")
      .appendTo(divEmailAdd);
    var emailAdd =
      $("<input type='text' name='email-add' class='form-control'/>")
        .appendTo(divEmailAdd);
    $("<button class='btn btn-default'/>")
      .text("Add")
      .click(function() {
        var email = { email_address: emailAdd.val() };
        api.postEmail(login.me(), uid, teamid, email)
          .fail(status_.onErrors([403, 409]))
          .done(done);
      })
      .appendTo(divEmailAdd);
    divEmailAdd.appendTo(view);
  }

  function displayAssistantProfile(eaUID) {
    $("#settings-password").val("");
    $("#settings-confirm-password").val("");
    api.getProfile(eaUID).done(function(eaProf) {
      asstProfile = eaProf;
      var teamid = login.getTeam().teamid;
      api.getEmails(eaUID, teamid).done(function(eaEmails) {
        asstNamePrefixSel = displayNamePrefixes($("#settings-name-prefix"),
          eaProf.gender, eaProf.prefix);
        if (eaProf.first_last) {
          var firstName = eaProf.first_last[0];
          $("#settings-first-name").val(firstName);
          $("#settings-last-name").val(eaProf.first_last[1]);
          if (eaProf.pseudonym) {
            // This shouldn't happen...
            $("#settings-profile-circ").text(eaProf.pseudonym[0].toUpperCase());
          } else {
            $("#settings-profile-circ").text(firstName[0].toUpperCase());
          }
        } else {
          /* EAs don't normally have pseudonyms, except for test accounts
             named after email addresses */
          $("#settings-profile-circ").text(eaProf.pseudonym[0].toUpperCase());
        }
        var emailView = $("#settings-emails");
        emailView.children().remove();
        var isEA = true;
        list.iter(eaEmails, function(email) {
          displayEmail(emailView, isEA, email, eaUID, teamid, mod.load);
        });
        displayEmailAdd(emailView, eaUID, teamid, mod.load);
      });
    });
  }

  function disableUpdateButtonsUntilModified() {
    var updateName = $("#settings-update-name");
    updateName.prop("disabled", true);
    var enableUpdateName = function() {
      if ($("#settings-first-name").val() && $("#settings-last-name").val())
        updateName.prop("disabled", false);
      else
        updateName.prop("disabled", true);
    };
    $("#settings-first-name").on("input", enableUpdateName);
    $("#settings-last-name").on("input", enableUpdateName);

    var updatePassword = $("#settings-update-password");
    updatePassword.prop("disabled", true);
    var password = $("#settings-password");
    var confirmPassword = $("#settings-confirm-password");
    util.afterTyping(confirmPassword, 250, function() {
      if (password.val() === confirmPassword.val()) {
        updatePassword.prop("disabled", false);
      } else {
        updatePassword.prop("disabled", true);
      }
    });
  }

  function updateAssistantName() {
    var prefix = asstNamePrefixSel.get();
    var firstName = $("#settings-first-name").val();
    var lastName = $("#settings-last-name").val();
    var firstLast = [firstName, lastName];

    var profileEdit = {
      profile_uid: asstProfile.profile_uid,
      prefix: prefix,
      first_last: firstLast,
      pseudonym: asstProfile.pseudonym,
      gender: asstProfile.gender
    };
    api.postProfile(profileEdit, login.getTeam().teamid).done(function() {
      api.getProfile(asstProfile.profile_uid).done(function(prof) {
        asstProfile = prof;
        profile.set(prof);
        settings.load();
      });
    });
  }

  function updateAssistantPassword() {
    var password = $("#settings-password").val();
    var confirmPassword = $("#settings-confirm-password").val();

    if (password != "" && password != confirmPassword) {
        // Shouldn't happen unless util.afterTyping got faked out...
        alert("Password does not match confirmation!");
    } else {
        var myUID = asstProfile.profile_uid;
        api.changePassword(myUID, myUID, login.getTeam().teamid, password)
          .done(settings.load);
    }
  }

  function setupTabs() {
    $(".tab-my-account a").off("click");
    $(".tab-my-account a").click(function() {
      $(".settings-tab").removeClass("active");
      $(this).parent().addClass("active");
      $(".settings-content").addClass("hide");
      $("#tab-my-account-content").removeClass("hide");
    });
    $(".tab-executives a").off("click");
    $(".tab-executives a").click(function() {
      $(".settings-tab").removeClass("active");
      $(this).parent().addClass("active");
      $(".settings-content").addClass("hide");
      $("#tab-executives-content").removeClass("hide");
    });
    $(".tab-templates a").off("click");
    $(".tab-templates a").click(function() {
      $(".settings-tab").removeClass("active");
      $(this).parent().addClass("active");
      $(".settings-content").addClass("hide");
      $("#tab-templates-content").removeClass("hide");
    });
  }

  function saveTemplate(condition) {
    var template = {
      message_condition: condition,
      message_text: $("#edit-template-message").val()
    };
    api.postUserTemplate(login.me(), template)
      .done(function() {
        $("#edit-template-modal").modal("hide");
        settings.load();
      });
  }

  function editTemplate(templates, condition) {
    var editOptions = list.find(templates, function(x) {
      return x.message_condition === condition;
    });
    $("#edit-template-message").val(editOptions.message_text);
    $("#edit-template-save").off("click");
    $("#edit-template-save").on("click", function() {
      saveTemplate(condition);
    });
    $("#edit-template-modal").modal({});
  }

  function displayTemplates() {
    api.getUserTemplates().done(function(templates) {
      $("#edit-options-approval").off("click");
      $("#edit-options-approval").on("click", function() {
        editTemplate(templates, "Meeting_options_approval");
      });
      $("#edit-options-offer").off("click");
      $("#edit-options-offer").on("click", function() {
        editTemplate(templates, "Meeting_options_offer");
      });
      $("#edit-confirmation-approval").off("click");
      $("#edit-confirmation-approval").on("click", function() {
        editTemplate(templates, "Meeting_confirmation_approval");
      });
      $("#edit-confirmation-offer").off("click");
      $("#edit-confirmation-offer").on("click", function() {
        editTemplate(templates, "Meeting_confirmation_offer");
      });
      $("#edit-reminder-approval").off("click");
      $("#edit-reminder-approval").on("click", function() {
        editTemplate(templates, "Meeting_reminder_approval");
      });
      $("#edit-reminder-offer").off("click");
      $("#edit-reminder-offer").on("click", function() {
        editTemplate(templates, "Meeting_reminder_offer");
      });
    });
  }

  mod.load = function() {
    displayAssistantProfile(login.me());
    var teams = login.getTeams();
    displayExecutives(teams);
    disableUpdateButtonsUntilModified();
    setupTabs();
    displayTemplates();
    $("#settings-update-name").off("click");
    $("#settings-update-name").one("click", updateAssistantName);
    $("#settings-update-password").off("click");
    $("#settings-update-password").one("click", updateAssistantPassword);
  };

  return mod;
}());
