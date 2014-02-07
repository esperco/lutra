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
    var pseudonym = $("#settings-exec-pseudonym").val();
    var name = null;
    if (pseudonym != "") {
      if (firstName != "" && lastName != "") {
        name = ["Both_names", [
          { first_name: firstName, last_name: lastName },
          pseudonym
        ]];
      } else {
        name = ["Pseudonym", pseudonym];
      }
    } else {
      name = ["First_last", { first_name: firstName, last_name: lastName }];
    }

    var profileEdit = {
      profile_uid: execProfile.profile_uid,
      prefix: prefix,
      name: name,
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
      console.log("Executive: " + execProf.toSource());
      api.getEmails(execUID, teamid).done(function(execEmails) {
        var firstName = "";
        var lastName = "";
        var pseudonym = "";
        var modalCirc = $("<div class='settings-modal-circ'/>");
        var modalTitle = $("#exec-settings-title");
        switch (execProf.name[0]) {
          case "First_last":
            firstName = execProf.name[1].first_name;
            lastName = execProf.name[1].last_name;
            modalCirc.text(firstName[0].toUpperCase());
            modalTitle.text("Settings for " + firstName);
            showFirstLastPseudonym();
            break;
          case "Pseudonym":
            pseudonym = execProf.name[1];
            modalCirc.text(pseudonym[0].toUpperCase());
            modalTitle.text("Settings for " + pseudonym);
            showOnlyPseudonym();
            break;
          case "Both_names":
            var firstLast = execProf.name[1][0];
            firstName = firstLast.first_name;
            lastName = firstLast.last_name;
            pseudonym = execProf.name[1][1];
            modalCirc.text(pseudonym[0].toUpperCase());
            modalTitle.text("Settings for " + pseudonym);
            showFirstLastPseudonym();
            break;
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
        displayEmailAdd(emailView, execUID, teamid, function() {
          execSettingsModal(execUID, teamid);
        });
        $("#exec-settings-save").off("click");
        $("#exec-settings-save").one("click", function() {
          updateExecProfile(teamid);
        });
        $(".exec-settings-modal").modal({});
      });
    });
  }

  function displayExecutives(leaders) {
    var view = $("#settings-executives");
    view.children().remove();
    var uniqUIDs = util.arrayUnique(Object.keys(leaders));
    profile.mget(uniqUIDs).done(function(execProfs) {
      list.iter(execProfs, function(execProf) {
        var prof = execProf.prof;
        var teamid = leaders[prof.profile_uid];
        api.getEmails(prof.profile_uid, teamid).done(function(execEmails) {
          var primaryOnly =
            execEmails.filter(function(e) { return e.email_primary; });
          var primaryEmail = primaryOnly[0].email;
          var row = $("<div class='exec-row clearfix'/>");
          var name = "";
          var pseudonym = "";
          var profCirc = $("<div class='settings-prof-circ'/>");
          switch (prof.name[0]) {
            case "First_last":
              name = prof.name[1].first_name + " " + prof.name[1].last_name;
              profCirc.text(name[0].toUpperCase());
              break;
            case "Pseudonym":
              pseudonym = prof.name[1];
              profCirc.text(pseudonym[0].toUpperCase());
              break;
            case "Both_names":
              var firstLast = prof.name[1][0];
              name = firstLast.first_name + " " + firstLast.last_name;
              pseudonym = prof.name[1][1];
              profCirc.text(pseudonym[0].toUpperCase());
              break;
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
          $("<img class='svg exec-settings' src='/assets/img/settings.svg'/>")
            .appendTo(gear);
          gear.appendTo(row);
          var details = $("<div class='exec-details'/>");
          $("<div class='exec-name ellipsis'/>")
            .text(pseudonym ? pseudonym : name)
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
      asstProfile = eaProf;
      console.log("Assistant: " + asstProfile.toSource());
      var teamid = login.getTeam().teamid;
      api.getEmails(eaUID, teamid).done(function(eaEmails) {
        asstNamePrefixSel = displayNamePrefixes($("#settings-name-prefix"),
          eaProf.gender, eaProf.prefix);
        switch (eaProf.name[0]) {
          case "First_last":
            var firstName = eaProf.name[1].first_name;
            $("#settings-profile-circ").text(firstName[0].toUpperCase());
            $("#settings-first-name").val(eaProf.name[1].first_name);
            $("#settings-last-name").val(eaProf.name[1].last_name);
            break;
          case "Pseudonym":
            /* EAs don't normally have pseudonyms, except for test accounts
               named after email addresses */
            $("#settings-profile-circ").text(eaProf.name[1][0].toUpperCase());
            break;
          case "Both_names":
            // TODO Display some kind of error? We don't allow this for EAs
            break;
        }
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
    var name = ["First_last", { first_name: firstName, last_name: lastName }];

    var profileEdit = {
      profile_uid: asstProfile.profile_uid,
      prefix: prefix,
      name: name,
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

  mod.load = function() {
    displayAssistantProfile(login.me());
    var teams = login.getTeams();
    var mapping = {};
    var leaders = list.iter(teams, function(team) {
      mapping[team.team_leaders[0]] = team.teamid;
    });
    displayExecutives(mapping);
    disableUpdateButtonsUntilModified();
    $("#settings-update-name").off("click");
    $("#settings-update-name").one("click", updateAssistantName);
    $("#settings-update-password").off("click");
    $("#settings-update-password").one("click", updateAssistantPassword);
  };

  return mod;
}());
