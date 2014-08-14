module Esper.Tab2Content {

  export function displayTab2ComingSoon(tab2) {
'''
<div #view>
  <div #linkActions class="esper-tab-header"/>
  <div #comingSoon class="esper-coming-soon">
    <img #truck/>
    <div #comingSoonText class="esper-coming-soon-text"/>
  </div>
  <div #events class="esper-linked-events"/>
</div>
'''

    truck.attr("src", Init.esperRootUrl + "img/truck.png");
    comingSoonText.text("New features are coming. " +
      "Check back soon!");

    tab2.append(view);
  }

}
