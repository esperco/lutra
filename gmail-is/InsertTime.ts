module Esper.InsertTime {

  /** Returns a _view that contains Esper-specific controls for the
   *  composition view. (Right now, the only control is a button for
   *  inserting the times of linked events.)
   */
  function esperToolbar() {
'''
<tr #bar class="esper-toolbar">
  <img #logo alt=""/>
  <span #events> No linked events. </span>
  <button #insert>Insert</button>
</tr>
'''
    logo.attr("src", Init.esperRootUrl + "img/footer-logo.png");

    return _view;
  }
}