/*
  Current plans open to new subscriptions
*/
module Esper.Plan {
  export interface Plan {
    id: string;
    name: string;
    description?: string; // HTML for jQuery
    price?: string;
  }

  export var Extension: Plan = {
    id: "Extension_20160105",
    name: "Extension Only",
    description: "<p>Chrome Extension Only</p>",
    price: "$25 / month"
  }

  export var Basic: Plan = {
    id: "Basic_20160105",
    name: "Basic",
    description: (
      "<p>Additional charge for custom reports</p>" +
      "<p>Chrome Extension not included</p>" +
      "<p>1 Calendar Supported</p>"
    ),
    price: "$179.99 / month"
  };

  export var Pro: Plan = {
    id: "Pro_20160105",
    name: "Pro",
    description: (
      "<p>Unlimited custom reports</p>" +
      "<p>Esper Scheduling Chrome Extension</p>" +
      "<p>Up to 3 Calendars Supported</p>"
    ),
    price: "$204.98 / month"
  };

  export var Canceled: Plan = {
    id: "Canceled_20150812",
    name: "Canceled"
  }

  export var Employee: Plan = {
    id: "Employee_20150304",
    name: "Employee"
  }

  /* Get plan object */
  var allPlans = [Extension, Basic, Pro, Canceled, Employee];
  export function getPlan(planId: string) {
    return _.find(allPlans, function(p) {
      return p.id === planId
    });
  }

  /* Is this an active plan? */
  var activePlans = [Extension, Basic, Pro, Employee];
  export function isActive(planId: string) {
    return _.find(activePlans, function(p) {
      return p.id === planId;
    });
  }

  /* Is this a standard plan? e.g. not a one-off option */
  var standardPlans = [Basic, Pro];
  export function isStandard(planId: string) {
    return _.find(standardPlans, function(p) {
        return p.id === planId;
    });
  }

  /* Is this a free plan? e.g. no CC required to sign up */
  var freePlans = [Employee];
  export function isFree(planId: string) {
    return _.find(freePlans, function(p) {
      return p.id === planId;
    });
  }
}
