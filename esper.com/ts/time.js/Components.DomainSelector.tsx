/*
  Domain selection widget based on calc
*/

/// <reference path="./Components.SidebarSelector.tsx" />

module Esper.Components {
  export class DomainSelector extends DefaultSidebarSelector<{
    calculation: EventStats.DomainCountCalc;
    selected: Params.ListSelectJSON;
    updateFn: (x: Params.ListSelectJSON) => void;
  }> {
    renderHeader() {
      return <span>
        <i className="fa fa-fw fa-at" />{" "}
        { Text.GuestDomains }
      </span>;
    }

    renderContent() {
      return this.state.result.match({
        none: () => <span />,
        some: (result) => {
          var choices = _.map(result.some, (v, k) => ({
            id: k,
            displayAs: k,
            badgeText: v.totalUnique.toString(),
            badgeHoverText: Text.events(v.totalUnique),
            badgeColor: this.props.primary ?
              Colors.getColorForDomain(k) : undefined
          }));

          return <Components.ListSelectorASN
            choices={choices}
            selected={this.props.selected}
            updateFn={this.props.updateFn}
            allChoice={{
              displayAs: Text.SelectAll,
              badgeText: result.totalUnique.toString(),
              badgeHoverText: Text.events(result.totalUnique),
            }}
            noneChoice={{
              displayAs: Text.NoGuests,
              badgeText: result.none ?
                result.none.totalUnique.toString() : undefined,
              badgeHoverText: result.none ?
                Text.events(result.none.totalUnique) : undefined,
            }}
            selectedItemClasses="active"
            className="esper-select-menu"
            listClasses="esper-select-menu"
            itemClasses="esper-selectable"
          />;
        }
      });
    }
  }
}
