/* Test Capped module */

/// <reference path="./Model.Capped.ts"/>

module Esper.Model {

  // A simple model
  class Rabbit {
    uid: string;
    carrots: number;
  };

  // Create singleton instance of a store of rabbits
  class CappedRabbitStore extends CappedStore<Rabbit> {}
  var rabbitHat = new CappedRabbitStore(10);

  describe("Model.CappedStore", function() {
    it("should have a cap", function() {
      expect(rabbitHat.cap).toEqual(10);
    });
  });
}