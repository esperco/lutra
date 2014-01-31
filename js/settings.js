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

  function updateExecProfile() {
    var fullName = $("#settings-exec-full-name").val();
    var familiarName = $("#settings-exec-familiar-name").val();
    var formOfAddress = $("#settings-exec-form-of-address").val();
    var prefix = execNamePrefixSel.get();
    var phoneNumber = $("#settings-exec-phone").val();
    var password = $("#settings-exec-password").val();
    var confirmPassword = $("#settings-exec-confirm-password").val();

    var maybeChangePassword = deferred.defer(null);
    if (password != "") {
      if (password != confirmPassword) {
        // Shouldn't happen unless util.afterTyping got faked out...
        alert("Password does not match confirmation!");
      } else {
        maybeChangePassword =
          api.changePassword(
            assistantProfile.profile_uid,
            execProfile.profile_uid,
            password
          );
      }
    }

    maybeChangePassword.done(function() {
      var profileEdit = {
        profile_uid: execProfile.profile_uid,
        familiar_name: familiarName,
        full_name: fullName,
        form_of_address: formOfAddress,
        gender: execProfile.gender,
        prefix: prefix,
        phone_number: phoneNumber
      };
      api.postProfile(profileEdit).done(function(prof) {
        api.getProfile(execProfile.profile_uid).done(function(prof) {
          execProfile = prof;
          console.log("Edited: " + prof.toSource());
          profile.set(prof);
          $(".exec-settings-modal").modal("hide");
          home.load();
          settings.load();
        });
      });
    });
  }

  function execSettingsModal(execUID) {
    api.getProfile(execUID).done(function(execProf) {
      execProfile = execProf;
      console.log("Exec profile: " + execProf.toSource());
      api.getAccount(execUID).done(function(execAcct) {
        execAccount = execAcct;
        console.log("Exec account: " + execAccount.toSource());
        var fullName = execProf.full_name;
        var familiarName = execProf.familiar_name;
        $("#exec-settings-title").text("Settings for " + familiarName);
        $("#settings-modal-circ").text(fullName[0]);
        execNamePrefixSel = displayNamePrefixes(
          $("#settings-exec-name-prefix"),
          execProf.gender,
          execProf.prefix
        );
        $("#settings-exec-full-name").val(fullName);
        $("#settings-exec-familiar-name").val(familiarName);
        $("#settings-exec-form-of-address").val(execProf.form_of_address);
        $("#settings-exec-phone").val(execProf.phone_number);
        var emailView = $("#settings-exec-emails");
        emailView.children().remove();
        var primary = execAccount.primary_email;
        displayEmail(emailView, primary, true, true);
        displayOtherEmails($("#settings-emails"),
          execAccount.all_emails, primary);
        $("#exec-settings-save").off("click");
        $("#exec-settings-save").one("click", updateExecProfile);
        $(".exec-settings-modal").modal({});
      });
    });
  }

  function displayExecutives(execUIDs) {
    var view = $("#settings-executives");
    view.children().remove();
    var uniqUIDs = util.arrayUnique(execUIDs);
    profile.mget(uniqUIDs)
      .done(function(execProfs) {
        list.iter(execProfs, function(execProf) {
          var prof = execProf.prof;
          api.getAccount(prof.profile_uid).done(function(execAcct) {
            console.log("Exec: " + prof.toSource());
            var row = $("<div class='exec-row clearfix'/>");
            var name = prof.full_name;
            $("<div class='settings-prof-circ'/>")
              .text(name[0])
              .appendTo(row);
            var gear = $("<a/>", {
              href: "#",
              "data-toggle": "tooltip",
              placement: "left",
              title: "Settings",
              "class": "exec-settings-div"
            });
            gear.click(function() {
              execSettingsModal(prof.profile_uid);
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

  function displayEmail(view, email, isPrimary, isVerified) {
    var divEmailRow = $("<div class='email-row clearfix'/>");
    var divEmailRowContent = $("<div class='email-row-content'/>")
      .appendTo(divEmailRow);

    var divEmailActions =
      $("<div class='email-actions email-actions-desktop'/>")
        .appendTo(divEmailRowContent);
    if (isPrimary) {
      $("<div class='primary-label unselectable'/>")
        .text("PRIMARY")
        .appendTo(divEmailActions);
    } else if (isVerified) {
      $("<a href='#' class='email-action'/>")
        .text("Make primary")
        .click(function() { /* TODO */ return false; })
        .appendTo(divEmailActions);
    } else {
      $("<a href='#' class='email-action'/>")
        .text("Verify")
        .click(function() { /* TODO */ return false; })
        .appendTo(divEmailActions);
    }
    $("<span class='vertical-divider'/>")
      .text("|")
      .appendTo(divEmailActions);
    $("<a href='#' class='email-action'/>")
      .text("Remove")
      .click(function() { /* TODO */ return false; })
      .appendTo(divEmailActions);

    $("<div class='primary-label primary-label-mobile unselectable'/>")
      .text("PRIMARY")
      .appendTo(divEmailRowContent);
    $("<div class='email-address primary ellipsis'/>")
      .text(email)
      .appendTo(divEmailRowContent);
    var divEmailActionsMobile =
      $("<div class='email-actions email-actions-mobile'/>")
        .appendTo(divEmailRow);
    $("<a href='#' class='email-action'/>")
      .text("Remove")
      .click(function() { /* TODO */ return false; })
      .appendTo(divEmailActionsMobile);

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
      console.log("EA Profile: " + eaProf.toSource());
      api.getAccount(eaUID).done(function(eaAccount) {
        assistantAccount = eaAccount;
        console.log("EA Account: " + eaAccount.toSource());
        namePrefixSel = displayNamePrefixes($("#settings-name-prefix"),
          eaProf.gender, eaProf.prefix);
        var fullName = eaProf.full_name;
        $("#settings-profile-circ").text(fullName[0]);
        $("#settings-full-name").val(fullName);
        $("#settings-familiar-name").val(eaProf.familiar_name);
        $("#settings-form-of-address").val(eaProf.form_of_address);
        $("#settings-signature").val(eaProf.signature);
        var emailView = $("#settings-emails");
        emailView.children().remove();
        var primary = eaAccount.primary_email;
        displayEmail(emailView, primary, true, true);
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
    $("#settings-form-of-address").on("input", enableButton);
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
    var formOfAddress = $("#settings-form-of-address").val();
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
          api.changePassword(myUID, myUID, password);
      }
    }

    maybeChangePassword.done(function() {
      var profileEdit = {
        profile_uid: assistantProfile.profile_uid,
        familiar_name: familiarName,
        full_name: fullName,
        form_of_address: formOfAddress,
        gender: assistantProfile.gender,
        prefix: prefix//,
        //signature: signature
      };
      api.postProfile(profileEdit).done(function() {
        api.getProfile(assistantProfile.profile_uid).done(function(prof) {
          assistantProfile = prof;
          console.log("Edited: " + prof.toSource());
          profile.set(prof);
          settings.load();
        });
      });
    });
  }

  mod.load = function() {
    console.log("settings.load");
    displayAssistantProfile(login.me());
    var teams = login.getTeams();
    var leaderUIDs = list.map(teams, function(team) {
      return team.team_leaders[0];
    });
    displayExecutives(leaderUIDs);
    disableUpdateButtonUntilModified();
    $("#settings-update-account").off("click");
    $("#settings-update-account").one("click", updateAssistantProfile);
  };

  return mod;
}());
