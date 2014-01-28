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

  function displayExecutive(execUID) {
    var view = $("#settings-executives");
    view.children().remove();
    var row = $("<div class='exec-row clearfix'/>");
    api.getProfile(execUID)
      .done(function(execProf) {
        var name = execProf.full_name;
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
        gear.click(function() { $(".exec-settings-modal").modal({}); });
        $("<img class='svg exec-settings' src='/assets/img/settings.svg'/>")
          .appendTo(gear);
        gear.appendTo(row);
        var details = $("<div class='exec-details'/>");
        $("<div class='exec-name ellipsis'/>")
          .text(name)
          .appendTo(details);
        $("<div class='exec-email ellipsis'/>")
          .text(execProf.signup_email)
          .appendTo(details);
        details.appendTo(row);
        row.appendTo(view);
        displayNoMoreExecs();
      });
  }

  function displayAssistantProfile(eaUID) {
    console.log("settings.displayAssistantProfile");
    api.getProfile(eaUID)
      .done(function(eaProf) {
        assistantProfile = eaProf;
        console.log(eaProf.toSource());
        displayNamePrefixes(eaProf.gender);
        var fullName = eaProf.full_name;
        $("#settings-profile-circ").text(fullName[0]);
        $("#settings-full-name").val(fullName);
        $("#settings-familiar-name").val(eaProf.familiar_name);
        $("#settings-username").val(login.data.email);
        $("#settings-other-email").val(eaProf.signup_email);
      });
  }

  function disableUpdateButtonUntilModified() {
    var updateButton = $("#settings-update-account");
    updateButton.prop("disabled", true);
    var enableButton = function() { updateButton.prop("disabled", false); };
    $("#settings-full-name").on("input", enableButton);
    $("#settings-familiar-name").on("input", enableButton);
    $("#settings-form-of-address").on("input", enableButton);
    $("#settings-other-email").on("input", enableButton);
    var password = $("#settings-password");
    password.on("input", enableButton);
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

    if (password != "") {
      if (password != confirmPassword) {
        // Shouldn't happen unless util.afterTyping got faked out...
        alert("Password does not match confirmation!");
      } else {
        // TODO Update the password
      }
    }

    var profileEdit = {
      profile_uid: assistantProfile.profile_uid,
      familiar_name: familiarName,
      full_name: fullName,
      form_of_address: formOfAddress,
      gender: assistantProfile.gender,
      prefix: prefix
    };
    api.postProfile(profileEdit).done(settings.load);
  }

  mod.load = function() {
    console.log("settings.load");
    displayAssistantProfile(login.me());
    displayExecutive(login.leader());
    disableUpdateButtonUntilModified();
    $("#settings-update-account").one("click", updateAssistantProfile);
  };

  return mod;
}());
