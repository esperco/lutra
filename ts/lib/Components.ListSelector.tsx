/*
  Component for selecting (multiple) things in a list. Supports grouping
  by a category, badges, and custom icons.
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Components.Badge.tsx" />
/// <reference path="./Params.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface ListSelectorBaseProps {
    selectOption?: ListSelectOptions;
    selectedIcon?: string;    // Font-awesome icon
    unselectedIcon?: string;  // Font-awesome icon

    className?: string;
    listClasses?: string;
    itemClasses?: string;
    headerClasses?: string;
    selectedItemClasses?: string;
  }

  interface ListSelectorProps extends ListSelectorBaseProps {
    groups: Group[];
    selectedIds: SelectedIds[]; // Id of list choice
    updateFn: (selectedIds: SelectedIds[]) => void;
  }

  export enum ListSelectOptions {
    SINGLE_SELECT,  // Select exactly one item
    MULTI_SELECT,   // Select 0 - many items
    SINGLE_SELECT_PER_GROUP,  // Select exactly one item per group
    MULTI_SELECT_ONE_GROUP    // Select multiple but only in one group
  }

  // Group of choies
  interface Group {
    id: string;
    displayAs?: string|JSX.Element;
    choices: ListChoice[];
  }

  // For special, meta chocies like "Select All"
  interface SpecialChoice {
    displayAs: string|JSX.Element;
    badgeText?: string;
    badgeHoverText?: string;
    badgeColor?: string;
  }

  // Single item in list
  export interface ListChoice extends SpecialChoice {
    id: string;
  }

  // Selection -- if using groups, groupIds are included
  interface SelectedIds {
    id: string;
    groupId: string;
  }

  export class ListSelector extends Component<ListSelectorProps, {}>
  {
    render() {
      return <div className={this.props.className}>
        { _.map(this.props.groups, this.renderGroup.bind(this)) }
      </div>;
    }

    renderGroup(group: Group, count: number) {
      return <div key={group.id}>
        {
          group.displayAs ?
          <div className={ this.props.headerClasses || "esper-subheader"}>
            {group.displayAs}
          </div> : null
        }
        <div className={this.props.listClasses || "list-group"}>{
          _.map(group.choices, (opts) => {
            var selectedIcon = this.props.selectedIcon ||
              (opts.badgeColor ? "fa-check-square" : "fa-check-square-o");
            var unselectedIcon = this.props.unselectedIcon ||
              (opts.badgeColor ? "fa-square" : "fa-square-o");
            var iconStyle = ((): {color?: string} => {
              if (opts.badgeColor) {
                return { color: opts.badgeColor };
              }
              return {};
            })();


            var selected = this.isSelected(group.id, opts.id);

            var badge = opts.badgeText ? <Components.BadgeLight
              text={opts.badgeText}
              hoverText={opts.badgeHoverText}
              color={selected && opts.badgeColor}
            /> : null;

            var clickHandler = () => {
              this.handleClick(group.id, opts.id, !selected);
            };
            var itemClasses =
              (this.props.itemClasses || "list-group-item one-line") + " " +
              (selected ? this.props.selectedItemClasses || "" : "");

            return <a onClick={clickHandler} key={group.id + " " + opts.id}
              className={itemClasses}>
              {badge}
              <i style={iconStyle} className={"fa fa-fw " +
                (selected ? selectedIcon : unselectedIcon)} />
              {" "}{opts.displayAs}
            </a>
          })
        }</div>
      </div>;
    }

    handleClick(groupId: string, id: string, newChecked: boolean) {
      var opt = this.props.selectOption;
      if (opt === ListSelectOptions.SINGLE_SELECT || _.isUndefined(opt)) {
        this.props.updateFn([{
          groupId: groupId,
          id: id
        }]);
      }

      else {
        var selected = _.clone(this.props.selectedIds);
        if (opt === ListSelectOptions.SINGLE_SELECT_PER_GROUP) {
          _.remove(selected, (s) => s.groupId === groupId);
        }

        else if (opt === ListSelectOptions.MULTI_SELECT_ONE_GROUP) {
          _.remove(selected,
            (s) => s.groupId !== groupId || s.id === id
          );
        }

        else { // Multi-select
          _.remove(selected,
            (s) => s.groupId === groupId && s.id === id
          );
        }

        if (newChecked) {
          selected.push({
            groupId: groupId,
            id: id
          });
        }
        this.props.updateFn(selected);
      }
    }

    isSelected(groupId: string, id: string) {
      return !!_.find(this.props.selectedIds,
        (s) => (s.groupId || "") === groupId && s.id === id
      );
    }
  }


  /* Variant of the above, with no groups */

  interface ListSelectorSimpleProps extends ListSelectorBaseProps {
    choices: ListChoice[];
    selectedIds: string[]; // Subset of chocies

    updateFn: (ids: string[]) => void;
  }

  export function ListSelectorSimple(props: ListSelectorSimpleProps) {
    var selectedIds = _.map(props.selectedIds, (s) => ({
      groupId: "",
      id: s
    }));

    // Ignore groupId here
    var updateFn =
      (ids: SelectedIds[]) => props.updateFn(_.map(ids, (i) => i.id))

    return <ListSelector
      groups={[{
        id: "",
        choices: props.choices
      }]}
      selectedIds={selectedIds}
      updateFn={updateFn}

      selectOption={props.selectOption}
      selectedIcon={props.selectedIcon}
      unselectedIcon={props.unselectedIcon}

      className={props.className}
      listClasses={props.listClasses}
      itemClasses={props.itemClasses}
      headerClasses={props.headerClasses}
      selectedItemClasses={props.selectedItemClasses}
    />;
  }


  /* Variant of the above, but using Params.ListSelectJSON */

  // ASN = All-Some-None
  interface ListSelectorASNProps extends ListSelectorBaseProps {
    choices: ListChoice[];
    selected: Params.ListSelectJSON; // Subset of chocies
    updateFn: (x: Params.ListSelectJSON) => void;
    allChoice?: SpecialChoice; // Select All
    noneChoice?: SpecialChoice; // None of the above
  }

  export function ListSelectorASN(props: ListSelectorASNProps) {
    var allIds = _.map(props.choices, (c) => c.id);
    var selectedIds = props.selected.all ? allIds :
      _.intersection(props.selected.some, allIds);

    var noneSelected = props.noneChoice && props.selected.none;
    var allSelected: boolean|"some" =
      (noneSelected || !props.noneChoice) &&
      (props.selected.all || selectedIds.length === allIds.length);
    if (!allSelected && (selectedIds.length || noneSelected)) {
      allSelected = "some";
    }

    return <div className={props.className}>
      { props.allChoice ? <SpecialSelector
        selected={allSelected}
        choice={props.allChoice}
        onClick={(x) => props.updateFn({
          all: x,
          none: x ? !!props.noneChoice : false,
          some: []
        })}
      /> : null }

      <ListSelectorSimple
        choices={props.choices}
        selectedIds={selectedIds}
        updateFn={(ids) => {
          let allSelected = allIds.length === ids.length;
          props.updateFn({
            all: allSelected,
            none: props.selected.none,
            some: allSelected ? [] : ids
          })
        }}

        selectOption={Components.ListSelectOptions.MULTI_SELECT}
        selectedIcon={props.selectedIcon}
        unselectedIcon={props.unselectedIcon}

        className={props.listClasses}
        listClasses={props.listClasses}
        itemClasses={props.itemClasses}
        headerClasses={props.headerClasses}
        selectedItemClasses={props.selectedItemClasses}
      />

      { props.noneChoice ? <SpecialSelector
        selected={noneSelected}
        choice={props.noneChoice}
        onClick={(x) => props.updateFn({
          all: props.selected.all,
          none: x,
          some: props.selected.some
        })}
      /> : null }
    </div>;
  }

  function SpecialSelector({
    selected, onClick, className, itemClasses, choice
  }: {
    selected: boolean|"some";
    onClick: (selected: boolean) => void;
    className?: string;
    itemClasses?: string;
    choice: SpecialChoice;
  }) {
    var icon = (() => {
      if (selected === true) {
        return "fa-check-square-o";
      } else if (selected === "some") {
        return "fa-minus-square-o";
      } else {
        return "fa-square-o"
      }
    })();

    var badge = choice.badgeText ? <Components.BadgeLight
      text={choice.badgeText}
      hoverText={choice.badgeHoverText}
      color={selected && choice.badgeColor}
    /> : null;

    return <div className={classNames(className, "esper-select-menu")}>
      <a className={classNames(itemClasses || "esper-selectable", {
        active: selected === true
      })} onClick={() => onClick(!selected)}>
        { badge }
        <i className={"fa fa-fw " + icon} />{" "}
        { choice.displayAs }
      </a>
    </div>;
  }
}
