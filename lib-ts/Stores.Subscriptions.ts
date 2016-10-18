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
    let shouldFetch = forceRefresh || SubscriptionStore.get(cusId).match({
      none: () => true,
      some: (d) => d.dataStatus === Model2.DataStatus.FETCH_ERROR
    });

    if (shouldFetch) {
      let p = Api.getSubscriptionStatusLong(cusId).then((c) => Option.wrap(c));
      SubscriptionStore.fetch(cusId, p);
    }
  }
}
