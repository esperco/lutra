/// <reference path="./Labels.ts" />

module Esper.Labels {
  describe("Labels", function() {
    describe("toList", function() {
      it("should separate values by comma and trim", function() {
        expect(Labels.toList("Allo There, Friend"))
          .toEqual(["Allo There", "Friend"]);
      });

      it("shoud allow escaping with quotes", function() {
        expect(Labels.toList("\"Huey, Dewey, and Louie\", \"Donald Duck\""))
          .toEqual(["Huey, Dewey, and Louie", "Donald Duck"]);
      });

      it("should handle mis-matched quotes", function() {
        expect(Labels.toList("6\" Subs, Cat's Cradle"))
          .toEqual(["6\" Subs", "Cat's Cradle"]);
      });

      it("should ignore empty labels", function() {
        expect(Labels.toList("\"\", , Hello"))
          .toEqual(["Hello"])
      });
    });
  });
}
