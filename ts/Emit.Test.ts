/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./Emit.ts" />

module Esper.Emit {

  class TestEmit extends EmitBase {}

  class TestPipe extends EmitPipeBase {
    addSubListeners() {}
    removeSubListeners() {}
  };

  describe("Emit.EmitPipeBase", function() {
    beforeEach(function() {
      this.pipe = new TestPipe();
      spyOn(this.pipe, "addSubListeners");
      spyOn(this.pipe, "removeSubListeners");
    });

    it("should add sublisteners only once", function() {
      var l1 = function() { };
      var l2 = function() { };
      this.pipe.addChangeListener(l1);
      expect(this.pipe.addSubListeners).toHaveBeenCalled();

      this.pipe.addChangeListener(l2);
      expect(this.pipe.addSubListeners.calls.count()).toEqual(1);
    });

    it("should remove sublisteners only if no listeners remain", function() {
      var l1 = function() { };
      var l2 = function() { };
      this.pipe.addChangeListener(l1);
      this.pipe.addChangeListener(l2);
      this.pipe.removeChangeListener(l1);
      expect(this.pipe.removeSubListeners).not.toHaveBeenCalled();

      this.pipe.removeChangeListener(l2);
      expect(this.pipe.removeSubListeners).toHaveBeenCalled();
    });

    it("should remove sublisteners if removeAllListeners called", function() {
      var l1 = function() { };
      var l2 = function() { };
      this.pipe.addChangeListener(l1);
      this.pipe.addChangeListener(l2);
      this.pipe.removeAllChangeListeners();
      expect(this.pipe.removeSubListeners).toHaveBeenCalled();
    });
  });

}
