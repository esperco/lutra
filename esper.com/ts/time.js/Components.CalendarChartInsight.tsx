/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {
  export class CalendarChartInsight extends GroupChartInsight {
    getGroupBy() { return Charting.GroupByDomain; }

    rerender() {
      return this.getResult().match({
        none: () => null,

        /*
          NB: We'd move more of this to Text namespace but given the complexity
          of the scenarios, leave alone for the time being
        */
        some: (s) => <div>{
          Insights.matchScenario(s.group, {
            allNone: () => <p>{Text.ChartNoData}</p>,

            allOne: (calId) => <p>
              All of your scheduled events are on the{" "}
              <InlineCal
                calendar={_.find(this.props.calendars, (c) => c.id === calId)}
              />{" "}calendar.
            </p>,

            allEqual: (pairs) => <p>
              Your time is being spent roughly equally between the{" "}
              <InlineCalList
                calendars={this.props.calendars}
                pairs={pairs}
              />{" "}calendars.
            </p>,

            tiersMajority: (tier1, tier2) => <p>
              You're spending the majority of your time on the{" "}
              <InlineCalList
                calendars={this.props.calendars}
                pairs={tier1}
              />{" "}calendar{tier1.length === 1 ? "" : "s"},
              {" "}followed by the{" "}
              <InlineCalList
                calendars={this.props.calendars}
                pairs={tier2}
              />{" "}calendar{tier2.length === 1 ? "" : "s"}.
            </p>,

            tiersPlurality: (tier1, tier2) => <p>
              You're spending the bulk of your time on the{" "}
              <InlineCalList
                calendars={this.props.calendars}
                pairs={tier1}
              />{" "}calendar{tier1.length === 1 ? "" : "s"},
              {" "}followed by the{" "}
              <InlineCalList
                calendars={this.props.calendars}
                pairs={tier2}
              />{" "}calendar{tier2.length === 1 ? "" : "s"}.
            </p>,

            fallback: (pairs) => <p>
              Your top calendars are the{" "}
              <InlineCalList
                calendars={this.props.calendars}
                pairs={pairs}
              />{" "}calendar{pairs.length === 1 ? "" : "s"}.
            </p>
          })
        }</div>
      });
    }
  }

  function InlineCalList({pairs, calendars} : {
    pairs: [string, number][];
    calendars: ApiT.GenericCalendar[];
  }) {
    var cals = _(pairs)
      .map((p) => _.find(calendars, (c) => c.id === p[0]))
      .compact()
      .map((cal) => <InlineCal key={cal.id} calendar={cal} />)
      .value();

    return <CommaList>{cals}</CommaList>
  }

  function InlineCal({calendar}: {calendar: ApiT.GenericCalendar}) {
    let bg = Colors.getColorForCal(calendar.id);
    return <Components.Badge color={bg} text={calendar.title} />;
  }
}
