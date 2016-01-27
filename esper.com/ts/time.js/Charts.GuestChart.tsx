/*
  Component for selecting guest domain names
*/

/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="./Colors.ts" />
/// <reference path="./Charts.AutoChart.tsx" />
/// <reference path="./DailyStats.ts" />
/// <reference path="./Components.ListSelector.tsx" />
/// <reference path="./Components.Section.tsx" />

module Esper.Charts {
  interface DomainSelection {
    empty: boolean;     // Is the "no guests" domain selected?
    domains: string[];
  }

  export var DomainSelectStore = new Model.StoreOne<DomainSelection>();

  function updateDomains(selections: {id: string}[]) {
    var newSelections: DomainSelection = {empty: false, domains: []};
    _.each(selections, (s) => {
      if (s.id) {
        newSelections.domains.push(s.id);
      } else if (s.id === "") {
        newSelections.empty = true;
      }
    });
    DomainSelectStore.set(newSelections);
  }

  interface DomainSelectorProps {
    stats: ApiT.DailyStatsResponse,
    allowEmpty?: boolean; // Allow selection of empty or "no guests" domain
  }


  /*
    Base class for auto-chart with guest domain selector
  */
  export abstract class GuestChart extends AutoChart {
    protected allowEmpty = false;

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
      var domainSelection = DomainSelectStore.val();
      if (domainSelection) {
        return domainSelection.domains;
      }

      if (! domains) {
        var pair = this.sync();
        var stats = pair && pair[0];
        domains = stats ? DailyStats.topGuestDomains(stats) : [];
      }

      // Default selection => all domains
      return _.map(domains, (d) => d.domain);
    }

    protected showEmptyDomain() {
      var domainSelection = DomainSelectStore.val();
      if (domainSelection) {
        return domainSelection.empty;
      }
      return this.allowEmpty;
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
        groups[0].choices.unshift({
          id: "",
          displayAs: "No Guests",
          badgeText: noGuestsCount.toString(),
          badgeColor: Colors.lightGray
        });

        if (this.showEmptyDomain()) {
          selectedIds = [""].concat(selectedIds);
        }
      }

      return <Components.BorderlessSection
              icon="fa-users" title="Select Domains">
        <Components.ListSelector groups={groups}
          selectOption={Components.ListSelectOptions.MULTI_SELECT}
          selectedIds={ _.map(selectedIds, (s) => {
            return { id: s, groupId: "" }
          }) }
          updateFn={updateDomains} />
      </Components.BorderlessSection>;
    }
  }
}
