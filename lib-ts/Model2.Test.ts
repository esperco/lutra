/// <reference path="./Model2.ts" />

module Esper.Model2 {
  interface Rabbit {
    name: [string, string];
    carrots: number;
  };

  describe("Model2.Store", function() {
    var rabbitStore = new Store<[string, string], Rabbit>();

    function setRabbit(name: [string, string], carrots: number,
                       opts?: StoreOpts<[string, string]>)
    {
      rabbitStore.set(name, Option.some({
        name: name,
        carrots: carrots
      }), opts);
    }

    beforeEach(function() {
      this.baseTime = new Date(2015, 08, 26, 1, 1, 7);
      jasmine.clock().install();
      jasmine.clock().mockDate(this.baseTime);
    });

    afterEach(function() {
      jasmine.clock().uninstall();
      rabbitStore.reset();
      rabbitStore.removeAllChangeListeners();
    });

    describe("set new", function() {
      beforeEach(function() {
        this.listener = jasmine.createSpy("listener");
        rabbitStore.addChangeListener(this.listener);

        this.name1 = ["Peter", "Cottontail"];
        this.carrots1 = 100;
        setRabbit(this.name1, this.carrots1);

        this.name2 = ["Brown", "Rabbit"];
        this.carrots2 = 200;
        setRabbit(this.name2, this.carrots2);
      });

      it("should allow us to get object by _id", function() {
        var r1 = rabbitStore.get(this.name1).unwrap().data.unwrap();
        expect(r1.carrots).toEqual(this.carrots1);
        expect(r1.name).toEqual(this.name1);

        var r2 = rabbitStore.get(this.name2).unwrap().data.unwrap();
        expect(r2.carrots).toEqual(this.carrots2);
        expect(r2.name).toEqual(this.name2);
      });

      it("should freeze gotten objects", function() {
        var r1 = rabbitStore.get(this.name1).unwrap().data.unwrap();
        expect(Object.isFrozen(r1)).toBe(true);
      });

      it("should allow modification of cloned objects", function() {
        var r1 = rabbitStore.cloneData(this.name1).unwrap();
        r1.carrots = this.carrots1 + 100;
        expect(r1.carrots).toEqual(this.carrots1 + 100);
      });

      it("should allow us to list all objects", function() {
        var all = _.sortBy(rabbitStore.all(), (r) => r.data.unwrap().carrots);
        expect(_.map(all, (r) => r.data.unwrap()))
          .toEqual([
            {name: this.name1, carrots: this.carrots1},
            {name: this.name2, carrots: this.carrots2}
          ]);
      });

      it("should set the last update time", function() {
        var meta = rabbitStore.get(this.name1).unwrap();
        expect(meta.lastUpdate).toEqual(this.baseTime);
      });

      it("should have a data status", function() {
        var meta = rabbitStore.get(this.name1).unwrap();
        expect(meta.dataStatus).toEqual(DataStatus.READY);
      });

      it("should call the listener with the _id(s)", function() {
        expect(this.listener).toHaveBeenCalledWith([this.name1]);
        expect(this.listener).toHaveBeenCalledWith([this.name2]);
      });

      describe("then set existing", function() {
        beforeEach(function() {
          this.listener.calls.reset();

          jasmine.clock().tick(50);
          this.baseTime = new Date(this.baseTime.getTime() + 50);
          this.carrots3 = 300;
          setRabbit(this.name1, this.carrots3);
        });

        it("should update data value", function() {
          var r1 = rabbitStore.get(this.name1).unwrap().data.unwrap();
          expect(r1.carrots).toEqual(this.carrots3);
          expect(r1.name).toEqual(this.name1);
        });

        it("should update the last update time", function() {
          var meta = rabbitStore.get(this.name1).unwrap();
          expect(meta.lastUpdate).toEqual(this.baseTime);
        });

        it("should call the listener", function() {
          expect(this.listener).toHaveBeenCalledWith([this.name1]);
          expect(this.listener).not.toHaveBeenCalledWith([this.name2]);
        });
      });

      describe("then remove", function() {
        beforeEach(function() {
          this.listener.calls.reset();
          rabbitStore.remove(this.name1);
        });

        it("should return a None option when _id is requested", function() {
          expect(rabbitStore.get(this.name1).isNone()).toBe(true);
        });

        it("should not remove other _ids", function() {
          expect(rabbitStore.get(this.name2).isSome()).toBe(true);
        });

        it("should call the listener", function() {
          expect(this.listener).toHaveBeenCalledWith([this.name1]);
          expect(this.listener).not.toHaveBeenCalledWith([this.name2]);
        });
      });
    });

    describe("setOpt", function() {
      var name: [string, string] = ["Albino", "Rabbit"]

      it("should allow us to set opts for non-existent key", function() {
        rabbitStore.setOpt(name, {
          dataStatus: DataStatus.FETCHING
        });

        var data = rabbitStore.get(name).unwrap();
        expect(data.dataStatus).toBe(DataStatus.FETCHING);
        expect(data.data.isNone()).toBe(true);
      });

      it("should allow us to set opts for existing key", function() {
        setRabbit(name, 100);
        rabbitStore.setOpt(name, {
          dataStatus: DataStatus.FETCHING
        });

        var data = rabbitStore.get(name).unwrap();
        expect(data.dataStatus).toBe(DataStatus.FETCHING);
        expect(data.data.unwrap().carrots).toEqual(100);
      });
    });

    describe("with aliases", function() {
      beforeEach(function() {
        this.alias1 = ["Brown", "Rabbit"];
        this.alias2 = ["Brown", "Bunny"];
        this.alias3 = ["Brownish", "Lagomorph"];
        this.carrots = 500;

        this.store = new Store<[string, string], Rabbit>({
          idForData: (r: Rabbit) => r.name
        });
        this.store.set(this.alias1, Option.wrap({
          name: this.alias3, carrots: this.carrots
        }), {
          aliases: [this.alias2]
        });
      });

      it("should allow retrieval by original _id", function() {
        expect(this.store.get(this.alias1).unwrap().data.unwrap().carrots)
          .toBe(this.carrots);
      });

      it("should allow retrieval by new alias", function() {
        expect(this.store.get(this.alias2).unwrap().data.unwrap().carrots)
          .toBe(this.carrots);
      });

      it("should allow retrieval by idForData alias", function() {
        expect(this.store.get(this.alias3).unwrap().data.unwrap().carrots)
          .toBe(this.carrots);
      });

      it("should add to the _id list for our change listener (alias key)",
        function()
      {
        var spy = jasmine.createSpy("change");
        this.store.addChangeListener(spy);

        var alias4 = ["Cafe", "Coneja"];
        this.store.setOpt(this.alias1, {aliases: [alias4]});

        var idList = spy.calls.first().args[0];
        expect(idList.length).toEqual(4);
        expect(idList).toContain(this.alias1);
        expect(idList).toContain(this.alias2);
        expect(idList).toContain(this.alias3);
        expect(idList).toContain(alias4);
      });

      it("should add to the _id list for our change listener (orig key)",
        function()
      {
        var spy = jasmine.createSpy("change");
        this.store.addChangeListener(spy);

        var alias4 = ["Cafe", "Coneja"];
        this.store.setOpt(this.alias2, {aliases: [alias4]});

        var idList = spy.calls.first().args[0];
        expect(idList.length).toEqual(4);
        expect(idList).toContain(this.alias1);
        expect(idList).toContain(this.alias2);
        expect(idList).toContain(this.alias3);
        expect(idList).toContain(alias4);
      });

      describe("removing by original _id", function() {
        beforeEach(function() {
          this.store.remove(this.alias1);
        });

        it("should remove original and all aliases", function() {
          expect(this.store.get(this.alias1).isNone()).toBe(true);
          expect(this.store.get(this.alias2).isNone()).toBe(true);
          expect(this.store.get(this.alias3).isNone()).toBe(true);
        });

        it("should allow inserting of new data detached from alias",
        function() {
          this.store.set(this.alias1, Option.some({
            name: this.alias1, carrots: 600
          }));
          expect(this.store.get(this.alias1).unwrap().data.unwrap().carrots)
            .toEqual(600);
          expect(this.store.get(this.alias2).isNone()).toBe(true);
        });
      });

      describe("removing by aliased _id", function() {
        beforeEach(function() {
          this.store.remove(this.alias2);
        });

        it("should remove original", function() {
          expect(this.store.get(this.alias1).isNone()).toBe(true);
          expect(this.store.get(this.alias2).isNone()).toBe(true);
          expect(this.store.get(this.alias3).isNone()).toBe(true);
        });

        it("should allow inserting of new data detached from alias",
        function() {
          this.store.set(this.alias1, Option.some({
            name: this.alias1, carrots: 600
          }));
          expect(this.store.get(this.alias1).unwrap().data.unwrap().carrots)
            .toEqual(600);
          expect(this.store.get(this.alias2).isNone()).toBe(true);
        });
      });
    });

    describe("setSafe", function() {
      var name: [string, string] = ["Brown", "Rabbit"];
      function setWithStatus(status: DataStatus) {
        setRabbit(name, 100, {
          dataStatus: status
        });
      }

      function setSafe() {
        return rabbitStore.setSafe(name, Option.wrap({
          name: name, carrots: 200
        }), {
          dataStatus: DataStatus.READY
        });
      }

      function withNotOKStatus(status: DataStatus) {
        describe("with dataStatus " + DataStatus[status], function() {
          beforeEach(function() {
            setWithStatus(status);
            this.val = setSafe();
          });

          it("should return false", function() {
            expect(this.val).toBe(false);
          });

          it("should not replace existing data", function() {
            var meta = rabbitStore.get(name).unwrap();
            var rabbit = meta.data.unwrap();
            expect(meta.dataStatus).toBe(status);
            expect(rabbit.carrots).toBe(100);
          });
        });
      }
      withNotOKStatus(DataStatus.UNSAVED);
      withNotOKStatus(DataStatus.INFLIGHT);

      function withOKStatus(status: DataStatus) {
        describe("with dataStatus " + DataStatus[status], function() {
          beforeEach(function() {
            setWithStatus(status);
            this.val = setSafe();
          });

          it("should return true", function() {
            expect(this.val).toBe(true);
          });

          it("should replace existing data", function() {
            var meta = rabbitStore.get(name).unwrap();
            var rabbit = meta.data.unwrap();
            expect(meta.dataStatus).toBe(DataStatus.READY);
            expect(rabbit.carrots).toBe(200);
          });
        });
      }
      withOKStatus(DataStatus.READY);
      withOKStatus(DataStatus.FETCHING)
    });

    describe("push", function() {
      beforeEach(function() {
        this.name = ["Brown", "Rabbit"];
        this.dfd = $.Deferred<Rabbit>();
        setRabbit(this.name, 100, { dataStatus: DataStatus.UNSAVED });
        rabbitStore.push(this.name, this.dfd, Option.some({
          name: this.name, carrots: 200
        }));
      });

      it("should set an initial value", function() {
        expect(rabbitStore.get(this.name).unwrap().data.unwrap().carrots)
          .toEqual(200);
      });

      it("should normally update dataStatus to INFLIGHT", function() {
        expect(rabbitStore.get(this.name).unwrap().dataStatus)
          .toBe(DataStatus.INFLIGHT);
      });

      describe("after promise resolves", function() {
        beforeEach(function() {
          this.dfd.resolve({ name: this.name, carrots: 789 });
        });

        it("should update the data status to READY", function() {
          expect(rabbitStore.get(this.name).unwrap().dataStatus)
            .toBe(DataStatus.READY);
        });

        it("should not update store value", function() {
          expect(rabbitStore.get(this.name).unwrap().data.unwrap().carrots)
            .toEqual(200);
        });
      });

      describe("after promise fails", function() {
        beforeEach(function() {
          this.err = new Error("Whoops!");
          this.dfd.reject(this.err);
        });

        it("should update dataStatus to PUSH_ERROR and populate lastError",
        function() {
          var data = rabbitStore.get(this.name).unwrap();
          expect(data.dataStatus).toBe(DataStatus.PUSH_ERROR);
          expect(data.lastError).toBe(this.err);
        });
      });

      describe("if data at key is UNSAVED after push initiated", function() {
        beforeEach(function() {
          setRabbit(this.name, 200, { dataStatus: DataStatus.UNSAVED });
          this.dfd.resolve();
        });

        it("should not update dataStatus to READY after resolution",
        function()
        {
          expect(rabbitStore.get(this.name).unwrap().dataStatus)
            .toBe(DataStatus.UNSAVED);
        });
      });
    });

    describe("fetch", function() {
      beforeEach(function() {
        this.name = ["Brown", "Rabbit"];
        this.dfd = $.Deferred<Rabbit>();
      });

      describe("default", function() {
        beforeEach(function() {
          rabbitStore.fetch(this.name, this.dfd);
        });

        it("should normally update dataStatus to FETCHING", function() {
          expect(rabbitStore.get(this.name).unwrap().dataStatus)
            .toBe(DataStatus.FETCHING);
        });

        it("should update value and dataStatus to READY after promise resolves",
          function()
        {
          this.dfd.resolve({ name: this.name, carrots: 1000 });
          var data = rabbitStore.get(this.name).unwrap();
          expect(data.dataStatus).toBe(DataStatus.READY);

          var rabbit = data.data.unwrap();
          expect(rabbit.carrots).toEqual(1000);
        });

        it("should update dataStatus to FETCH_ERROR after promise rejects",
          function()
        {
          var err = new Error("Whoops");
          this.dfd.reject(err);
          var data = rabbitStore.get(this.name).unwrap();
          expect(data.dataStatus).toBe(DataStatus.FETCH_ERROR);
          expect(data.lastError).toBe(err);
        });
      });

      function noChangeTests(status: DataStatus) {
        describe("if data at key is currently " + DataStatus[status],
        function() {
          beforeEach(function() {
            setRabbit(this.name, 100, {
              dataStatus: status
            });
            rabbitStore.fetch(this.name, this.dfd);
          });

          it("should not update dataStatus initially", function() {
            expect(rabbitStore.get(this.name).unwrap().dataStatus)
              .toBe(status);
          });

          it("should not update dataStatus after promise resolves",
            function()
          {
            this.dfd.resolve({ name: this.name, carrots: 1000 });
            expect(rabbitStore.get(this.name).unwrap().dataStatus)
              .toBe(status);
          });

          it("should not update dataStatus after promise rejects",
            function()
          {
            this.dfd.reject(new Error());
            expect(rabbitStore.get(this.name).unwrap().dataStatus)
              .toBe(status);
          });
        });
      }

      noChangeTests(DataStatus.UNSAVED);
      noChangeTests(DataStatus.INFLIGHT);
    });

    describe("pushFetch", function() {
      beforeEach(function() {
        this.name = ["Brown", "Rabbit"];
        this.dfd = $.Deferred<Rabbit>();
        setRabbit(this.name, 100);
        rabbitStore.pushFetch(this.name, this.dfd);
      });

      it("should update with initial value if one passed", function() {
        rabbitStore.pushFetch(this.name, this.dfd, Option.some({
          name: this.name, carrots: 200
        }));
        expect(rabbitStore.get(this.name).unwrap().data.unwrap().carrots)
          .toEqual(200);
      });

      it("should not override existing data if no value passed", function() {
        expect(rabbitStore.get(this.name).unwrap().data.unwrap().carrots)
          .toEqual(100);
      });

      it("should set status to INFLIGHT", function() {
        expect(rabbitStore.get(this.name).unwrap().dataStatus)
          .toBe(DataStatus.INFLIGHT);
      });

      describe("after promise resolves", function() {
        beforeEach(function() {
          this.dfd.resolve({name: this.name, carrots: 1234})
        });

        it("should update the store metadata to READY", function() {
          expect(rabbitStore.get(this.name).unwrap().dataStatus)
            .toBe(DataStatus.READY);
        });

        it("should update store value", function() {
          expect(rabbitStore.get(this.name).unwrap().data.unwrap().carrots)
            .toBe(1234);
        });
      });

      describe("after promise fails", function() {
        beforeEach(function() {
          this.err = new Error("Whoops");
          this.dfd.reject(this.err);
        });

        it("should update dataStatus to PUSH_ERROR and populate lastError",
        function() {
          var data = rabbitStore.get(this.name).unwrap();
          var rabbit = data.data.unwrap();
          expect(data.dataStatus).toBe(DataStatus.PUSH_ERROR);
          expect(data.lastError).toBe(this.err);
        });
      });
    });

    describe("track", function() {
      beforeEach(function() {
        this.post = jasmine.createSpy("post");
      });

      it("should return the value of its callback", function() {
        expect(Tracker.track(() => 123, this.post)).toBe(123);
      });

      it("should call the post function with any store and values tracked",
        function()
      {
        var name: [string, string] = ["Black", "Rabbit"]
        Tracker.track(() => {
          rabbitStore.get(name);
        }, this.post);

        var nameStr = Util.cmpStringify(name);
        expect(this.post).toHaveBeenCalledWith([{
          store: rabbitStore,
          key: nameStr
        }]);
      });

      it("should track getAll calls", function() {
        Tracker.track(() => {
          rabbitStore.all();
        }, this.post);

        expect(this.post).toHaveBeenCalledWith([{
          store: rabbitStore,
        }]);
      });
    });

    describe("transact", function() {
      beforeEach(function() {
        this.listener = jasmine.createSpy("listener");
        rabbitStore.addChangeListener(this.listener);
        this.name1 = ["Brown", "Rabbit"];
        this.name2 = ["Black", "Rabbit"];
      });

      it("should call listener only once per update", function() {
        rabbitStore.transact(() => {
          setRabbit(this.name1, 123);
          setRabbit(this.name2, 456);
        });
        expect(this.listener).toHaveBeenCalledWith([this.name1, this.name2]);
        expect(this.listener.calls.count()).toEqual(1);
      });

      it("should call listener only once per update even when nested",
        function()
      {
        rabbitStore.transact(() => {
          setRabbit(this.name1, 123);
          rabbitStore.transact(() => {
            setRabbit(this.name2, 456);
          });
        });
        expect(this.listener).toHaveBeenCalledWith([this.name1, this.name2]);
        expect(this.listener.calls.count()).toEqual(1);
      });

      it("should reset between transactions", function() {
        rabbitStore.transact(() => {
          setRabbit(this.name1, 123);
        });

        rabbitStore.transact(() => {
          setRabbit(this.name2, 456);
        });

        expect(this.listener).toHaveBeenCalledWith([this.name1]);
        expect(this.listener).toHaveBeenCalledWith([this.name2]);
        expect(this.listener.calls.count()).toEqual(2);
      });
    });

    describe("transactP", function() {
      beforeEach(function() {
        this.listener = jasmine.createSpy("listener");
        rabbitStore.addChangeListener(this.listener);
        this.name1 = ["Brown", "Rabbit"];
        this.name2 = ["Black", "Rabbit"];
        this.dfd = $.Deferred<any>();
      });

      it("should call listener only once per promise resolution", function() {
        rabbitStore.transactP(this.dfd.promise(), (p) => {
          p.done(() => {
            setRabbit(this.name1, 123);
          });

          p.done(() => {
            setRabbit(this.name2, 456);
          });
        });
        this.dfd.resolve();

        expect(this.listener).toHaveBeenCalledWith([this.name1, this.name2]);
        expect(this.listener.calls.count()).toEqual(1);
      });

       it("should call listener only once per promise rejection", function() {
        rabbitStore.transactP(this.dfd.promise(), (p) => {
          p.fail(() => {
            setRabbit(this.name1, 123);
          });

          p.fail(() => {
            setRabbit(this.name2, 456);
          });
        });
        this.dfd.reject();

        expect(this.listener).toHaveBeenCalledWith([this.name1, this.name2]);
        expect(this.listener.calls.count()).toEqual(1);
      });

      it("should call listener only once per promise even when nested",
        function()
      {
        rabbitStore.transactP(this.dfd.promise(), (p) => {
          p.done(() => {
            setRabbit(this.name1, 123);
          });

          rabbitStore.transactP(p, (p2) => {
            p2.done(() => {
              setRabbit(this.name2, 456);
            });
          });
        });
        this.dfd.resolve();

        expect(this.listener).toHaveBeenCalledWith([this.name1, this.name2]);
        expect(this.listener.calls.count()).toEqual(1);
      });

      it("should reset between transactions", function() {
        rabbitStore.transactP(this.dfd.promise(), (p) => {
          p.done(() => {
            setRabbit(this.name1, 123);
          });
        });

        rabbitStore.transactP(this.dfd.promise(), (p) => {
          p.done(() => {
            setRabbit(this.name2, 456);
          });
        });

        this.dfd.resolve();
        expect(this.listener).toHaveBeenCalledWith([this.name1]);
        expect(this.listener).toHaveBeenCalledWith([this.name2]);
        expect(this.listener.calls.count()).toEqual(2);
      });
    });

    // TODO

    // describe("with cap", function() {

    // });

  });

}
