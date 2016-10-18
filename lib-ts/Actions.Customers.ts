/*
  (Enterprise) Customer related actions
*/

/// <reference path="./Api.ts" />
/// <reference path="./Stores.Customers.ts" />

module Esper.Actions.Customers {
  export function acceptSeat(cusId: string, teamId: string) {
    let p = Api.acceptCustomerSeat(cusId, teamId);

    let customer = Stores.Customers.require(cusId);
    customer = _.cloneDeep(customer);

    let seats = _.remove(customer.seat_requests, (r) => r.teamid === teamId);
    if (! _.isEmpty(seats)) {
      let seat = seats[0];
      customer.seats.push(seat);
    }

    Stores.Customers.CustomerStore.push(cusId, p, Option.some(customer));
    return p;
  }

  export function rejectSeat(cusId: string, teamId: string) {
    let p = Api.rejectCustomerSeat(cusId, teamId);

    let customer = Stores.Customers.require(cusId);
    customer = _.cloneDeep(customer);
    _.remove(customer.seat_requests, (r) => r.teamid === teamId);
    _.remove(customer.seats, (r) => r.teamid === teamId);

    Stores.Customers.CustomerStore.push(cusId, p, Option.some(customer));
    return p;
  }

  export function setDomainWhitelist(cusId: string, domains: string[]) {
    let customer = Stores.Customers.require(cusId);
    customer = _.cloneDeep(customer);
    customer.filter.whitelist.domains = domains;

    let p = Api.setCustomerFilter(cusId, customer.filter);
    Stores.Customers.CustomerStore.push(cusId, p, Option.some(customer));

    return p;
  }
}
