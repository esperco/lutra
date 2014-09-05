module Esper.Tab3Content {

  export function displayTab3ComingSoon(tab3) {
'''
<div #view>
  <div #linkActions class="esper-tab-header"/>
  <div #comingSoon class="esper-coming-soon">
    <object #truck class="esper-svg"/>
    <div #comingSoonText class="esper-coming-soon-text"/>
  </div>
  <div #events class="esper-linked-events"/>
</div>
'''

    truck.attr("data", Init.esperRootUrl + "img/truck.svg");
    comingSoonText.text("New features are coming. " +
      "Check back soon!");

    tab3.append(view);
  }

}
