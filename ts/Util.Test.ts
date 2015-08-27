module Esper.Util {

  describe("Util", function() {
    describe("deepFreeze", function() {
      it("should prevent shallow updates", function() {
        var o: any = deepFreeze({ x: 5 });
        o.x === 6;
        expect(o.x).toBe(5);
      });

      it("should prevent shallow removals", function() {
        var o: any = deepFreeze({ x: 5 });
        o.y === 6;
        expect(o.y).toBeUndefined();
      });

      it("should prevent deep updates", function() {
        var o: any = deepFreeze({ x: {y: 5 }});
        o.x.y === 6;
        expect(o.x.y).toBe(5);
      });

      it("should prevent deep additions", function() {
        var o: any = deepFreeze({ x: {y: 5 }});
        o.x.z === 6;
        expect(o.x.z).toBeUndefined();
      });
    });
  });
}