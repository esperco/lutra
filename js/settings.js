/*
  Settings Page
*/

var settings = (function() {
  var mod = {};

  var malePrefixes = ["Mr."];
  var femalePrefixes = ["Ms.", "Mrs.", "Miss"];
  var commonPrefixes = ["Dr.", "Prof."];

  var assistantProfile = null;
  var assistantAccount = null;
  var execProfile = null;
  var execAccount = null;
  var namePrefixSel = null;
  var execNamePrefixSel = null;

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
      // TODO Invalid gender
    }
    var options = list.map(prefixes, function(prefix) {
      return { label: prefix, value: prefix };
    });
    var prefixSel = select.create({
      options: options,
      initialKey: chosenPrefix,
      defaultAction: function() { $("#settings-update-account").prop("disabled", false); }
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
    var fullName = $("#settings-exec-full-name").val();
    var familiarName = $("#settings-exec-familiar-name").val();
    var formalName = $("#settings-exec-formal-name").val();
    var prefix = execNamePrefixSel.get();

    var profileEdit = {
      profile_uid: execProfile.profile_uid,
      familiar_name: familiarName,
      full_name: fullName,
      formal_name: formalName,
      gender: execProfile.gender,
      prefix: prefix,
      // phone_number: phoneNumber
    };
    api.postProfile(profileEdit, teamid).done(function(prof) {
      api.getProfile(execProfile.profile_uid).done(function(prof) {
        execProfile = prof;
        //console.log("Edited: " + prof.toSource());
        profile.set(prof);
        $(".exec-settings-modal").modal("hide");
        home.load();
        settings.load();
      });
    });
  }

  function execSettingsModal(execUID, teamid) {
    api.getProfile(execUID).done(function(execProf) {
      execProfile = execProf;
      //console.log("Exec profile: " + execProf.toSource());
      api.getAccount(execUID, teamid).done(function(execAcct) {
        execAccount = execAcct;
        //console.log("Exec account: " + execAccount.toSource());
        var fullName = execProf.full_name;
        var familiarName = execProf.familiar_name;
        $("#exec-settings-title").text("Settings for " + familiarName);
        $("#settings-modal-circ").text(fullName[0].toUpperCase());
        execNamePrefixSel = displayNamePrefixes(
          $("#settings-exec-name-prefix"),
          execProf.gender,
          execProf.prefix
        );
        $("#settings-exec-full-name").val(fullName);
        $("#settings-exec-familiar-name").val(familiarName);
        $("#settings-exec-formal-name").val(execProf.formal_name);
        $("#settings-exec-phone").val(execProf.phone_number);
        $("#pseudonym-option").click(function() {
          if ($(this).hasClass("checkbox-selected")) {
            $(this).removeClass("checkbox-selected");
            $("#exec-title").removeClass("hide");
            $("#exec-legal-name").removeClass("hide");
            $("#pseudonym-optional-label").removeClass("hide");
          } else {
            $(this).addClass("checkbox-selected");
            $("#exec-title").addClass("hide");
            $("#exec-legal-name").addClass("hide");
            $("#pseudonym-optional-label").addClass("hide");
          }
        })
        var emailView = $("#settings-exec-emails");
        emailView.children().remove();
        var primary = execAccount.primary_email;
        displayEmail(emailView, primary, true, true);
        displayOtherEmails($("#settings-emails"),
          execAccount.all_emails, primary);
        $("#exec-settings-save").off("click");
        $("#exec-settings-save").one("click", function() {
          updateExecProfile(teamid)
        });
        $(".exec-settings-modal").modal({});
      });
    });
  }

  function displayExecutives(leaders) {
    var view = $("#settings-executives");
    view.children().remove();
    var uniqUIDs = util.arrayUnique(Object.keys(leaders));
    profile.mget(uniqUIDs)
      .done(function(execProfs) {
        list.iter(execProfs, function(execProf) {
          var prof = execProf.prof;
          var teamid = leaders[prof.profile_uid];
          //console.log(leaders.toSource());
          //console.log(prof.profile_uid);
          //console.log(teamid);
          api.getAccount(prof.profile_uid, teamid).done(function(execAcct) {
            //console.log("Exec: " + prof.toSource());
            var row = $("<div class='exec-row clearfix'/>");
            var name = prof.full_name;
            $("<div class='settings-prof-circ'/>")
              .text(name[0].toUpperCase())
              .appendTo(row);
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
            $("<img class='svg exec-settings' src='/assets/img/settings.svg'/>")
              .appendTo(gear);
            gear.appendTo(row);
            var details = $("<div class='exec-details'/>");
            $("<div class='exec-name ellipsis'/>")
              .text(name)
              .appendTo(details);
            $("<div class='exec-email ellipsis'/>")
              .text(execAcct.primary_email)
              .appendTo(details);
            details.appendTo(row);
            row.appendTo(view);
          });
        });
        displayNoMoreExecs();
      });
  }

  function displayEmail(view, email, isPrimary, isVerified, isOnlyEmail) {
    var divEmailRow = $("<div class='email-row clearfix'/>");
    var divEmailRowContent = $("<div class='email-row-content'/>")
      .appendTo(divEmailRow);

    $("<button class='btn btn-default edit-signature'/>")
      .text("Edit signature")
      .appendTo(divEmailRowContent);

    var emailLine = $("<div class='email-line ellipsis'/>")
      .appendTo(divEmailRowContent);
    $("<span class='email-address primary ellipsis'/>")
      .text(email)
      .appendTo(emailLine);
    if (isPrimary) {
      $("<span class='email-label primary-label unselectable'/>")
        .text("PRIMARY")
        .appendTo(emailLine);
    } else if (!isVerified) {
      $("<span class='email-label not-verified-label unselectable'/>")
        .text("NOT VERIFIED")
        .appendTo(emailLine);
    }

    var divEmailActions =
      $("<div class='email-actions'/>")
        .appendTo(divEmailRowContent);
    if (!isPrimary && isVerified) {
      $("<a href='#' class='email-action'/>")
        .text("Make primary")
        .click(function() { /* TODO */ return false; })
        .appendTo(divEmailActions);
    } else if (isVerified) {
      $("<span class='verified-label unselectable'/>")
        .text("Verified")
        .appendTo(divEmailActions);
    } else if (!isVerified) {
      $("<a href='#' class='email-action'/>")
        .text("Verify")
        .click(function() { /* TODO */ return false; })
        .appendTo(divEmailActions);
    }
    $("<span class='vertical-divider unselectable'/>")
      .text("|")
      .appendTo(divEmailActions);
    if (isOnlyEmail) {
      $("<span class='email-action remove-email-disabled unselectable'/>")
        .text("Remove")
        .appendTo(divEmailActions);
    } else {
      $("<a href='#' class='email-action remove-email'/>")
        .text("Remove")
        .click(function() { /* TODO */ return false; })
        .appendTo(divEmailActions);
    }



    divEmailRow.appendTo(view);
  }

  function displayOtherEmails(view, profile_emails, primary) {
    list.iter(profile_emails, function(email) {
      if (email.email !== primary)
        displayEmail(view, email.email, false, email.email_confirmed);
    });
  }

  function displayAssistantProfile(eaUID) {
    $("#settings-password").val("");
    $("#settings-confirm-password").val("");
    api.getProfile(eaUID).done(function(eaProf) {
      assistantProfile = eaProf;
      //console.log("EA Profile: " + eaProf.toSource());
      api.getAccount(eaUID, login.getTeam().teamid).done(function(eaAccount) {
        assistantAccount = eaAccount;
        //console.log("EA Account: " + eaAccount.toSource());
        namePrefixSel = displayNamePrefixes($("#settings-name-prefix"),
          eaProf.gender, eaProf.prefix);
        var fullName = eaProf.full_name;
        $("#settings-profile-circ").text(fullName[0].toUpperCase());
        $("#settings-full-name").val(fullName);
        $("#settings-familiar-name").val(eaProf.familiar_name);
        $("#settings-formal-name").val(eaProf.formal_name);
        $("#settings-signature").val(eaProf.signature);
        var emailView = $("#settings-emails");
        emailView.children().remove();
        var primary = eaAccount.primary_email;
        var oneEmail = true;
        if (eaAccount.all_emails.length > 1) {
          oneEmail = false;
        }
        displayEmail(emailView, primary, true, true, oneEmail);
        displayOtherEmails($("#settings-emails"),
          eaAccount.all_emails, primary);
      });
    });
  }

  function disableUpdateButtonUntilModified() {
    var updateButton = $("#settings-update-account");
    updateButton.prop("disabled", true);
    var enableButton = function() { updateButton.prop("disabled", false); };
    $("#settings-full-name").on("input", enableButton);
    $("#settings-familiar-name").on("input", enableButton);
    $("#settings-formal-name").on("input", enableButton);
    $("#settings-signature").on("input", enableButton);
    var password = $("#settings-password");
    var confirmPassword = $("#settings-confirm-password");
    util.afterTyping(confirmPassword, 250, function() {
      if (password.val() === confirmPassword.val()) {
        updateButton.prop("disabled", false);
      } else {
        updateButton.prop("disabled", true);
      }
    });
  }

  function updateAssistantProfile() {
    var fullName = $("#settings-full-name").val();
    var familiarName = $("#settings-familiar-name").val();
    var formalName = $("#settings-formal-name").val();
    var prefix = namePrefixSel.get();
    var signature = $("#settings-signature").val();
    var password = $("#settings-password").val();
    var confirmPassword = $("#settings-confirm-password").val();

    var maybeChangePassword = deferred.defer(null);
    if (password != "") {
      if (password != confirmPassword) {
        // Shouldn't happen unless util.afterTyping got faked out...
        alert("Password does not match confirmation!");
      } else {
        var myUID = assistantProfile.profile_uid;
        maybeChangePassword =
          api.changePassword(myUID, myUID, login.getTeam().teamid, password);
      }
    }

    maybeChangePassword.done(function() {
      var profileEdit = {
        profile_uid: assistantProfile.profile_uid,
        familiar_name: familiarName,
        full_name: fullName,
        formal_name: formalName,
        gender: assistantProfile.gender,
        prefix: prefix//,
        //signature: signature
      };
      api.postProfile(profileEdit, login.getTeam().teamid).done(function() {
        api.getProfile(assistantProfile.profile_uid).done(function(prof) {
          assistantProfile = prof;
          //console.log("Edited: " + prof.toSource());
          profile.set(prof);
          settings.load();
        });
      });
    });
  }

  mod.load = function() {
    //console.log("settings.load");
    displayAssistantProfile(login.me());
    var teams = login.getTeams();
    var mapping = {};
    var leaders = list.iter(teams, function(team) {
      mapping[team.team_leaders[0]] = team.teamid;
    });
    displayExecutives(mapping);
    disableUpdateButtonUntilModified();
    $("#settings-update-account").off("click");
    $("#settings-update-account").one("click", updateAssistantProfile);
  };

  return mod;
}());
