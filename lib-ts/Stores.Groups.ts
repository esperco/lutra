/*
  Refactored module for storing team data, along with helpers.
  Helpers for getting and setting current team info
*/

/// <reference path="./Model2.Batch.ts" />
/// <reference path="./Api.ts" />
/// <reference path="./ApiT.ts" />
/// <reference path="./Option.ts" />
/// <reference path="./Util.ts" />
/// <reference path="./Login.Web.ts" />

module Esper.Stores.Groups {

  /* Stores */

  export var GroupStore = new Model2.Store<string, ApiT.Group>({
    idForData: (group) => group.groupid
  });

  // Only store key for current user (which must be empty string)
  type BatchKeyType = "";
  var batchKey: BatchKeyType = "";
  export var GroupListStore = new Model2.BatchStore
    <BatchKeyType, string, ApiT.Group>(GroupStore);


  /* Helper Functions */

  export function get(groupId: string): Option.T<ApiT.Group> {
    return GroupStore.get(groupId).flatMap((t) => t.data);
  }

  // Like get, but logs error if group doe not exist
  export function require(groupId: string): ApiT.Group {
    return get(groupId).match({
      none: (): ApiT.Group => {
        Log.e("Groups.require called with non-existent group - " + groupId);
        GroupStore.setSafe(groupId, Option.none<ApiT.Group>(), {
          dataStatus: Model2.DataStatus.PUSH_ERROR
        });
        return null;
      },
      some: (t) => t
    })
  }

  export function status(groupId: string): Option.T<Model2.DataStatus> {
    return GroupStore.get(groupId).flatMap((t) => Option.wrap(t.dataStatus));
  }

  export function all(): ApiT.Group[] {
    return GroupListStore.batchGet(batchKey).match({
      none: (): ApiT.Group[] => [],
      some: (d) => d.data.match({

        none: (): ApiT.Group[] => [],
        some: (items) => Option.flatten(_.map(items, (i) => i.data))
      })
    });
  }

  export function allIds(): string[] {
    return GroupListStore.get(batchKey).match({
      none: () => [],
      some: (d) => d.data.match({
        none: () => [],
        some: (ids) => ids
      })
    });
  }

  export function first(): ApiT.Group {
    return all()[0];
  }

  export function firstId(): string {
    return allIds()[0];
  }


  //////////

  export function set(group: ApiT.Group): string {
    GroupStore.setSafe(group.groupid, Option.wrap(group));

    var currentGroupIds = _.clone(allIds());
    currentGroupIds.push(group.groupid);
    currentGroupIds = _.uniq(currentGroupIds);
    GroupListStore.setSafe(batchKey, Option.some(currentGroupIds));

    return group.groupid;
  }

  export function remove(groupId: string) {
    GroupStore.remove(groupId);

    var currentGroupIds = _.clone(allIds());
    _.pull(currentGroupIds, groupId);
    GroupListStore.setSafe(batchKey, Option.some(currentGroupIds));
  }


  //////////

  // Find the normalized form of a group label
  export function getNormLabel(label: string) {
    var groups = all();
    for (let i in groups) {
      var group = groups[i];

      for (let j in group.group_labels) {
        if (group.group_labels[j] === label) {
          return group.group_labels_norm[j];
        }
      }
    }

    // No match, default to lowercase and trimming
    return label.toLowerCase().trim();
  }


  /* Init helpers */

  export function loadFromLoginInfo(loginResponse: ApiT.LoginResponse) {
    // Initialize the data store with stub data
    var data = _.map(loginResponse.groups, (groupid) => {
      var groupStub = {
        groupid,
        group_name: "Loading...",
        group_timezone: moment.tz.guess()
      };
      return {
        itemKey: groupid,
        data: Option.some(groupStub)
      };
    });
    GroupListStore.batchSet(batchKey, Option.some(data));

    // ...then fill it up with actual data when network fetch completes
    Api.batch(() => {
      var p = _.map(loginResponse.groups, (groupid) =>
        Api.getGroupDetails(groupid, { withMembers: true, withLabels: true })
      );
      Util.when(p).then((groups) => {
        var values = _.map(groups, (g) => ({
          itemKey: g.groupid,
          data: Option.wrap(g)
        }));
        GroupListStore.batchSet(batchKey, Option.some(values));
      });
    });
  }

  export function init() {
    Login.promise.done(loadFromLoginInfo);
  }
}
