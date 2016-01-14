/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./Calendars.ts" />
module Esper.Calendars {
  describe("defaultSelection", function() {
    it("should mark is_primary calendars first", function() {
      spyOn(Teams, "all").and.returnValue([
        {
          teamid: "A TEAM",
          team_calendars: [{
            calendar_default_agenda: true,
            calendar_default_dupe: true,
            calendar_default_view: true,
            calendar_default_write: true,
            is_primary: false,
            google_cal_id: "cal1"
          }]
        }, {
          teamid: "B TEAM",
          team_calendars: [{
            calendar_default_agenda: false,
            calendar_default_dupe: false,
            calendar_default_view: true,
            calendar_default_write: true,
            is_primary: true,
            google_cal_id: "cal2"
          }, {
            calendar_default_agenda: false,
            calendar_default_dupe: true,
            calendar_default_view: true,
            calendar_default_write: true,
            is_primary: false,
            google_cal_id: "cal3"
          }]
        }
      ]);

      var sel = defaultSelection();
      expect(sel.calId).toBe("cal2");
      expect(sel.teamId).toBe("B TEAM");
    });
  });
}
