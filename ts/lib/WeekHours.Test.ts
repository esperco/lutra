/// <reference path="./Test.ts" />
/// <reference path="./Stores.Events.ts" />
/// <reference path="./TestFixtures.ts" />
/// <reference path="./WeekHours.ts" />

module Esper.WeekHours {
  describe("WeekHours", function() {
    describe("overlap", function() {
      let teamId = TestFixtures.teamId0;
      let nineToFive = {
        start: { hour: 9, minute: 0 },
        end: { hour: 17, minute: 0}
      };
      let weekHours = {
        mon: Option.some(nineToFive),
        tue: Option.some(nineToFive),
        wed: Option.some(nineToFive),
        thu: Option.some(nineToFive),
        fri: Option.some(nineToFive),
        sat: Option.none<Types.DayHours>(),
        sun: Option.none<Types.DayHours>()
      };

      it("should return true if events overlap at all", function() {
        let e = Stores.Events.asTeamEvent(teamId,
          TestFixtures.makeGenericCalendarEvent({ // Friday
            start: XDate.toString(new Date(2016, 0, 1, 5)),
            end:   XDate.toString(new Date(2016, 0, 1, 18)),
          }));
        expect(overlap(e, weekHours)).toBe(true);
      });

      it("should return false if events don't overlap at all", function() {
        let e = Stores.Events.asTeamEvent(teamId,
          TestFixtures.makeGenericCalendarEvent({ // Friday
            start: XDate.toString(new Date(2016, 0, 1, 5)),
            end:   XDate.toString(new Date(2016, 0, 1, 8)),
          }));
        expect(overlap(e, weekHours)).toBe(false);
      });
    });
  })
}
