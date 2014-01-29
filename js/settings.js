/*
  Settings Page
*/

var settings = (function() {
  var mod = {};

  var malePrefixes = ["Mr."];
  var femalePrefixes = ["Ms.", "Mrs.", "Miss"];
  var commonPrefixes = ["Dr.", "Prof."];

  var assistantProfile = null;
  var namePrefixSel = null;

  function displayNamePrefixes(gender) {
    var view = $("#settings-name-prefix");
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
      defaultAction: function() { $("#settings-update-account").prop("disabled", false); }
    });
    prefixSel.view.appendTo(view);
    namePrefixSel = prefixSel;
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

  function execSettingsModal(execUID) {
    api.getProfile(execUID)
      .done(function(execProf) {
        var fullName = execProf.full_name;
        var familiarName = execProf.familiar_name;
        $("#exec-settings-title").text("Settings for " + familiarName);
        $("#settings-modal-circ").text(fullName[0]);
        $("#settings-exec-full-name").val(fullName);
        $("#settings-exec-familiar-name").val(familiarName);
        $("#settings-exec-form-of-address").val(execProf.form_of_address);
        $(".exec-settings-modal").modal({});
      });
  }

  function displayExecutives(execUIDs) {
    var view = $("#settings-executives");
    view.children().remove();
    var uniqUIDs = util.arrayUnique(execUIDs);
    console.log(uniqUIDs.toSource());
    profile.mget(uniqUIDs)
      .done(function(execProfs) {
        list.iter(execProfs, function(execProf) {
          var prof = execProf.prof;
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
            .text(prof.signup_email)
            .appendTo(details);
          details.appendTo(row);
          row.appendTo(view);
        });
        displayNoMoreExecs();
      });
  }

  function displayAssistantProfile(eaUID) {
    $("#settings-password").val("");
    $("#settings-confirm-password").val("");
    api.getProfile(eaUID)
      .done(function(eaProf) {
        assistantProfile = eaProf;
        displayNamePrefixes(eaProf.gender);
        var fullName = eaProf.full_name;
        $("#settings-profile-circ").text(fullName[0]);
        $("#settings-full-name").val(fullName);
        $("#settings-familiar-name").val(eaProf.familiar_name);
        $("#settings-form-of-address").val(eaProf.form_of_address);
        $("#settings-email").val(eaProf.primary_email);
      });
  }

  function disableUpdateButtonUntilModified() {
    var updateButton = $("#settings-update-account");
    updateButton.prop("disabled", true);
    var enableButton = function() { updateButton.prop("disabled", false); };
    $("#settings-full-name").on("input", enableButton);
    $("#settings-familiar-name").on("input", enableButton);
    $("#settings-form-of-address").on("input", enableButton);
    $("#settings-email").on("input", enableButton);
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
    var password = $("#settings-password").val();
    var confirmPassword = $("#settings-confirm-password").val();

    var maybeChangePassword = deferred.defer(null);
    if (password != "") {
      if (password != confirmPassword) {
        // Shouldn't happen unless util.afterTyping got faked out...
        alert("Password does not match confirmation!");
      } else {
        maybeChangePassword =
          api.changePassword(assistantProfile.profile_uid, password);
      }
    }

    maybeChangePassword.done(function() {
      var profileEdit = {
        profile_uid: assistantProfile.profile_uid,
        familiar_name: familiarName,
        full_name: fullName,
        form_of_address: formOfAddress,
        gender: assistantProfile.gender,
        prefix: prefix
      };
      api.postProfile(profileEdit).done(settings.load);
    });
  }

  mod.load = function() {
    console.log("settings.load");
    console.log(login.data.toSource());
    displayAssistantProfile(login.me());
    var teams = login.getTeams();
    var leaderUIDs = list.map(teams, function(team) {
      return team.team_leaders[0];
    });
    console.log(leaderUIDs.toSource());
    displayExecutives(leaderUIDs);
    disableUpdateButtonUntilModified();
    $("#settings-update-account").one("click", updateAssistantProfile);
  };

  return mod;
}());
