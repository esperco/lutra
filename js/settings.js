/*
  Settings
*/

var settings = (function() {
  var mod = {};

  var malePrefixes = ["Mr."];
  var femalePrefixes = ["Ms.", "Mrs.", "Miss"];
  var commonPrefixes = ["Dr.", "Prof."];

  function displayNamePrefixes(gender) {
    var view = $("#settings-first-name-prefix");
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
    var prefixSel = select.create({ options: options });
    prefixSel.view.appendTo(view);
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
        console.log(eaProf.toSource());
        displayNamePrefixes(eaProf.gender);
        $("#settings-first-name").val(eaProf.full_name);
        $("#settings-preferred-name").val(eaProf.familiar_name);
        $("#settings-username").val(login.data.email);
        $("#settings-other-email").val(eaProf.signup_email);
      });
  }

  function disableUpdateButtonUntilModified() {
    var updateButton = $("#settings-update-account");
    updateButton.prop("disabled", true);
    var enableButton = function() { updateButton.prop("disabled", false); };
    $("#settings-first-name").on("input", enableButton);
    $("#settings-last-name").on("input", enableButton);
    $("#settings-preferred-name").on("input", enableButton);
    $("#settings-other-email").on("input", enableButton);
    $("#settings-password").on("input", enableButton);
    $("#settings-confirm-password").on("input", enableButton);
  }

  mod.load = function() {
    console.log("settings.load");
    displayAssistantProfile(login.me());
    displayExecutive(login.leader());
    disableUpdateButtonUntilModified();
  };

  return mod;
}());
