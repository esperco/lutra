/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../common/Layout.tsx" />
/// <reference path="./Charts.tsx" />
/// <reference path="./TimeStats.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./Components.LabelSelector.tsx" />

module Esper.Charts {
  interface LabelFilterParams {
    labels: Actions.ListSelectJSON;
  }

  /*
    Base class for chart with labels (using stats2 API)
  */
  export abstract class LabelChart extends EventChart<LabelFilterParams> {
    protected eventsByLabel: EventStats.EventGrouping;
    protected allLabels: Labels.Label[];
    protected allowUnlabeled: boolean;

    cleanFilterParams(params: any = {}): LabelFilterParams {
      params = params || {};
      var ret = params as LabelFilterParams;
      ret.labels = Actions.cleanListSelectJSON(ret.labels);
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

    noDataMsg() {
      return <span>
        No data found.{" "}
        <a onClick={() => Route.nav.path("/list")}>
          Click here to label events from your calendar.
        </a>
      </span>;
    }

    // Render label selector based on what labels are actually there
    renderSelectors() {
      return <div className="esper-menu-section">
        <div className="esper-subheader">
          <i className="fa fa-fw fa-tags" />{" "}
          Labels
        </div>
        <Components.LabelSelector labels={this.allLabels}
          totalCount={this.events.length}
          unlabeledCount={this.eventsByLabel.none.length}
          selected={this.getSelectedLabels()}
          allSelected={this.showAll()}
          unlabeledSelected={this.showUnlabeled()}
          showUnlabeled={this.allowUnlabeled}
          updateFn={(x) => this.updateLabels(x)}
        />
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
          some: labels,
          unmatched: current.unmatched
        }
      } as LabelFilterParams);
    }
  }
}
