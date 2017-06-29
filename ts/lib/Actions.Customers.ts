/*
  (Enterprise) Customer related actions
*/

/// <reference path="./Api.ts" />
/// <reference path="./Stores.Customers.ts" />
/// <reference path="./Stores.Teams.ts" />

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

    // If existing team, update store
    Stores.Teams.get(teamId).match({
      none: () => null,
      some: (t) => {
        t = _.cloneDeep(t);
        let {
          active, plan, status, valid_payment_source
        } = customer.subscription;
        t.team_api.team_subscription = {
          teamid: teamId,
          cusid: cusId,
          active, plan, status, valid_payment_source
        }
        Stores.Teams.TeamStore.push(teamId, p, Option.some(t));
      }
    });

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

  // Supply a billing e-mail to add a team to a customer
  export function addTeamByEmail(teamId: string, email: string) {
    return Api.requestCustomerSeat(teamId, email)
      .then((r) => {

        // Accepted -> refresh so team subscription info is updated
        if (r.seat_request_status === "Accepted") {
          location.reload(false);
        }

        // Rejected -> move to error path
        else if (r.seat_request_status === "Rejected") {
          return $.Deferred<ApiT.CustomerRequestSeatResponse>()
            .reject().promise();
        }

        // Else pending -> return as success so UI can respond appropriately
        return r;
      });
  }
}
