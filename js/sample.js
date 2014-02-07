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
    first_last : ["Robin", "Kaufman"],
    contact_email : "robin@formation8.com"
  };

  mod.joe = {
    profile_uid : joe_uid,
    username : "joe",
    first_last : ["Joe", "Lonsdale"],
    contact_email : "jlonsdale@gmail.com"
  };

  mod.login = {
    uid: mod.robin.profile_uid,
    team: mod.team_lonsdale,
    teams: [mod.team_lonsdale],
    api_secret: "d08dec3a355773409da117b739eb4d37"
  };

  return mod;
}());
