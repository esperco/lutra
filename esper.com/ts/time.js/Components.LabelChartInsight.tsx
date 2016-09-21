/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {
  export class LabelChartInsight extends ChartGroupingInsight<{
    labelInfos: ApiT.LabelInfo[]
  }> {
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
            allNone: () => <p>
              None of your events are{" "}{Text.Labeled}. Click on the
              {" "}<span className="text-muted">"{Text.Unlabeled}"</span>{" "}
              portion of the chart to assign {" "}{Text.Labels} to your events.
            </p>,

            allOne: (label) => <p>
              All of your {" " + Text.Labeled + " "} time is being spent on
              {" "}<InlineLabel id={label} labelInfos={this.props.labelInfos} />.
            </p>,

            allEqual: (pairs) => <p>
              Your time is being spent roughly equally between{" "}
              <InlineLabelList pairs={pairs} labelInfos={this.props.labelInfos}/>.
            </p>,

            tiersMajority: (tier1, tier2) => <p>
              You're spending the majority of your time on events
              {" " + Text.Labeled + " "}
              <InlineLabelList pairs={tier1}
                labelInfos={this.props.labelInfos}/>, {" "}followed by{" "}
              <InlineLabelList pairs={tier2}
                labelInfos={this.props.labelInfos} />.
            </p>,

            tiersPlurality: (tier1, tier2) => <p>
              You're spending the bulk of your time on events
              {" " + Text.Labeled + " "}
              <InlineLabelList pairs={tier1}
                labelInfos={this.props.labelInfos} />, {" "}followed by{" "}
              <InlineLabelList pairs={tier2}
                labelInfos={this.props.labelInfos} />.
            </p>,

            fallback: (pairs) => <p>
              Your top {Text.Labels} are{" "}
              <InlineLabelList pairs={pairs.slice(0, 3)}
                labelInfos={this.props.labelInfos} />.
            </p>
          })
        }
      </div>;
    }
  }

  function InlineLabelList({pairs, labelInfos} : {
    pairs: [string, number][],
    labelInfos: ApiT.LabelInfo[]
  }) {
    return <CommaList>
      { _.map(pairs, (p) => <InlineLabel key={p[0]} id={p[0]}
          labelInfos={labelInfos} />) }
    </CommaList>;
  }

  function InlineLabel({id, labelInfos}: {
    id: string,
    labelInfos: ApiT.LabelInfo[]
  }) {
    let labelInfo = _.find(labelInfos, {normalized: id});
    let bg = labelInfo ? labelInfo.color : (
      id.charAt(0) === '#' ? Colors.getColorForHashtag(id) : Colors.lightGray
    );
    let displayAs = labelInfo ? labelInfo.original : id;
    return <Components.Badge color={bg} text={displayAs} />;
  }
}
