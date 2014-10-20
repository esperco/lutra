/*
   Mixpanel loader for version 2.2, using our account key
*/

module MP {

  // Token passed to mixpanel.init() comes from settings in Mixpanel app
  var token = "02dd353e82ccd658119299529e83f873";

  /*
     Copied from the Mixpanel setup instructions:
     https://mixpanel.com/help/reference/javascript#installing
     Creates window.mixpanel
  */
  (function(e,b){if(!b.__SV){var a,f,i,g;window["mixpanel"]=b;b._i=[];b.init=function(a,e,d){function f(b,h){var a=h.split(".");2==a.length&&(b=b[a[0]],h=a[1]);b[h]=function(){b.push([h].concat(Array.prototype.slice.call(arguments,0)))}}var c=b;if (typeof d !== "undefined"){c=b[d]=[]}else{d="mixpanel"};c.people=c.people||[];c.toString=function(b){var a="mixpanel";"mixpanel"!==d&&(a+="."+d);b||(a+=" (stub)");return a};c.people.toString=function(){return c.toString(1)+".people (stub)"};i="disable track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config people.set people.set_once people.increment people.append people.track_charge people.clear_charges people.delete_user".split(" ");
  for(g=0;g<i.length;g++)f(c,i[g]);b._i.push([a,e,d])};b.__SV=1.2;a=e.createElement("script");a.type="text/javascript";a.async=!0;a.src=("https:"===e.location.protocol?"https:":"http:")+'//cdn.mxpnl.com/libs/mixpanel-2.2.min.js';f=e.getElementsByTagName("script")[0];f.parentNode.insertBefore(a,f)}})(document,window["mixpanel"]||[]);
  window["mixpanel"].init(token);

  export function track(name) {
    if (window["flags"].isProduction) window["mixpanel"].track(name);
  };

}
