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

module Esper.Stores.Customers {

  /* Stores */
  export var CustomerStore = new Model2.Store<string, ApiT.Customer>({
    idForData: (customer) => customer.id
  });

  // Only store key for current user (which must be empty string)
  type BatchKeyType = "";
  var batchKey: BatchKeyType = "";
  export var CustomerListStore = new Model2.BatchStore
    <BatchKeyType, string, ApiT.Customer>(CustomerStore);


  /* Helper Functions */

  export function get(custId: string): Option.T<ApiT.Customer> {
    return CustomerStore.get(custId).flatMap((t) => t.data);
  }

  // Like get, but logs error if customer doe not exist
  export function require(custId: string): ApiT.Customer {
    return get(custId).match({
      none: (): ApiT.Customer => {
        Log.e("Customers.require called with non-existent customer - " +
              custId);
        CustomerStore.setSafe(custId, Option.none<ApiT.Customer>(), {
          dataStatus: Model2.DataStatus.PUSH_ERROR
        });
        return null;
      },
      some: (t) => t
    })
  }

  export function status(custId: string): Option.T<Model2.DataStatus> {
    return CustomerStore.get(custId).flatMap((t) => Option.wrap(t.dataStatus));
  }

  export function all(): ApiT.Customer[] {
    return CustomerListStore.batchGet(batchKey).match({
      none: (): ApiT.Customer[] => [],
      some: (d) => d.data.match({
        none: (): ApiT.Customer[] => [],
        some: (items) => Option.flatten(_.map(items, (i) => i.data))
      })
    });
  }

  export function allIds(): string[] {
    return CustomerListStore.get(batchKey).match({
      none: () => [],
      some: (d) => d.data.match({
        none: () => [],
        some: (ids) => ids
      })
    });
  }

  export function first(): ApiT.Customer {
    return all()[0];
  }

  export function firstId(): string {
    return allIds()[0];
  }


  //////////

  export function set(cust: ApiT.Customer): string {
    CustomerStore.setSafe(cust.id, Option.wrap(cust));

    var currentIds = _.clone(allIds());
    currentIds.push(cust.id);
    currentIds = _.uniq(currentIds);
    CustomerListStore.setSafe(batchKey, Option.some(currentIds));

    return cust.id;
  }

  export function remove(custId: string) {
    CustomerStore.remove(custId);

    var currentIds = _.clone(allIds());
    _.pull(currentIds, custId);
    CustomerListStore.setSafe(batchKey, Option.some(currentIds));
  }

  // Display name for customer -> fall back to e-mail address
  export function getDisplayName(cust: ApiT.Customer): string {
    return cust.name || cust.primary_contact.email;
  }


  /* Init helpers */

  export function loadFromLoginInfo(loginResponse: ApiT.LoginResponse) {
    // TODO

    // Temp fixture for dev / testing
    Customers.set({
      id: "cust-id",
      name: "Test Customer",
      primary_contact: { uid: "uid", email: "email@example.com" },
      secondary_contacts: [],
      seats: [],
      seat_requests: [],
      filter: {
        cusid: "cust-id",
        blacklist: {
          addresses: [],
          domains: []
        },
        whitelist: {
          addresses: [],
          domains: []
        }
      }
    });
  }

  export function init() {
    Login.promise.done(loadFromLoginInfo);
  }
}
