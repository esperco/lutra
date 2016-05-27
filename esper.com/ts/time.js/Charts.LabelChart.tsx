/// <reference path="./Charts.tsx" />

module Esper.Charts {
  /*
    Should we auto-launch the modal to confirm events? Only do so first time
    we encounter un-confirmed events. After that, set this var to false.
  */
  var autoLaunchConfirm = true;

  interface LabelFilterParams extends Params.RelativePeriodJSON {
    labels: Params.ListSelectJSON;
  }

  /*
    Base class for chart with labels
  */
  export abstract class LabelChart extends EventChart<LabelFilterParams> {
    protected eventsByLabel: EventStats.EventGrouping;
    protected allLabels: Labels.LabelCount[];
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
          Stores.Teams.require(params.cals[0].teamId).team_labels_norm : []
      };
      return ret;
    }

    sync() {
      super.sync();
      this.allLabels = Labels.fromEvents(this.events, Stores.Teams.all());
      this.eventsByLabel = Partition.groupByMany(this.events,
        (e) => Stores.Events.getLabelIds(e)
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
      var allIds = _.map(this.allLabels, (l) => l.id);
      return _.difference(allIds, this.getSelectedLabels()).length === 0
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

      var unconfirmed = _.filter(this.events,
        (e) => Stores.Events.needsConfirmation(e)
      );

      // Prioritize predictions and filter out recurring
      unconfirmed = Predictions.prioritize(unconfirmed);

      if (autoLaunchConfirm && unconfirmed.length > 0) {

        /*
          Place in requestAnimationFrame so modal rendering is outside of our
          current React render loop. Normally we don't want to trigger new
          React renderings from an existing render function (because of
          the potentional for infinite or long-last loops), but in this case,
          we're only doing it once, and the rendering is of a modal, which
          lives outside of the container that this chart selector is being
          rendered into.
        */
        window.requestAnimationFrame(
          () => this.launchConfirmModal(unconfirmed)
        );
      }

      return <div className="esper-menu-section">
        { super.renderSelectors() }
        <div className="esper-menu-section">
          <div className="esper-subheader">
            <i className="fa fa-fw fa-tags" />{" "}
            { Text.Labels }
          </div>
          <Components.LabelSelector labels={this.allLabels}
            totalCount={displayTotal}
            unlabeledCount={this.eventsByLabel.none.length}
            selected={this.getSelectedLabels()}
            allSelected={this.showAll()}
            unlabeledSelected={showUnlabeled}
            showUnlabeled={this.allowUnlabeled}
            updateFn={(x) => this.updateLabels(x)}
            unconfirmedCount={unconfirmed.length}
            onUnconfirmedClick={() => this.launchConfirmModal(unconfirmed)}
          />
        </div>
      </div>;
    }

    launchConfirmModal(events: Stores.Events.TeamEvent[]) {
      autoLaunchConfirm = false;
      Layout.renderModal(
        Containers.confirmListModal(events)
      );
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
