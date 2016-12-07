/*
  Checks if redemption code is applicable. Quick and hacky.
*/

/// <reference path="./LocalStore.ts" />

module Esper.Redeem {
  export function checkExtendedTrial() {
    let ret = LocalStore.get("one-month-code");
    if (!ret || !ret.code) return null;

    // Expire after one month (in case we forget to remove this code later)
    if (ret.redeemed &&
        (new Date()).getTime() - ret.redeemed > 31 * 24 * 60 * 60 * 1000) {
      return null;
    }

    if (! ret.redeemed) {
      LocalStore.set("one-month-code", {
        code: ret.code,
        redeemed: (new Date()).getTime()
      });
    }

    return ret ? ret.code : null;
  }

  export const ExtendedTrialHeading = "You're getting a free month of Esper";
  export const ExtendedTrialDescription = "Select an option below to " +
    "start your free trial.";

  export function ExtendedTrialMsg({}: {}) {
    if (checkExtendedTrial()) {
      return <div className="alert alert-success">
        Your code entitles you to a free one-month trial of Esper!
      </div>;
    }
    return null;
  }

  export function checkDiscount() {
    let ret = LocalStore.get("discount-code");

    // Expire after six months (in case we forget to remove this code later)
    if (ret.redeemed &&
        (new Date()).getTime() - ret.redeemed > 6 * 30 * 24 * 60 * 60 * 1000) {
      return null;
    }

    else if (ret && ret.redeemed) {
      return true;
    }

    else if (_.includes(location.href, "coupon")) {
      LocalStore.set("discount-code", {
        redeemed: (new Date()).getTime()
      });
      return true;
    }

    return false;
  }

  export function DiscountMessage({}: {}) {
    if (checkDiscount()) {
      return <div className="alert alert-success">
        You're entitled to a discounted price for your first
        six months of Esper!
      </div>;
    }
    return null;
  }
}
