/// <reference path="../typings/tsd.d.ts"/>
declare var __ESPER_PRODUCTION__: boolean;
declare var Esper: {
  _: _.LoDashStatic,
  $: JQueryStatic,
  jQuery: JQueryStatic,
  moment: moment.MomentStatic,
  CryptoJS: CryptoJS.CryptoJSStatic
};

if (! __ESPER_PRODUCTION__) {

  describe("globals", function() {
    var getGlobal = function(name: string): any {
      return (<any> window)[name];
    };

    it("should not have jQuery defined", function() {
      expect(getGlobal("$")).toBeUndefined();
      expect(getGlobal("jQuery")).toBeUndefined();
    });

    it("should not have FullCalendar defined", function() {
      expect(getGlobal("fullCalendar")).toBeUndefined();
    });

    it("should not have moment defined", function() {
      expect(getGlobal("moment")).toBeUndefined();
    });

    it("should not have lodash defined", function() {
      expect(getGlobal("_")).toBeUndefined();
    });

    it("should not have CryptoJS.SHA1 properly defined", function() {
      expect(getGlobal("CryptoJS")).toBeUndefined();
    });
  });

  describe("Esper", function() {
    it("should have jQuery defined", function() {
      expect(Esper.$).toBeDefined();
      expect(Esper.jQuery).toBeDefined();
    });

    it("should have jQuery UI defined", function() {
      expect(Esper.$.ui).toBeDefined();
    });

    it("should have FullCalendar defined", function() {
      expect(Esper.$.fullCalendar).toBeDefined();
    });

    it("should have moment defined", function() {
      expect(Esper.moment).toBeDefined();
    });

    it("should have moment timezone defined", function() {
      expect(Esper.moment.tz).toBeDefined();
    });

    it("should have lodash defined", function() {
      expect(Esper._).toBeDefined();
    });

    it("should have CryptoJS.SHA1 properly defined", function() {
      expect(Esper.CryptoJS.SHA1("Esper").toString())
        .toBe("ab000169b25e0576fe2498c2b2e748d71fa961a2");
    });
  });
}
