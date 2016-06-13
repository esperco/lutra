/*
  Module for actions that create or alter groups
*/

/// <reference path="./Labels.ts" />
/// <reference path="./Queue2.ts" />
/// <reference path="./Save.ts" />
/// <reference path="./Stores.Groups.ts" />
/// <reference path="./Stores.Profiles.ts" />
/// <reference path="./Actions.Preferences.ts" />

module Esper.Actions.Groups {

  /* Grouop Creation */

  export interface GroupData {
    name: string;
    uid: string;
    groupMembers: ApiT.GroupMember[];
    groupIndividuals: ApiT.GroupIndividual[];
  }

  // Base group creation function
  function create(data: GroupData) {
    var p = Api.createGroup(data.uid, data.name).done((g) => {
      Stores.Groups.set(g);
      updateGroup(g.groupid, data);
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
      var newMembers = _.differenceBy(data.groupMembers,
        group.group_teams, (g) => g.teamid);
      var removedMembers = _.differenceBy(group.group_teams,
        data.groupMembers, (g) => g.teamid);
      var newIndividuals = _.differenceBy(data.groupIndividuals,
        group.group_individuals, (g) => g.email);
      var removedIndividuals = _.differenceBy(group.group_individuals,
        data.groupIndividuals, (g) => g.email);

      group = _.cloneDeep(group);
      var p1 = group.group_name !== data.name ?
        [Api.renameGroup(group.groupid, data.name)] : [];
      group.group_name = data.name;
      group.group_teams = data.groupMembers;
      group.group_individuals = data.groupIndividuals;

      var p2 = _.map(newMembers, function(member: ApiT.GroupMember) {
        return Api.putGroupMember(groupId, member.teamid);
      });

      var p3 = _.map(removedMembers, function(member: ApiT.GroupMember) {
        return Api.removeGroupMember(groupId, member.teamid);
      });

      var p4 = _.map(removedIndividuals, function(gim: ApiT.GroupIndividual) {
        return Api.removeGroupIndividual(groupId, gim.uid);
      });

      /*
        (Re-)clone group because we'll be push an initial version of the group
        to the store and that will be frozen by the time promise resolves
      */
      var group2 = _.cloneDeep(group);
      var p5 = _.map(newIndividuals, function(gim: ApiT.GroupIndividual) {
        return Api.putGroupIndividualByEmail(groupId, gim.email, {
          role: gim.role
        }).then((res) => {
          var gim = _.find(group2.group_individuals, { email: res.email });
          gim.uid = res.uid;
        });
      });

      var p = $.when.apply($,
        _.concat<JQueryPromise<any>>(p1, p2, p3, p4, p5)
      ).then(() => Option.wrap(group2));
      Stores.Groups.GroupStore.pushFetch(groupId, p, Option.wrap(group));
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
