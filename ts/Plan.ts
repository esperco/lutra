/*
  Current plans open to new subscriptions
*/
module Plan {
  export var basic = "Basic_20150421";
  export var basicPlus = "Basic_Plus_20150421";
  export var standard = "Standard_20150421";
  export var standardPlus = "Standard_Plus_20150421";
  export var enhanced = "Enhanced_20150421";
  export var enhancedPlus = "Enhanced_Plus_20150421";
  export var pro = "Pro_20150421";
  export var employee = "Employee_20150304";

  /* Name is "Basic Plus" for plan ID "Basic_Plus_20150123" */
  export function nameOfPlan(planId: string) {
    return planId.replace(/(.*)_\d+$/, "$1").replace("_", " ");
  }

  /* Class is "Basic" for plan names "Basic" and "Basic Plus" */
  export function classOfPlan(planId: string) {
    return nameOfPlan(planId).replace(/([^ ]*).*$/, "$1");
  }

  export var tests = [
    Test.expect(
      "nameOfPlan",
      function() {
        var p1 = "Standard_20141222", p2 = "Fake_Plan_19860328";
        var n1 = nameOfPlan(p1), n2 = nameOfPlan(p2);
        return n1 === "Standard" && n2 === "Fake Plan";
      },
      null,
      true
    ),
    Test.expect(
      "classOfPlan",
      function() {
        var p1 = "Standard_20141222", p2 = "Fake_Plus_19860328";
        var n1 = classOfPlan(p1), n2 = classOfPlan(p2);
        return n1 === "Standard" && n2 === "Fake";
      },
      null,
      true
    )
  ];
}
