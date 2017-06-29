module Esper.Actions.Assistants {
  // Adding a user currently doesn't affect team structure, so just return
  // API promise
  export function add(teamId: string, email: string) {
    return Api.inviteJoinTeam({
      from_uid: Login.myUid(),
      teamid: teamId,
      role: "Assistant",
      force_email: email
    });
  }

  // Removes an assistant from team
  export function remove(teamId: string, uid: string) {
    var team = Stores.Teams.require(teamId);
    if (! team) return;

    team = _.cloneDeep(team);
    _.pull(team.team_assistants, uid);

    var newOwnerId = getNewOwnerId(team, uid);
    if (!newOwnerId && (team.team_owner === uid ||
                        team.team_cal_user === uid))
    {
      // Unable to fill replacement owner -> treat as team deactivation instead
      return Actions.Teams.removeTeam(teamId);
    }

    var p = (function() {

      // Cannot remove team executive
      if (team.team_executive === uid) {
        var errMsg = `Cannot remove team exec - ${teamId} - ${uid}`;
        Log.e(errMsg);
        return $.Deferred<void[]>().reject(errMsg).promise();
      }

      // Removing team owner => try to change
      var promises: JQueryPromise<void>[] = [];
      if (team.team_owner === uid) {
        team.team_owner = newOwnerId;
        promises.push(Api.setTeamOwner(teamId, newOwnerId));
      }

      // Remove calendar user => try to change
      if (team.team_cal_user === uid) {
        team.team_cal_user = newOwnerId;
        promises.push(Api.setTeamCalUser(teamId, newOwnerId));
      }

      return Util.when(promises);
    })().then(function() {
      return Api.removeAssistant(teamId, uid);
    });

    Stores.Teams.TeamStore.push(teamId, p, Option.some(team));
  }

  function getNewOwnerId(team: ApiT.Team, uidToRemove: string) {
    if (team.team_approved && uidToRemove !== team.team_executive) {
      return team.team_executive;
    }

    /*
      NB: Currently not possible to remove self, but we might allow this
      in future
    */
    else if (uidToRemove !== Login.myUid()) {
      return Login.myUid();
    }

    // Crapshoot. Return first assistant that isn't being removed.
    else {
      return _.find(team.team_assistants,
        (a) => a !== uidToRemove && a !== team.team_executive
      );
    }
  }
}

