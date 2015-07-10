/*
  Settings Footer
*/

module Footer {

/* Added an "onboarding" field so we can hide the footer if we are in onboarding flow .
Footer.load() can still be called due to default value, only Footer.load(true) will disable. */

export function load(onboarding = false) {
'''
<div #view class="footer clearfix">
  <ul class="col-xs-2">
    <li class="footer-header">Esper</li>
    <li><a href="https://chrome.google.com/webstore/detail/esper/jabkchbdomjjlbahjdjemnnghkakfcog"
           target="_blank" class="gray-link">Install</a></li>
    <li><a href="http://esper.com/team.html" target="_blank"
           class="gray-link">About us</a></li>
    <li><a href="http://blog.esper.com" target="_blank"
           class="gray-link">Blog</a></li>
    <li><a href="http://esper.com/jobs.html" target="_blank"
           class="gray-link">Jobs</a></li>
  </ul>
  <ul class="col-xs-2">
    <li class="footer-header">Support</li>
    <li><a href="http://esper.com/discover.html" target="_blank"
           class="gray-link">Getting started</a></li>
    <li><a href="http://esper.com/privacy-policy.html" target="_blank"
           class="gray-link">Privacy</a></li>
    <li><a href="http://esper.com/terms-of-use.html" target="_blank"
           class="gray-link">Terms</a></li>
    <li><a #contact href="#" class="gray-link">Contact us</a></li>
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

    contact.click(function() {
      GmailCompose.makeUrl({ to: "team@esper.com" });
      });

    if (onboarding) {
      view.hide();
    }

    return view;
  }

}
