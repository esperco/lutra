/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="./Emit.ts" />

module Esper.Emit {

  class TestSource extends EmitBase {
    cough() {
      this.emitChange();
    }
  }
  class TestPipe extends EmitPipeBase {};

  describe("Emit.EmitPipeBase", function() {
    beforeEach(function() {
      this.source1 = new TestSource();
      this.source2 = new TestSource();
      this.pipe = new TestPipe([this.source1, this.source2]);
    });

    it("should call listeners when sub-listeners emit", function() {
      var l = jasmine.createSpy("l");
      this.pipe.addChangeListener(l);

      this.source1.cough();
      this.source2.cough();
      expect(l.calls.count()).toEqual(2);
    });

    it("should add sublisteners only once", function() {
      var l1 = jasmine.createSpy('l1');
      var l2 = jasmine.createSpy('l2');
      this.pipe.addChangeListener(l1);
      this.pipe.addChangeListener(l2);

      this.source1.cough();
      expect(l1.calls.count()).toEqual(1);
      expect(l2.calls.count()).toEqual(1);
    });

    it("should not remove sublisteners so long as listeners remain", function() {
      var l1 = jasmine.createSpy('l1');
      var l2 = jasmine.createSpy('l2');
      this.pipe.addChangeListener(l1);
      this.pipe.addChangeListener(l2);
      this.pipe.removeChangeListener(l1);

      this.source1.cough();
      expect(l1).not.toHaveBeenCalled();
      expect(l2).toHaveBeenCalled();
    });

    it("should remove sublisteners if all listeners removed", function() {
      var l1 = jasmine.createSpy('l1');
      var l2 = jasmine.createSpy('l2');
      this.pipe.addChangeListener(l1);
      this.pipe.addChangeListener(l2);
      this.pipe.removeChangeListener(l1);
      this.pipe.removeChangeListener(l2);

      spyOn(this.pipe, "emitChange");
      this.source1.cough();
      expect(this.pipe.emitChange).not.toHaveBeenCalled();
    });

    it("should remove sublisteners if removeAllListeners called", function() {
      var l1 = function() { };
      var l2 = function() { };
      this.pipe.addChangeListener(l1);
      this.pipe.addChangeListener(l2);
      this.pipe.removeAllChangeListeners();

      spyOn(this.pipe, "emitChange");
      this.source1.cough();
      expect(this.pipe.emitChange).not.toHaveBeenCalled()
    });
  });

}
