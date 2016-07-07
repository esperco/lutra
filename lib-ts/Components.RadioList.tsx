/*
  A preset list-selector intended to resemble how radio buttons normally work,
  but using FontAwesome icons
*/

/// <reference path="./Components.ListSelector.tsx" />

module Esper.Components {
  interface Props {
    choices: ListChoice[];
    selectedId: string;
    updateFn: (ids: string) => void;
  }

  export function RadioList(props: Props) {
    return <ListSelectorSimple
      choices={props.choices}
      selectedIds={[props.selectedId]}
      updateFn={(id) => props.updateFn(id[0])}
      selectOption={ListSelectOptions.SINGLE_SELECT}

      selectedIcon="fa-check-circle-o"
      unselectedIcon="fa-circle-thin"

      className="esper-radio-list"
      listClasses="esper-flex-list esper-select-menu"
      itemClasses="esper-selectable"
      selectedItemClasses="active"
    />;
  }
}
