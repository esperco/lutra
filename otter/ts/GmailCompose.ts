/*
  Open a Gmail composition window
*/

module Esper.GmailCompose {

  export interface PrefilledMsg {
    to?: string;
    subject?: string;
    body?: string
  }

  export function makeUrl(param: PrefilledMsg) {
    var url = "https://mail.google.com/mail?view=cm&cs=wh&tf=0";
    if (Util.isString(param.to))
      url += "&to=" + encodeURIComponent(param.to);
    if (Util.isString(param.subject))
      url += "&su=" + encodeURIComponent(param.subject);
    if (Util.isString(param.body))
      url += "&body=" + encodeURIComponent(param.body);
    return url;
  };
}
