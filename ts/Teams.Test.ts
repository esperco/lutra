/// <reference path="../marten/typings/jasmine/jasmine.d.ts" />
/// <reference path="../marten/ts/Test.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./TestFixtures.ts" />

module Esper.Teams {
  describe("Default teams", function() {
    beforeEach(function() {
      TestFixtures.mockLoginInfo();
      Test.mockAPIs();

      this.fakeTeamId = "my-team-id";
      this.fakeTeam = {
        teamid: this.fakeTeamId,
        team_name: "Bob Loblaw",
        team_approved: true,
        team_assistants: [TestFixtures.uid],
        team_calendar_accounts: [],
        team_calendars: [],
        team_email_aliases: [],
        team_executive: TestFixtures.uid,
        team_labels: [],
        team_label_urgent: "Urgent",
        team_label_new: "New",
        team_label_in_progress: "In Progress",
        team_label_pending: "Pending",
        team_label_done: "Done",
        team_label_canceled: "Canceled"
      };
      var p = $.Deferred().resolve(this.fakeTeam).promise();
      spyOn(Api, "createTeam").and.returnValue(p);
    });

    it("should be find-able by saveDefaultTeam", function() {
      var _id = createDefaultTeam();
      expect(getDefaultTeamId()).toEqual(_id);
    });

    it("should not trigger API immediately", function() {
      createDefaultTeam();
      expect(Api.createTeam).not.toHaveBeenCalled();
      expect(dataStatus(getDefaultTeamId())).toBe(Model.DataStatus.UNSAVED);
    });

    it("should not create multiple default teams if called twice", function() {
      var _id1 = createDefaultTeam();
      var _id2 = createDefaultTeam();
      expect(_id1).toEqual(_id2);
    });

    it("should alias _id after save", function() {
      createDefaultTeam();
      saveDefaultTeam();
      expect(Api.createTeam).toHaveBeenCalled();
      expect(Teams.get(this.fakeTeamId)).toBeDefined();
    });
  });
}