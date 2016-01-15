/*
  Settings Footer
*/

module Esper.Footer {

/* Added an "onboarding" field so we can hide the footer if we are in onboarding flow .
Footer.load() can still be called due to default value, only Footer.load(true) will disable. */

export function load(onboarding = false) {

  // NB: Check with Nina and/or Mackenzie before uncommenting Chrome install link
'''
<div #view class="footer clearfix">
  <ul class="col-xs-2">
    <li class="footer-header">Esper</li>
    <!-- <li><a href="https://chrome.google.com/webstore/detail/esper/jabkchbdomjjlbahjdjemnnghkakfcog"
           target="_blank" class="gray-link">Install</a></li> -->
    <li><a href="http://esper.com/team" target="_blank"
           class="gray-link">About</a></li>
    <li><a href="http://esper.com/jobs" target="_blank"
           class="gray-link">Careers</a></li>
    <li><a href="http://blog.esper.com" target="_blank"
           class="gray-link">Blog</a></li>
    <li><a href="http://tech.esper.com" target="_blank"
           class="gray-link">Tech Blog</a></li>
  </ul>
  <ul class="col-xs-2">
    <li class="footer-header">Support</li>
    <li><a href="http://esper.com/contact" target="_blank"
           class="gray-link">Contact</a></li>
    <li><a href="http://esper.com/privacy-policy" target="_blank"
           class="gray-link">Privacy</a></li>
    <li><a href="http://esper.com/terms-of-use" target="_blank"
           class="gray-link">Terms</a></li>
  </ul>
  <div class="col-xs-8">
    <a #wordMarkContainer href="http://esper.com" target="_blank"
       class="img-container-right"/>
  </div>
</div>
'''
    var wordMark = $("<img class='svg-block word-mark'/>")
      .appendTo(wordMarkContainer);
    Svg.loadImg(wordMark, "/assets/img/word-mark.svg");

    if (onboarding) {
      view.hide();
    }

    return view;
  }

}
