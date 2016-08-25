/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {
  export class DomainChartInsight extends ChartGroupingInsight<{}> {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      // Current group only
      let periodGroup = _.find(groups, (g) => g.current);
      if (! periodGroup) return <span />;

      /*
        NB: We'd move more of this to Text namespace but given the complexity
        of the scenarios, leave alone for the time being
      */
      return <div>
        {
          Insights.matchScenario(periodGroup.data, {
            allNone: () => <p>{ Text.ChartNoGuests }</p>,

            allOne: (domain) => <p>
              All of your meetings are with {" " + Text.Guests} from{" "}
              <InlineDomain domain={domain} />.
            </p>,

            allEqual: (pairs) => <p>
              Your time is being spent roughly equally between
              {" " + Text.Guests} from{" "}
              <InlineDomainList pairs={pairs} />.
            </p>,

            tiersMajority: (tier1, tier2) => <p>
              You're spending the majority of your meetings with
              {" " + Text.Guests} from{" "}
              <InlineDomainList pairs={tier1} />, {" "}followed by{" "}
              <InlineDomainList pairs={tier2} />.
            </p>
          }, (pairs) => <p>
            You meet the most with {" " + Text.Guests} from{" "}
            <InlineDomainList pairs={pairs.slice(0, 3)} />.
          </p>)
        }
      </div>;
    }
  }

  function InlineDomainList({pairs} : {pairs: [string, number][]}) {
    return <CommaList>
      { _.map(pairs, (p) => <InlineDomain key={p[0]} domain={p[0]} />) }
    </CommaList>
  }

  function InlineDomain({domain}: {domain: string}) {
    let bg = Colors.getColorForDomain(domain);
    return <Components.Badge color={bg} text={domain} />;
  }
}
