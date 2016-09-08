/*
  Component for selecting a bunch of labels.
*/

/// <reference path="./Components.CalcUI.tsx" />

module Esper.Components {
  export class LabelCalcSelector extends CalcUI<Types.EventOptGrouping, {
    id?: string;
    calculation: EventStats.LabelCountCalc;
    team: ApiT.Team;
    selected: Params.ListSelectJSON;
    updateFn: (x: Params.ListSelectJSON) => void;
  }> {
    render() {
      return this.state.result.match({
        none: () => <div className="esper-no-content">
          { Text.UICalculating }
        </div>,
        some: (optGroups) => {
          var choices = _.map(optGroups.some, (v, k) => ({
            id: k,
            displayAs: Labels.getDisplayAs(k),
            badgeText: v.totalUnique.toString(),
            badgeHoverText: Text.events(v.totalUnique),
            badgeColor: Colors.getColorForLabel(k)
          }));

          // Get team labels too
          _.each(this.props.team.team_api.team_labels, (label, i) => {
            choices.push({
              id: label.normalized,
              displayAs: label.original,
              badgeText: undefined,
              badgeHoverText: undefined,
              badgeColor: Colors.getColorForLabel(label.normalized)
            })
          });
          choices = _(choices)
            .uniqBy((c) => c.id)
            .sortBy((c) => Labels.normalizeForSort(c.displayAs))
            .value();

          if (_.isEmpty(choices)) {
            return <div className="esper-no-content">
              <a href={Paths.Time.labelSetup().href}>
               { Text.NoLabelsMessage }
              </a>
            </div>;
          }

          return <Components.ListSelectorASN
            choices={choices}
            selected={this.props.selected}
            updateFn={this.props.updateFn}
            allChoice={{
              displayAs: Text.AllLabels,
              badgeText: optGroups.totalUnique.toString(),
              badgeHoverText: Text.events(optGroups.totalUnique),
            }}
            noneChoice={{
              displayAs: Text.Unlabeled,
              badgeText: optGroups.none ?
                optGroups.none.totalUnique.toString() : undefined,
              badgeHoverText: optGroups.none ?
                Text.events(optGroups.none.totalUnique) : undefined,
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

  export class LabelCalcDropdownSelector extends LabelCalcSelector {
    render() {
      // Dropdown input text
      let selectedText = (() => {
        if (this.props.selected.all) {
          return this.props.selected.none ?
            Text.AllLabels :
            Text.HideUnlabled
        }

        let labels = _.map(this.props.selected.some, Labels.getDisplayAs);
        if (this.props.selected.none) {
          labels.push(Text.Unlabeled);
        }
        return labels.join(", ");
      })();

      return <Dropdown keepOpen={true}>
        <Selector id={this.props.id} className="dropdown-toggle">
          { selectedText }
        </Selector>
        <div className="dropdown-menu">
          { super.render() }
        </div>
      </Dropdown>;
    }
  }



  // Labels from events
  function LabelListSelector({result, team, selected, updateFn} : {
    result: Option.T<Types.EventOptGrouping>;
    team: ApiT.Team;
    selected: Params.ListSelectJSON;
    updateFn: (x: Params.ListSelectJSON) => void;
  }) {

  }


  /*
    NB: LabelSelector is deprecated. Plan is switch over to LabelCalcSelector
    above eventually. The one thing it doesn't do yet is have an option for
    unconfirmed labels, but we might create a separate selector for that
    later.
  */
  interface LabelSelectorProps {
    className?: string;
    labels: Array<Labels.LabelCount>;
    totalCount?: number;
    unlabeledCount?: number;
    unconfirmedCount?: number;
    selected: string[];
    allSelected?: boolean;
    unlabeledSelected?: boolean;
    showUnlabeled?: boolean;
    unconfirmedSelected?: boolean;
    updateFn: (x: {
      all: boolean;
      unlabeled: boolean;
      labels: string[];
    }) => void;
    onUnconfirmedClick?: () => void;
  }

  export function LabelSelector(props: LabelSelectorProps) {
    // Only one group for now
    var groups = [{
      id: "",
      choices: _.map(props.labels, (l) => ({
        id: l.id,
        displayAs: l.displayAs,
        badgeText: l.count ? l.count && l.count.toString() : "",
        badgeHoverText: l.count ? (l.count && l.count.toString() +
          " Event" + (l.count == 1 ? "" : "s")) : "",
        badgeColor: Colors.getColorForLabel(l.id)
      }))
    }];

    // Handle selection
    var selectedIds = (() => {
      if (props.allSelected) {
        return _.map(props.labels, (l) => l.id)
      }
      return props.selected;
    })();

    // Conform to ListSelector syntax
    var selectedIdsWithGroups = _.map(selectedIds, (l) => ({
      id: l,
      groupId: ""
    }));

     /////

    var allSelected = props.allSelected ||
      (selectedIds.length === props.labels.length &&
       (props.unlabeledSelected || !props.showUnlabeled));
    var unlabeledSelected = props.allSelected || props.unlabeledSelected;
    var someSelected = allSelected || selectedIds.length ||
      (props.unlabeledSelected && props.showUnlabeled);

    function toggleAll() {
      props.updateFn(someSelected ? {
        all: false,
        unlabeled: false,
        labels: []
      } : {
        all: true,
        unlabeled: true,
        labels: []
      });
    }

    function toggleUnlabel() {
      props.updateFn(props.unlabeledSelected ? {
        all: false,
        unlabeled: false,
        labels: selectedIds
      } : {
        all: props.selected.length === props.labels.length,
        unlabeled: true,
        labels: selectedIds
      });
    }

    function updateLabels(labels: {id: string; groupId: string}[]) {
      props.updateFn({
        all: labels.length === props.labels.length && unlabeledSelected,
        unlabeled: unlabeledSelected,
        labels: _.map(labels, (l) => l.id)
      });
    }


    /////

    var selectAllIcon = (() => {
      if (allSelected) {
        return "fa-check-square-o";
      } else if (someSelected) {
        return "fa-minus-square-o";
      } else {
        return "fa-square-o";
      }
    })();

    return <div className={props.className || "esper-select-menu"}>
      <div className="esper-select-menu">
        <a className="esper-selectable"
           onClick={toggleAll}>
          <span className="badge">{ props.totalCount }</span>
          <i className={"fa fa-fw " + selectAllIcon} />{" "}
          Select All
        </a>
      </div>

      { groups[0].choices.length > 0 ?
        <ListSelector groups={groups} selectedIds={selectedIdsWithGroups}
          selectOption={ ListSelectOptions.MULTI_SELECT }
          selectedItemClasses="active"
          className="esper-select-menu"
          listClasses="esper-select-menu"
          itemClasses="esper-selectable"
          headerClasses="esper-select-header"
          updateFn={updateLabels}
        /> : null }

      { props.showUnlabeled ?
        <div className="esper-select-menu">
        <a className="esper-selectable"
           onClick={toggleUnlabel}>
          {
            props.unlabeledCount ?
            <span className="badge">{ props.unlabeledCount }</span> :
            null
          }
          <i className={"fa fa-fw " + (unlabeledSelected ?
            "fa-check-square-o" : "fa-square-o")} />{" "}
          { Text.Unlabeled }
        </a>
      </div> : null }

      { props.onUnconfirmedClick ?
        <div className="esper-select-menu">
        <a className="esper-selectable"
           onClick={() => props.onUnconfirmedClick()}>
          {
            props.unconfirmedCount ?
            <span className={classNames("badge", "unconfirmed", {
              active: props.unconfirmedSelected
            })}>
              { props.unconfirmedCount }
            </span> : null
          }
          <i className="fa fa-fw fa-flash" />{" "}
          { Text.Unconfirmed }
        </a>
      </div> : null }

      <div className="esper-select-menu">
        <a className="esper-selectable"
           href={Paths.Manage.Team.labels().href}>
          <i className="fa fa-fw fa-bars" />{" "}
          { Text.ManageLabels }
        </a>
      </div>
    </div>;
  }

  export function LabelSelectorDropdown(props: LabelSelectorProps) {
    // Dropdown input text
    var selectedText = (() => {
      if (props.unconfirmedSelected) {
        return Text.Unconfirmed;
      }
      if (props.allSelected) {
        return Text.AllLabels;
      }
      var labels = _.map(
        _.filter(props.labels, (l) => _.includes(props.selected, l.id)),
        (l) => l.displayAs);
      if (props.unlabeledSelected) {
        labels.push(Text.Unlabeled);
      }
      return labels.join(", ");
    })();

    return <div className="input-group cal-selector">
      <span className="input-group-addon">
        <i className="fa fa-fw fa-tag" />
      </span>
      <Dropdown keepOpen={true}>
        <Selector className="dropdown-toggle end-of-group">
          { selectedText }
        </Selector>
        {
          LabelSelector(_.extend({
            className: "dropdown-menu"
          }, props) as LabelSelectorProps)
        }
      </Dropdown>
    </div>;
  }
}
