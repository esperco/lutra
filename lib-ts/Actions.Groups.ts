/*
  Module for actions that create or alter groups
*/

/// <reference path="./Labels.ts" />
/// <reference path="./Queue2.ts" />
/// <reference path="./Save.ts" />
/// <reference path="./Stores.Groups.ts" />
/// <reference path="./Stores.Profiles.ts" />
/// <reference path="./Actions.TeamPreferences.ts" />

module Esper.Actions.Groups {

  /* Group Creation */

  export interface GroupData {
    name: string;
    uid: string;
    timezone: string;
  }

  // Base group creation function
  function create(data: GroupData) {
    var p = Api.createGroup(data.uid, {
      group_name: data.name,
      group_timezone: data.timezone
    }).done((g) => {
      Stores.Groups.set(g);
      return g;
    });
    Save.monitor(Stores.Groups.GroupStore, "new-group", p);
    return p;
  }

  /*
    Updates an existing group
  */
  export function updateGroup(groupId: string, data: GroupData) {
    var group = Stores.Groups.require(groupId);
    if (! group) return;

    // Clone group and set in store
    if (data.name) {
      group = _.cloneDeep(group);
      let promises: JQueryPromise<any>[] = []
      if (group.group_name !== data.name) {
        promises.push(Api.renameGroup(group.groupid, data.name));
      }
      if (group.group_timezone !== data.timezone) {
        promises.push(Api.putGroupTimezone(group.groupid, data.timezone));
      }
      group.group_name = data.name;
      group.group_timezone = data.timezone;

      var p = Util.when(promises);
      Stores.Groups.GroupStore.push(groupId, p, Option.wrap(group));
    };
  }

  export function createGroup(data: GroupData) {
    return create(data);
  }

  // Remove a group
  export function removeGroup(groupId: string) {
    Api.deleteGroup(groupId);
    Stores.Groups.remove(groupId);
  }


  /* Group member management */

  interface MemberUpdate {
    groupId: string;
    putMembers: ApiT.GroupMember[];
    delMembers: ApiT.GroupMember[];
    putGIMs: ApiT.GroupIndividual[];
    delGIMs: ApiT.GroupIndividual[];
  }

  var MemberUpdateQueue = new Queue2.Processor(
    function(update: MemberUpdate) {
      var p1 = _.map(update.putMembers, function(member) {
        return Api.putGroupMember(update.groupId, member.teamid);
      });
      var p2 = _.map(update.delMembers, function(member) {
        return Api.removeGroupMember(update.groupId, member.teamid);
      });
      var p3 = _.map(update.putGIMs, function(gim) {
        return Api.putGroupIndividualByEmail(update.groupId, gim.email)
          .then((res) => {
            // Assign UID to temporarily created GIM
            let group = _.cloneDeep(Stores.Groups.require(update.groupId));
            let oldGIM = _.find(group.group_individuals,
              (old) => old.email === gim.email
            );
            if (oldGIM) {
              oldGIM.uid = res.uid;
            } else {
              group.group_individuals.push(res);
            }
            Stores.Groups.GroupStore.set(update.groupId, Option.some(group));
          });
      });
      var p4 = _.map(update.delGIMs, function(gim) {
        if (! gim.uid) { // No UID => try checking store
          let group = Stores.Groups.require(update.groupId);
          gim = _.find(group.group_individuals, (g) =>
            g.uid &&
            g.email === gim.email
          );
          if (! gim) {
            Log.e("No UID when trying to delete");
            return $.Deferred<any>().reject().promise();
          }
        }
        return Api.removeGroupIndividual(update.groupId, gim.uid);
      });

      return Util.when(_.concat(p1, p2, p3, p4));
    },

    // Merge requests by groupId
    function(requests) {
      var next = requests.shift();

      // Merge requests. Should be keyed be groupId so okay to merge
      _.each(requests, (r) => {

        /*
          Not the most efficicent algorithm - O(n^2), but we expect the number
          of queued put and dels to be low. Revisit if we add some way to
          add 200 members at once or something.
        */
        _.each(r.putMembers, (m) => {
          _.remove(next.putMembers, (n) => n.email === m.email);
          _.remove(next.delMembers, (n) => n.email === m.email);
          next.putMembers.push(m);
        });

        _.each(r.delMembers, (m) => {
          _.remove(next.putMembers, (n) => n.email === m.email);
          _.remove(next.delMembers, (n) => n.email === m.email);
          next.delMembers.push(m);
        });

        _.each(r.putGIMs, (gim) => {
          _.remove(next.putGIMs, (i) => i.email === gim.email);
          _.remove(next.delGIMs, (i) => i.email === gim.email);
          next.putGIMs.push(gim);
        });

        _.each(r.delGIMs, (gim) => {
          _.remove(next.putGIMs, (i) => i.email === gim.email);
          _.remove(next.delGIMs, (i) => i.email === gim.email);
          next.delGIMs.push(gim);
        });
      });

      return [next];
    });


  export function addEmail(groupId: string, email: string) {
    let group = _.cloneDeep(Stores.Groups.require(groupId));
    let update: MemberUpdate = {
      groupId: groupId,
      putMembers: [],
      delMembers: [],
      putGIMs: [],
      delGIMs: []
    };

    if (! _.find(group.group_teams, (t) => t.email === email)) {
      let team = _.find(Stores.Teams.all(), (t) => {
        return Stores.Profiles.get(t.team_executive).match({
          none: () => false,
          some: (exec) => exec.email === email
        });
      });

      if (team) {
        let newMember = {
          email,
          teamid: team.teamid,
          name: team.team_name
        };
        group.group_teams.push(newMember);
        update.putMembers.push(newMember);
      }

      else if (! _.find(group.group_individuals, (i) => i.email === email)) {
        let newGIM = { email, role: "Member" as ApiT.GroupRole };
        group.group_individuals.push(newGIM);
        update.putGIMs.push(newGIM);
      }

      let p = MemberUpdateQueue.enqueue(groupId, update);
      Stores.Groups.GroupStore.push(groupId, p, Option.wrap(group));
    }
  }

  export function removeEmail(groupId: string, email: string) {
    let group = _.cloneDeep(Stores.Groups.require(groupId));
    let update: MemberUpdate = {
      groupId: groupId,
      putMembers: [],
      delMembers: [],
      putGIMs: [],
      delGIMs: []
    };

    let rmGim = _.remove(group.group_individuals,
      (gim) => gim.email === email)[0];
    let rmMember = _.remove(group.group_teams,
      (member) => member.email === email)[0];

    if (rmGim) {
      update.delGIMs.push(rmGim);
    }
    if (rmMember) {
      update.delMembers.push(rmMember);
    }

    let p = MemberUpdateQueue.enqueue(groupId, update);
    Stores.Groups.GroupStore.push(groupId, p, Option.wrap(group));
  }

  export function changeRole(
    groupId: string, email: string, role: ApiT.GroupRole
  ) {
    let group = _.cloneDeep(Stores.Groups.require(groupId));
    let gim = _.find(group.group_individuals,
      (g) => g.email === email);
    if (gim) {
      gim.role  = role;
    } else {
      gim = { email, role };
      group.group_individuals.push(gim);
    }

    let p = MemberUpdateQueue.enqueue(groupId, {
      groupId: groupId,
      putMembers: [],
      delMembers: [],
      putGIMs: [gim],
      delGIMs: []
    });
    Stores.Groups.GroupStore.push(groupId, p, Option.wrap(group));
  }

  export function toggleCalendar(groupId: string, email: string) {
    let group = _.cloneDeep(Stores.Groups.require(groupId));
    let update: MemberUpdate = {
      groupId: groupId,
      putMembers: [],
      delMembers: [],
      putGIMs: [],
      delGIMs: []
    };

    // Existing team => remove
    let existingTeam = _.find(group.group_teams, (t) => t.email === email);
    if (existingTeam) {
      _.remove(group.group_teams, (t) => t.email === email);
      update.delMembers.push(existingTeam);

      // Add GIM if necessary (and possible)
      if (! _.find(group.group_individuals, (t) => t.email === email)) {
        let selfGim = _.find(group.group_individuals,
          (i) => i.uid === Login.me());
        if (selfGim) {
          let gim: ApiT.GroupIndividual = { email, role: "Member" };
          group.group_individuals.push(gim);
          update.putGIMs.push(gim);
        }
      }
    }

    // Create new group team
    else {
      let team = _.find(Stores.Teams.all(), (t) =>
        Stores.Profiles.get(t.team_executive).match({
          none: () => false,
          some: (e) => e.email === email
        })
      );
      if (team) {
        let newMember = {
          email,
          teamid: team.teamid,
          name: team.team_name
        };
        group.group_teams.push(newMember);
        update.putMembers.push(newMember);
      } else {
        Log.e("Tried to toggle calendar for non-existent team - " + email);
      }
    }

    let p = MemberUpdateQueue.enqueue(groupId, update);
    Stores.Groups.GroupStore.push(groupId, p, Option.wrap(group));
  }


  /* Group label management */

  // Add and remove exact, display versions of labels
  export function addLabel(_id: string, label: string) {
    return applyLabels(_id, [], [label]);
  }

  export function rmLabel(_id: string, label: string) {
    return applyLabels(_id, [label], []);
  }

  export function renameLabel(_id: string, oldLabel: string, newLabel: string)
  {
    return applyLabels(_id, [oldLabel], [newLabel]);
  }


  /////

  interface LabelUpdate {
    groupId: string;
    labels: string[];
  }

  export var LabelUpdateQueue = new Queue2.Processor(
    function(update: LabelUpdate) {
      Analytics.track(Analytics.Trackable.SetTimeStatsLabels, {
        numLabels: update.labels.length,
        _id: update.groupId,
        labels: update.labels
      });

      return Api.putGroupLabels(update.groupId, { items: update.labels });
    },

    // Always use last update (put operation)
    function(updates) {
      return [updates[updates.length - 1]];
    });

  function applyLabels(_id: string, rmLabels: string[], addLabels: string[]) {
    var group = Stores.Groups.require(_id);
    if (! group) return;

    var newLabels = _.filter(group.group_labels,
      (l) => !_.includes(rmLabels, l)
    );
    newLabels = newLabels.concat(addLabels);

    // Remove duplicates based on normalization
    newLabels = _.uniqBy(newLabels, Stores.Groups.getNormLabel);

    return setGroupLabels(_id, group, newLabels);
  }

  export function putLabels(_id: string, labels: string[]) {
    var group = Stores.Groups.require(_id);
    if (! group) return;

    if (_.isEqual(group.group_labels, labels)) {
      return $.Deferred<void>().resolve().promise();
    }

    return setGroupLabels(_id, group, labels);
  }

  function setGroupLabels(_id: string, group: ApiT.Group, labels: string[]) {
    // Store values immutable so clone
    var groupCopy = _.cloneDeep(group);

    /*
      Alphabetize when setting labels (better performance to sort now
      than in the gajillion places where we pull a list of group labels)
    */
    labels = _.sortBy(labels, Labels.normalizeForSort);

    groupCopy.group_labels = labels;
    groupCopy.group_labels_norm = _.map(labels, Stores.Groups.getNormLabel);

    var p = LabelUpdateQueue.enqueue(_id, {
      groupId: _id,
      labels: labels
    });
    Stores.Groups.GroupStore.push(_id, p, Option.some(groupCopy));
    return p;
  }
}
