/// <reference path="../lib/Test.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./TestFixtures.ts" />

module Esper.Teams {
  describe("Labels", function() {
    beforeEach(function() {
      TestFixtures.mockLoginInfo();
      Test.mockAPIs();
      Queue.reset();

      this.dfd = $.Deferred();
      Test.spySafe(Api, "putSyncedLabels").and.returnValue(this.dfd.promise());

      // Sanity check
      this.teamId = TestFixtures.teamId1;
      expect(Teams.get(this.teamId).team_labels).toEqual(
        ["Label 1", "Label 2", "Label 3"]
      );
    });

    it("should add labels in CSV form", function() {
      Teams.addLabels(this.teamId, "Label 4, Label 5");
      expect(Api.putSyncedLabels).toHaveBeenCalledWith(this.teamId, {
        labels: ["Label 1", "Label 2", "Label 3", "Label 4", "Label 5"]
      })
    });

    it("should de-duplicate similar labels when adding", function() {
      Teams.addLabels(this.teamId, "label 3, Label 4");
      expect(Api.putSyncedLabels).toHaveBeenCalledWith(this.teamId, {
        labels: ["Label 1", "Label 2", "Label 3", "Label 4"]
      });
    });
  });
}
