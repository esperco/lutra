/*
  Component for selecting guest domain names
*/

/// <reference path="./Charts.tsx" />

module Esper.Charts {
  interface DomainFilterParams extends Params.RelativePeriodJSON {
    domains: Params.ListSelectJSON;
  }

  /*
    Base class for auto-chart with guest domain selector
  */
  export abstract class GuestChart extends EventChart<DomainFilterParams> {
    protected allowEmpty: boolean;
    protected eventsByDomain: EventStats.EventGrouping;

    cleanFilterParams(filterParams: any = {},
                      params: DefaultEventChartParams): DomainFilterParams {
      var ret = super.cleanFilterParams(filterParams,
                                        params) as DomainFilterParams;
      ret.domains = Params.cleanListSelectJSON(ret.domains);
      return ret;
    }

    sync() {
      super.sync();
      this.eventsByDomain = Partition.groupByMany(this.events,
        (e) => Stores.Events.getGuestDomains(e)
      );
    }

    protected getSelectedDomains() {
      var params = this.params.filterParams.domains;
      var domains = _.map(this.eventsByDomain.some, (d) => d.key);
      if (params.all) {
        return domains;
      }
      return params.some;
    }

    protected showEmptyDomain() {
      return this.allowEmpty && (
        this.params.filterParams.domains.all ||
        this.params.filterParams.domains.none
      );
    }

    noData() {
      if (this.showEmptyDomain() && this.eventsByDomain.none.length > 0) {
        return false;
      }

      var labels = this.getSelectedDomains();
      return !_.find(this.eventsByDomain.some,
        (s) => s.items.length > 0 && _.includes(labels, s.key)
      )
    }

    renderSelectors() {
      if (!this.events || !this.events.length) {
        return <span />
      }

      var groups = [{
        id: "",
        choices: _.map(this.eventsByDomain.some, (d) => ({
          id: d.key,
          displayAs: d.key,
          badgeText: d.items.length.toString(),
          badgeHoverText: d.items.length.toString() + " Events",
          badgeColor: Colors.getColorForDomain(d.key)
        }))
      }];

      // Default selection => all domains
      var selectedIds = this.getSelectedDomains();
      var totalCount = this.events.length;
      var noGuestsCount = this.eventsByDomain.none.length;

      // Use empty string as the "no guests" domain
      if (this.allowEmpty) {
        var noGuestsCountStr = noGuestsCount.toString();
        var emptySelector = <div className="esper-select-menu">
          <a className="esper-selectable"
             onClick={this.toggleEmpty.bind(this)}>
            {
              noGuestsCount ?
              <Components.Badge
                text={noGuestsCountStr}
                hoverText={noGuestsCountStr + " Events"}
              /> :
              null
            }
            <i className={"fa fa-fw " + (this.showEmptyDomain() ?
              "fa-check-square-o" : "fa-square-o")} />{" "}
            No Guests
          </a>
          <div className="divider" />
        </div>;
      } else {
        totalCount -= noGuestsCount;
      }

      var totalCountStr = totalCount.toString();
      var selectAllIcon = (() => {
        if (this.params.filterParams.domains.all) {
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
            <Components.Badge
              text={totalCountStr}
              hoverText={totalCountStr + " Events"}
            />
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
      var maxDomains = this.eventsByDomain.some.length;
      if (selections.length === maxDomains &&
          (this.showEmptyDomain() || !this.allowEmpty))
      {
        this.updateSelections({
          all: true,
          none: this.allowEmpty,
          some: [],
        });
      } else {
        this.updateSelections({
          all: false,
          some: _.map(selections, (s) => s.id)
        });
      }
    }

    toggleAll() {
      if (this.getSelectedDomains().length) {
        this.updateSelections({
          all: false,
          none: false,
          some: []
        });
      } else {
        this.updateSelections({
          all: true,
          none: this.allowEmpty,
          some: []
        });
      }
    }

    toggleEmpty() {
      var allDomains = _.map(this.eventsByDomain.some, (d) => d.key);
      var currentDomains = this.params.filterParams.domains.some || [];
      if (this.showEmptyDomain()) {
        this.updateSelections({
          all: false,
          none: false,
          some: (currentDomains.length ? currentDomains : allDomains)
        });
      } else {
        this.updateSelections({
          all: currentDomains.length === allDomains.length,
          none: true,
          some: currentDomains
        });
      }
    }

    updateSelections({all, none, some}: {
      all?: boolean;
      none?: boolean;
      some?: string[]
    }) {
      var current = this.params.filterParams.domains;
      Route.nav.query({
        domains: {
          all: Util.some(all, current.all),
          none: Util.some(none, current.none),
          some: Util.some(some, current.some)
        }
      } as DomainFilterParams);
    }
  }
}
