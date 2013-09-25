/*
  Sample data that eventually should be returned by the API only
*/

var sample = (function() {
  var mod = {};

  var robin_uid = "PkUaGeQstJ64Vwz__u01_w";
  var joe_uid = "PkUumYKplkzjT5A__u02_w";

  mod.team_lonsdale = {
    teamid: "PlI4tnhhrg3AyCm__a01_w",
    teamname: "lonsdale",
    team_owners: [joe_uid, robin_uid],
    team_organizers: [robin_uid],
    team_leaders: [joe_uid]
  };

  mod.robin = {
    profile_uid : robin_uid,
    username : "robin",
    familiar_name : "Robin",
    full_name : "Robin Kaufman",
    contact_email : "robin@formation8.com"
  };

  mod.joe = {
    profile_uid : joe_uid,
    username : "joe",
    familiar_name : "Joe",
    full_name : "Joe Lonsdale",
    contact_email : "jlonsdale@gmail.com"
  };

  return mod;
}());
