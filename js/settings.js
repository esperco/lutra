/*
  Settings Page
*/

var settings = (function() {
  var mod = {};

  var malePrefixes = ["Mr."];
  var femalePrefixes = ["Ms.", "Mrs.", "Miss"];
  var commonPrefixes = ["Dr.", "Prof."];

  var assistantProfile = null;
  var execProfile = null;
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
      api.getEmails(execUID, teamid).done(function(execEmails) {
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
        $("#pseudonym-option")
          .unbind("click")
          .click(function() {
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
        var ea = false;
        list.iter(execEmails, function(email) {
          displayEmail(emailView, ea, email, execUID, teamid, function() {
            execSettingsModal(execUID, teamid)
          });
        });
        displayEmailAdd(emailView, execUID, teamid, function() {
          execSettingsModal(execUID, teamid);
        });
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
          api.getEmails(prof.profile_uid, teamid).done(function(execEmails) {
            var primaryOnly =
              execEmails.filter(function(e) { return e.email_primary; });
            var primaryEmail = primaryOnly[0].email;
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
              .text(primaryEmail)
              .appendTo(details);
            details.appendTo(row);
            row.appendTo(view);
          });
        });
        displayNoMoreExecs();
      });
  }

  function displayEmail(view, ea, email, uid, teamid, done) {
    var divEmailRow = $("<div class='email-row clearfix'/>");
    var divEmailRowContent = $("<div class='email-row-content'/>")
      .appendTo(divEmailRow);

    if (ea) {
      $("<button class='btn btn-default edit-signature'/>")
        .text("Edit signature")
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

    divEmailRow.appendTo(view);
  }

  function displayEmailAdd(view, uid, teamid, done) {
    var divEmailAdd = $("<div class='input-group'/>");


    // var view = $("<div class='sched-step1-add-row'/>");

    // var hosts = sched.getHosts(task);
    // var adder = $("<div class='add-guest-circ'>");
    // var plus = $("<img id='plus-guest'/>");
    // plus.appendTo(adder);
    // svg.loadImg(plus, "/assets/img/plus.svg");

    // var addGuestDiv = $("<div/>");
    // var addGuestText = $("<a id='add-guest-text' class='unselectable'/>")
    //   .text("Add guest")
    //   .appendTo(addGuestDiv);


    $("<label for='email-add' class='text-field-label'/>")
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
      assistantProfile = eaProf;
      var teamid = login.getTeam().teamid;
      api.getEmails(eaUID, teamid).done(function(eaEmails) {
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
        var ea = true;
        list.iter(eaEmails, function(email) {
          displayEmail(emailView, ea, email, eaUID, teamid, mod.load);
        });
        displayEmailAdd(emailView, eaUID, teamid, mod.load);
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
          profile.set(prof);
          settings.load();
        });
      });
    });
  }

  mod.load = function() {
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
