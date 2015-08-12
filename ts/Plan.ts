/*
  Current plans open to new subscriptions
*/
module Plan {
  export var basic = "Flexible_20150812";
  export var lo = "Silver_20150812";
  export var med = "Gold_20150812";
  export var hi = "Executive_20150812";
  export var employee = "Employee_20150304";

  // Plus plans are variants of plans with the custom e-mail option, set.
  // If no plusPlan, then treat the "plus" version of a plan as identical
  // to the non-plus version
  export var plusPlans: {[index: string]: string} = {};
  plusPlans[basic] = "Flexible_Plus_20150812";
  plusPlans[lo] = "Silver_Plus_20150812";

  /* Is this a "plus" plan? */
  let plusPlansReversed: {[index: string]: string} = {};
  for (var planClass in plusPlans) {
    if (plusPlans.hasOwnProperty(planClass)) {
      plusPlansReversed[plusPlans[planClass]] = planClass;
    }
  }
  export function isPlus(planId: string): boolean {
    return !!plusPlansReversed[planId];
  }

  /* Class is "lo" for plans matching lo and loPlus */
  let planMap: {[index: string]: string} = {};
  planMap[basic] = "basic";
  planMap[lo] = "lo";
  planMap[med] = "med";
  planMap[hi] = "hi";
  planMap[employee] = "employee";
  for (var planClass in plusPlans) {
    if (plusPlans.hasOwnProperty(planClass)) {
      planMap[plusPlans[planClass]] = planMap[planClass];
    }
  }
  export function classOfPlan(planId: string): string {
    return planMap[planId] || "expired";
  }

  /* Human readable names for plans */
  let nameMap = {
    basic: "Flexible",
    lo: "Silver",
    med: "Gold",
    hi: "Executive"
  };
  export function classNameOfPlan(planId: string): string {
    return nameMap[classOfPlan(planId)] || "Expired";
  }

  /* Is this an active plan? */
  var activePlans = [basic, lo, med, hi, employee];
  for (var planClass in plusPlans) {
    if (plusPlans.hasOwnProperty(planClass)) {
      activePlans.push(plusPlans[planClass]);
    }
  }
  export function isActive(planId: string) {
    return List.find(activePlans, function(p) {
      return p === planId;
    });
  }

  /* Is this a free plan? e.g. no CC required to sign up */
  var freePlans = [employee];
  export function isFree(planId: string) {
    return List.find(freePlans, function(p) {
      return p === planId;
    });
  }

  // TODO: fix tests
  // Add isActive test
  export var tests = [
    Test.expect(
      "classOfPlan - basic",
      function() {
        return classOfPlan(basic);
      },
      null,
      "basic"
    ),
    Test.expect(
      "classOfPlan - basic plus",
      function() {
        return classOfPlan(plusPlans[basic]);
      },
      null,
      "basic"
    ),
    Test.expect(
      "classNameOfPlan - lo",
      function() {
        return classNameOfPlan(lo);
      },
      null,
      "Silver"
    ),
    Test.expect(
      "classNameOfPlan - lo Plus",
      function() {
        return classNameOfPlan(plusPlans[lo]);
      },
      null,
      "Silver"
    ),
    Test.expect(
      "isActive",
      function() {
        return isActive(basic) && !isActive("something_else");
      },
      null,
      true
    ),
    Test.expect(
      "isFree",
      function() {
        return isFree(employee) && !isFree(hi);
      },
      null,
      true
    )
  ];
}
