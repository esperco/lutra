/// <reference path="./Test.ts" />
/// <reference path="./Actions.Teams.ts" />
/// <reference path="./TestFixtures.ts" />

module Esper.Actions.Teams {
  describe("Team Labels", function() {
    beforeEach(function() {
      TestFixtures.mockLogin();
      Test.mockAPIs();
      LabelUpdateQueue.reset();
      Stores.Teams.init();
      Login.init();

      this.dfd = $.Deferred();
      Test.spySafe(Api, "putSyncedLabels").and.returnValue(this.dfd.promise());

      // Sanity check
      this.teamId = TestFixtures.teamId1;
      expect(Stores.Teams.require(this.teamId).team_labels).toEqual(
        ["Label 1", "Label 2", "Label 3"]
      );
    });

    it("should add labels", function() {
      addLabel(this.teamId, "Label 4");
      expect(Api.putSyncedLabels).toHaveBeenCalledWith(this.teamId, {
        labels: ["Label 1", "Label 2", "Label 3", "Label 4"]
      })
    });

    it("should de-duplicate similar labels when adding", function() {
      addLabel(this.teamId, "label 3");
      expect(Api.putSyncedLabels).toHaveBeenCalledWith(this.teamId, {
        labels: ["Label 1", "Label 2", "Label 3"]
      });
    });
  });
}