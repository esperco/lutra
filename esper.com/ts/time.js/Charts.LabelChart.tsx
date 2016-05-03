/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Charts.tsx" />
/// <reference path="./Colors.ts" />
/// <reference path="./Components.LabelSelector.tsx" />

module Esper.Charts {
  interface LabelFilterParams extends Params.RelativePeriodJSON {
    labels: Params.ListSelectJSON;
  }

  /*
    Base class for chart with labels
  */
  export abstract class LabelChart extends EventChart<LabelFilterParams> {
    protected eventsByLabel: EventStats.EventGrouping;
    protected allLabels: Labels.Label[];
    protected allowUnlabeled: boolean;

    cleanFilterParams(filterParams: any = {},
                      params: DefaultEventChartParams): LabelFilterParams
    {
      var ret = super.cleanFilterParams(filterParams,
                                        params) as LabelFilterParams;

      // By default, select first team labels only
      ret.labels = ret.labels ? Params.cleanListSelectJSON(ret.labels) : {
        all: false,
        none: true,
        some: params.cals[0] ?
          Teams.require(params.cals[0].teamId).team_labels_norm : []
      };
      return ret;
    }

    sync() {
      super.sync();
      this.allLabels = Labels.fromEvents(this.events, Teams.all());
      this.eventsByLabel = Partition.groupByMany(this.events,
        (e) => e.labels_norm
      );
    }

    protected getSelectedLabels(): string[] {
      var params = this.params.filterParams.labels;
      if (params.all) {
        return _.map(this.allLabels, (l) => l.id);
      }
      return params.some;
    }

    protected showAll() {
      return this.getSelectedLabels().length >= this.allLabels.length
        && this.showUnlabeled();
    }

    protected showUnlabeled() {
      return this.allowUnlabeled && (
        this.params.filterParams.labels.all ||
        this.params.filterParams.labels.none
      );
    }

    noData() {
      if (this.showUnlabeled() && this.eventsByLabel.none.length > 0) {
        return false;
      }

      var labels = this.getSelectedLabels();
      return !_.find(this.eventsByLabel.some,
        (s) => s.items.length > 0 && _.includes(labels, s.key)
      )
    }

    noDataMsg() {
      return <span>
        No events found.{" "}
        <a onClick={() => Route.nav.path("/list")}>
          Click here to label events from your calendar.
        </a>
      </span>;
    }

    // Render label selector based on what labels are actually there
    renderSelectors() {
      var total = this.events.length;
      var unlabeled = this.eventsByLabel.none.length;
      var showUnlabeled = this.showUnlabeled();
      var displayTotal = showUnlabeled ? total : total - unlabeled;
      return <div className="esper-menu-section">
        { super.renderSelectors() }
        <div className="esper-menu-section">
          <div className="esper-subheader">
            <i className="fa fa-fw fa-tags" />{" "}
            Labels
          </div>
          <Components.LabelSelector labels={this.allLabels}
            totalCount={displayTotal}
            unlabeledCount={this.eventsByLabel.none.length}
            selected={this.getSelectedLabels()}
            allSelected={this.showAll()}
            unlabeledSelected={showUnlabeled}
            showUnlabeled={this.allowUnlabeled}
            updateFn={(x) => this.updateLabels(x)}
          />
        </div>
      </div>;
    }

    /* Actions */

    updateLabels({all, unlabeled, labels}: {
      all: boolean;
      unlabeled: boolean;
      labels: string[];
    }) {
      var current = this.params.filterParams.labels;
      Route.nav.query({
        labels: {
          all: all,
          none: unlabeled,
          some: labels
        }
      } as LabelFilterParams);
    }
  }
}
