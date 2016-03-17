/*
  Component for selecting guest domain names
*/

/// <reference path="./Colors.ts" />
/// <reference path="./Charts.AutoChart.tsx" />
/// <reference path="./DailyStats.ts" />
/// <reference path="./Components.ListSelector.tsx" />

module Esper.Charts {
  interface DomainChartParams {
    emptyDomain?: boolean;  // Is the "no guests" domain selected?
    allDomains?: boolean;   // Show all domains -- alternate to listing
    domains?: string[];
  }

  export interface GuestChartJSON extends Charts.ChartJSON {
    chartParams?: DomainChartParams
  }

  /*
    Base class for auto-chart with guest domain selector
  */
  export abstract class GuestChart extends AutoChart<GuestChartJSON> {
    protected allowEmpty = false;

    cleanParams(params: GuestChartJSON|ChartJSON): GuestChartJSON {
      var cleaned = super.cleanParams(params);
      if (! _.isBoolean(cleaned.chartParams.emptyDomain)) {
        cleaned.chartParams.emptyDomain = this.allowEmpty;
      }
      if (! _.isBoolean(cleaned.chartParams.allDomains)) {
        cleaned.chartParams.allDomains = true;
      }
      if (! cleaned.chartParams.domains) {
        cleaned.chartParams.domains = [];
      }
      if (! _.every(cleaned.chartParams.domains, (d) => _.isString(d))) {
        cleaned.chartParams.domains = [];
      }
      return cleaned;
    }

    noData() {
      if (this.allowEmpty) {
        return super.noData();
      }
      var data = this.sync()[0];
      return !_.find(data.daily_stats,
        (s) => s.with_guests && s.with_guests.length
      );
    }

    protected getSelectedDomains(
      domains?: DailyStats.GuestDomainDisplayResult[])
    {
      if (! this.params.chartParams.allDomains) {
        return this.params.chartParams.domains;
      }

      if (! domains) {
        // All domains
        var pair = this.sync();
        var stats = pair && pair[0];
        domains = stats ? DailyStats.topGuestDomains(stats) : [];
      }

      // Default selection => all domains
      return _.map(domains, (d) => d.domain);
    }

    protected showEmptyDomain() {
      return this.allowEmpty && (
        this.params.chartParams.allDomains ||
        this.params.chartParams.emptyDomain
      );
    }

    renderSelectors() {
      var pair = this.sync();
      var stats = pair && pair[0];
      if (! stats) {
        return <span />
      }

      var domains = DailyStats.topGuestDomains(stats);
      var groups = [{
        id: "",
        choices: _.map(domains, (g) => {
          return {
            id: g.domain,
            displayAs: g.domain,
            badgeText: g.guests.length.toString(),
            badgeColor: Colors.getColorForDomain(g.domain)
          }
        })
      }];

      // Default selection => all domains
      var selectedIds = this.getSelectedDomains(domains);

      // Use empty string as the "no guests" domain
      if (this.allowEmpty) {
        var noGuestsCount =
          DailyStats.sumScheduledCount(stats) -
          DailyStats.sumWithGuestsCount(stats)

        var emptySelector = <div className="esper-select-menu">
          <a className="esper-selectable"
             onClick={this.toggleEmpty.bind(this)}>
            {
              noGuestsCount ?
              <span className="badge">{ noGuestsCount }</span> :
              null
            }
            <i className={"fa fa-fw " + (this.showEmptyDomain() ?
              "fa-check-square-o" : "fa-square-o")} />{" "}
            No Guests
          </a>
          <div className="divider" />
        </div>;
      }

      var totalCount = this.allowEmpty ?
        DailyStats.sumScheduledCount(stats) :
        DailyStats.sumWithGuestsCount(stats);

      var selectAllIcon = (() => {
        if (this.params.chartParams.allDomains) {
          return "fa-check-square-o";
        } else if (selectedIds.length) {
          return "fa-minus-square-o";
        } else {
          return "fa-square-o"
        }
      })();

      return <div className="esper-menu-section">
        <div className="esper-subheader">
          <i className="fa fa-fw fa-users" />{" "}
          Domains
        </div>
        <div className="esper-select-menu">
          <a className="esper-selectable"
             onClick={this.toggleAll.bind(this)}>
            <span className="badge">{ totalCount }</span>
            <i className={"fa fa-fw " + selectAllIcon} />{" "}
            Select All
          </a>
          <div className="divider" />
        </div>
        { this.allowEmpty ? emptySelector : null }
        <Components.ListSelector groups={groups}
          selectOption={Components.ListSelectOptions.MULTI_SELECT}
          selectedIds={ _.map(selectedIds, (s) => {
            return { id: s, groupId: "" }
          }) }
          selectedItemClasses="active"
          listClasses="esper-select-menu"
          itemClasses="esper-selectable"
          headerClasses="esper-select-header"
          updateFn={this.updateDomains.bind(this)} />
      </div>;
    }

    //////

    updateDomains(selections: {id: string}[]) {
      var pair = this.sync();
      var stats = pair && pair[0];
      if (! stats) { return; }
      var domains = DailyStats.topGuestDomains(stats);
      var maxDomains = domains.length;

      if (selections.length === maxDomains &&
          (this.showEmptyDomain() || !this.allowEmpty))
      {
        this.updateSelections({
          allDomains: true,
          emptyDomain: this.allowEmpty,
          domains: []
        });
      } else {
        this.updateSelections({
          allDomains: false,
          domains: _.map(selections, (s) => s.id)
        });
      }
    }

    toggleAll() {
      if (this.getSelectedDomains().length) {
        this.updateSelections({
          allDomains: false,
          emptyDomain: false,
          domains: []
        });
      } else {
        this.updateSelections({
          allDomains: true,
          emptyDomain: this.allowEmpty,
          domains: []
        });
      }
    }

    toggleEmpty() {
      var pair = this.sync();
      var stats = pair && pair[0];
      if (! stats) { return; }
      var allDomains = _.map(DailyStats.topGuestDomains(stats),
        (d) => d.domain
      );
      var currentDomains = this.params.chartParams.domains || [];

      if (this.showEmptyDomain()) {
        this.updateSelections({
          allDomains: false,
          emptyDomain: false,
          domains: (currentDomains.length ? currentDomains : allDomains)
        });
      } else {
        this.updateSelections({
          allDomains: currentDomains.length === allDomains.length,
          emptyDomain: true,
          domains: currentDomains
        });
      }
    }

    updateSelections(newParams: DomainChartParams) {
      newParams = _.extend({},
        this.params.chartParams,
        newParams) as DomainChartParams;
      this.updateRoute({
        props: this.extendCurrentProps({
          chartParams: newParams
        })
      });
    }
  }
}
