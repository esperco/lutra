/*
  Settings
*/

var settings = (function() {
  var mod = {};

  function displayTeamLeader() {
    api.getProfile(login.leader())
      .done(function(execProfile) {
        console.log(execProfile.toSource());
        $(".exec-name").text(execProfile.full_name);
        // TODO exec email
      });
  }

  mod.load = function() {
    console.log(login.data.toSource());
    var data = login.data;
    var eaProfile = data.profile;
    $("#first-name").val(eaProfile.full_name);
    $("#preferred-name").val(eaProfile.familiar_name);
    $("#esper-email").val(data.email);
    displayTeamLeader();
  };

  return mod;
}());
