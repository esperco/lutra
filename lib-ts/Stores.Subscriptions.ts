/*
  Stores long form of subscription data
*/

/// <reference path="./Model2.Batch.ts" />
/// <reference path="./Api.ts" />
/// <reference path="./ApiT.ts" />
/// <reference path="./Option.ts" />
/// <reference path="./Util.ts" />
/// <reference path="./Login.Web.ts" />

module Esper.Stores.Subscriptions {

  /* Stores */
  export var SubscriptionStore = new Model2.Store<
    string, ApiT.SubscriptionDetails
  >({
    idForData: (sub) => sub.cusid
  });


  /* Helper Functions */
  export function get(cusId: string): Option.T<ApiT.SubscriptionDetails> {
    return SubscriptionStore.get(cusId).flatMap((t) => t.data);
  }

  // Like get, but logs error if subscription Id doe not exist
  export function require(cusId: string): ApiT.SubscriptionDetails {
    return get(cusId).match({
      none: (): ApiT.SubscriptionDetails => {
        Log.e("Subscriptions.require called with non-existent cusId - " +
              cusId);
        SubscriptionStore.setSafe(cusId,
          Option.none<ApiT.SubscriptionDetails>(),
          { dataStatus: Model2.DataStatus.PUSH_ERROR }
        );
        return null;
      },
      some: (t) => t
    })
  }

  export function status(cusId: string): Option.T<Model2.DataStatus> {
    return SubscriptionStore.get(cusId)
      .flatMap((t) => Option.wrap(t.dataStatus));
  }


  //////////

  export function fetch(cusId: string, forceRefresh=false) {
    let shouldFetch = forceRefresh || SubscriptionStore.get(cusId).mapOr(
      true, (d) => d.dataStatus !== Model2.DataStatus.FETCHING &&
                   d.data.isNone());

    if (shouldFetch) {
      let p = Api.getSubscriptionStatusLong(cusId).then(
        (c) => Option.wrap(c),
        (err) => {
          /*
            This error happens because this team belongs to a Customer that
            the current user is not a contact for. Don't throw or log error.

            We can use status + get function above to determine whether
            we don't have access to Customer.
          */
          if (err.errorDetails === "User_not_customer_contact") {
            err.handled = true;
          }
        });
      SubscriptionStore.fetch(cusId, p);
    }
  }
}
