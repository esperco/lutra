/*
  Client-side time stat calculations
*/

module Esper.EventStats {
  describe("EventStats2", function() {
    describe("groupAnnotations", function() {

      function makeAnnotation(p: {
        value: number;
        groups: string[];
      }): Annotation {
        return {
          // Event itself doesn't matter, we're just testing annotation value
          event: Stores.Events.asTeamEvent(
            "team-id",
            TestFixtures.makeGenericCalendarEvent()
          ),
          value: p.value,
          groups: p.groups
        };
      }

      it("should group annotations", function() {
        let a1 = makeAnnotation({ value: 5, groups: ["a"]});
        let b1 = makeAnnotation({ value: 6, groups: ["b"]});
        let a2 = makeAnnotation({ value: 7, groups: ["a"]});
        let b2 = makeAnnotation({ value: 8, groups: ["b"]});
        let results = groupAnnotations([a1, b1, b2, a2]);

        expect(_.keys(results).length).toEqual(2);
        expect(_.map(results["a"].annotations, (a) => a.value))
          .toEqual([5, 7]);
        expect(_.map(results["b"].annotations, (b) => b.value))
          .toEqual([6, 8]);
        expect(results["a"].total).toEqual(12);
        expect(results["b"].total).toEqual(14);
      });

      it("should nest groups", function() {

      });
    });
  });
}
