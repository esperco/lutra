/// <reference path="./Test.ts" />
/// <reference path="./Stores.Events.ts" />
/// <reference path="./TestFixtures.ts" />

module Esper.Stores.Events {
  describe("Events", function() {
    beforeEach(function() {
      EventsForDateStore.reset();
      EventStore.reset();
      TestFixtures.mockLogin();
      Teams.init();
      Calendars.init();
      Login.init();
    });

    afterEach(function() {
      TestFixtures.reset();
    });

    describe("datesFromBounds", function() {
      it("can return all dates between two dates inclusive", function() {
        var dates = datesFromBounds(new Date(2016, 0, 1),
                                    new Date(2016, 0, 31)); // Jan 2016
        expect(dates.length).toEqual(31);
        expect(dates[0]).toEqual(new Date(2016, 0, 1));
        expect(dates[dates.length - 1]).toEqual(new Date(2016, 0, 31));
      });
    });

    describe("isActive", function() {
      it("should return true if labels confirmed", function() {
        var e = asTeamEvent(TestFixtures.teamId1,
          TestFixtures.makeGenericCalendarEvent({
            labels_confirmed: true
          })
        );
        expect(isActive(e)).toBe(true);
      });

      it("should return false is event is transparent with no other " +
         "indicators", function() {
        var e = asTeamEvent(TestFixtures.teamId1,
          TestFixtures.makeGenericCalendarEvent({
            transparent: true
          })
        );
        expect(isActive(e)).toBe(false);
      });

      it("should return false if event's predicted_attend < 0.5", function() {
        var e = asTeamEvent(TestFixtures.teamId1,
          TestFixtures.makeGenericCalendarEvent({
            predicted_attended: 0.4
          })
        );
        expect(isActive(e)).toBe(false);
      });

      it("should return true if event's predicted_attend >= 0.5, " +
         "overriding transparency info", function() {
        var e = asTeamEvent(TestFixtures.teamId1,
          TestFixtures.makeGenericCalendarEvent({
            predicted_attended: 0.5,
            transparent: true
          })
        );
        expect(isActive(e)).toBe(true);
      });

      it("should return true if event has labels assigned", function() {
        var e = asTeamEvent(TestFixtures.teamId1,
          TestFixtures.makeGenericCalendarEvent({
            predicted_attended: 0.4,
            transparent: true,
            labels: [{
              original: "Label",
              normalized: "label"
            }],
            labels_confirmed: true
          })
        );
        expect(isActive(e)).toBe(true);
      });
    });

    describe("needsConfirmation", function() {
      it("should return false if attendance needs confirmation but labels " +
         "are already confirmed", function() {
        var e = asTeamEvent(TestFixtures.teamId1,
          TestFixtures.makeGenericCalendarEvent({
            labels: [],
            labels_confirmed: true,
            predicted_attended: 0.9
          })
        );
        expect(needsConfirmation(e)).toBe(false);
      });
    });

    describe("overlapsDate", function() {
      var date = new Date(2016, 0, 2); // Jan 2

      it("should return true if event covers entire date", function() {
        var e = TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 1)),
          end:   XDate.toString(new Date(2016, 0, 3))
        });
        expect(overlapsDate(e, date)).toBe(true);
      });

      it("should return true if event is entirely within date", function() {
        var e = TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2, 1)),
          end:   XDate.toString(new Date(2016, 0, 2, 2))
        });
        expect(overlapsDate(e, date)).toBe(true);
      });

      it("should return true if event overlaps start of date", function() {
        var e = TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 1, 12)),
          end:   XDate.toString(new Date(2016, 0, 2, 1))
        });
        expect(overlapsDate(e, date)).toBe(true);
      });

      it("should return true if event overlaps end of date", function() {
        var e = TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 2, 12)),
          end:   XDate.toString(new Date(2016, 0, 3, 1))
        });
        expect(overlapsDate(e, date)).toBe(true);
      });

      it("should return false if event completely precedes date", function() {
        var e = TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 1)),
          end:   XDate.toString(new Date(2016, 0, 1, 12))
        });
        expect(overlapsDate(e, date)).toBe(false);
      });

      it("should return false if event completely follows date", function() {
        var e = TestFixtures.makeGenericCalendarEvent({
          start: XDate.toString(new Date(2016, 0, 3)),
          end:   XDate.toString(new Date(2016, 0, 3, 12))
        });
        expect(overlapsDate(e, date)).toBe(false);
      });
    });


    ///////

    // Fixed vars for fetching and setting events
    const teamId = TestFixtures.teamId0;
    const calId = TestFixtures.team0Calendars[0];
    const eventId1 = "eventId1";
    const eventId2 = "eventId2";
    const eventId3 = "eventId3";
    const eventId4 = "eventId4";

    /*
      e1, e2, and e3 span a two-day period in January, with e2 overlapping
      midnight.

      e4 is in February.
    */
    var e1 = TestFixtures.makeGenericCalendarEvent({
      start: XDate.toString(new Date(2016, 0, 1, 12)),
      end:   XDate.toString(new Date(2016, 0, 1, 13)),
      calendar_id: calId,
      id: eventId1
    });
    var e2 = TestFixtures.makeGenericCalendarEvent({
      start: XDate.toString(new Date(2016, 0, 1, 23)),
      end:   XDate.toString(new Date(2016, 0, 2, 1)),
      calendar_id: calId,
      id: eventId2
    });
    var e3 = TestFixtures.makeGenericCalendarEvent({
      start: XDate.toString(new Date(2016, 0, 2, 12)),
      end:   XDate.toString(new Date(2016, 0, 2, 15)),
      calendar_id: calId,
      id: eventId3
    });
    var e4 = TestFixtures.makeGenericCalendarEvent({
      start: XDate.toString(new Date(2016, 1, 1)),
      end:   XDate.toString(new Date(2016, 1, 1, 1)),
      calendar_id: calId,
      id: eventId4
    });

    describe("fetchPredictions (period)", function() {
      var apiSpy: jasmine.Spy;
      var dfd: JQueryDeferred<ApiT.GenericCalendarEvents>;

      beforeEach(function() {
        /*
          NB: API fetch is followed by another, asynchronous processing of
          events before storing. If number of events returned >
          Stores.Events.FETCH_BASE_SIZE, this may result in weird test results
          (since test runs synchronously).
        */
        apiSpy = Test.spySafe(Api, "postForTeamEvents");
        dfd = $.Deferred();
        apiSpy.and.returnValue(dfd.promise());
        testFetch();
      });

      function testFetch() {
        var period: Types.Period = {
          interval: "month",
          start: 552,
          end: 552 // Jan 2016
        };
        fetchPredictions({ teamId: teamId, period: period });
      }

      it("should fetch data from Api", function() {
        expect(apiSpy).toHaveBeenCalledWith(teamId, {
          window_start: XDate.toString(new Date(2016, 0, 1)),
          window_end: XDate.toString(new Date(2016, 0, 31, 23, 59, 59, 999))
        });
      });

      it("should not fetch if fetch in progress for all dates", function() {
        apiSpy.calls.reset();
        testFetch();
        expect(apiSpy).not.toHaveBeenCalled();
      });

      it("should fetch if any missing date in period", function() {
        apiSpy.calls.reset();
        EventsForDateStore.remove({ teamId, date: new Date(2016, 0, 15) });
        testFetch();
        expect(apiSpy).toHaveBeenCalledWith(teamId, {
          window_start: XDate.toString(new Date(2016, 0, 1)),
          window_end: XDate.toString(new Date(2016, 0, 31, 23, 59, 59, 999))
        });
      });

      describe("on promise resolution", function() {
        beforeEach(function() {
          var x: ApiT.GenericCalendarEvents = { events: [e1, e2, e3] };
          dfd.resolve(x);
        });

        function getForDate(date: Date) {
          return EventsForDateStore.batchGet({ teamId, date }).unwrap();
        }

        function getForId(eventId: string) {
          return EventStore.get({ teamId, eventId }).unwrap();
        }

        it("should store events under their respective dates", function() {
          var dateOpts1 = getForDate(new Date(2016, 0, 1)).data.unwrap();
          expect(_.map(dateOpts1, (d) => d.data.unwrap().id)).toEqual([
            eventId1,
            eventId2
          ]);

          var dateOpts2 = getForDate(new Date(2016, 0, 2)).data.unwrap();
          expect(_.map(dateOpts2, (d) => d.data.unwrap().id)).toEqual([
            eventId2,
            eventId3
          ]);
        });

        it("should not store events under unmatching dates", function() {
          expect(getForDate(new Date(2016, 0, 3)).data.isNone()).toBeTruthy();
        });

        it("should store events under event IDs", function() {
          expect(getForId(eventId1).data.isSome()).toBeTruthy();
          expect(getForId(eventId2).data.isSome()).toBeTruthy();
          expect(getForId(eventId3).data.isSome()).toBeTruthy();
        });
      });
    });

    describe("get (period)", function() {
      beforeEach(function() {
        var dates = datesFromBounds(new Date(2016, 0, 1),
                                    new Date(2016, 1, 1));
        _.each(dates, (d) => EventsForDateStore.batchSet({
          teamId, date: d
        }, Option.none<any>()))

        EventsForDateStore.batchSet({
          teamId, date: new Date(2016, 0, 1)
        }, Option.wrap([{
          itemKey: {
            teamId: teamId,
            calId: calId,
            eventId: eventId1
          },
          data: Option.wrap(asTeamEvent(teamId, e1))
        }, {
          itemKey: {
            teamId: teamId,
            calId: calId,
            eventId: eventId2
          },
          data: Option.wrap(asTeamEvent(teamId, e2))
        }]));

        EventsForDateStore.batchSet({
          teamId, date: new Date(2016, 0, 2)
        }, Option.wrap([{
          itemKey: {
            teamId: teamId,
            calId: calId,
            eventId: eventId2
          },
          data: Option.wrap(asTeamEvent(teamId, e2))
        }, {
          itemKey: {
            teamId: teamId,
            calId: calId,
            eventId: eventId3
          },
          data: Option.wrap(asTeamEvent(teamId, e3))
        }]));

        EventsForDateStore.batchSet({
          teamId, date: new Date(2016, 1, 1)
        }, Option.wrap([{
          itemKey: {
            teamId: teamId,
            calId: calId,
            eventId: eventId4
          },
          data: Option.wrap(asTeamEvent(teamId, e4))
        }]));
      });

      function getVal() {
        return get({
          teamId,
          period: Period.fromDates("day",
            new Date(2016, 0, 1),
            new Date(2016, 0, 2)
          )
        }).unwrap();
      }

      it("should return values within period", function() {
        var val = getVal();
        var rangeEvents = _.map(val.eventsForRanges,
          (r) => _.map(r.events, (e) => e.id)
        );
        expect(rangeEvents).toEqual([[
          eventId1,
          eventId2,
        ], [
          eventId2,
          eventId3
        ]]);
        expect(val.hasError).toBeFalsy();
        expect(val.isBusy).toBeFalsy();
      });

      it("should set hasError if errored on fetching for any date",
      function() {
        EventsForDateStore.setOpt({
          teamId, date: new Date(2016, 0, 2)
        }, {
          dataStatus: Model2.DataStatus.FETCH_ERROR
        });
        expect(getVal().hasError).toBeTruthy();
      });

      it("should set isBusy if busy fetching for any date", function() {
        EventsForDateStore.setOpt({
          teamId, date: new Date(2016, 0, 2)
        }, {
          dataStatus: Model2.DataStatus.FETCHING
        });
        expect(getVal().isBusy).toBeTruthy();
      });
    });

    /////

    const guest1: ApiT.Attendee = {
      email: "a@example.com",
      response: "Needs_action"
    };
    const guest2: ApiT.Attendee = {
      email: "b@example.com",
      response: "Accepted"
    };
    const guest3: ApiT.Attendee = {
      email: "c@example.com",
      response: "Declined"
    };
    const guest4: ApiT.Attendee = {
      email: "d@other.com",
      response: "Accepted"
    };
    const guestEvent = asTeamEvent(TestFixtures.teamId1,
      TestFixtures.makeGenericCalendarEvent({
        guests: [guest1, guest2, guest3, guest4]
      }));

    describe("getGuests", function() {
      it("should return all guests who did not decline", function() {
        expect(getGuests(guestEvent)).toEqual([guest1, guest2, guest4]);
      });

      describe("if team exec is defined", function() {
        beforeEach(function() {
          TestFixtures.mockProfiles([{
            profile_uid: TestFixtures.team1Exec,
            other_emails: ["a@example.com"]
          }]);
        });

        it("should exclude team exec from guest list", function() {
          expect(getGuests(guestEvent)).toEqual([guest2, guest4]);
        });
      });

      describe("getGuestEmails", function() {
        it("should return emails for guests who did not decline", function() {
          var emails = getGuestEmails(guestEvent);
          expect(emails).toEqual(
            _.map([guest1, guest2, guest4], (g) => g.email)
          );
        });

        it("should allow filtering by domain", function() {
          var emails = getGuestEmails(guestEvent, ["example.com"]);
          expect(emails).toEqual(_.map([guest1, guest2], (g) => g.email));
        });
      });

      describe("getGuestDomains", function() {
        it("should return a unique set of domains for guests", function() {
          expect(getGuestDomains(guestEvent))
            .toEqual(["example.com", "other.com"]);
        });
      });
    });
  });
}
