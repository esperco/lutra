
module Esper.ObserveMessage {

  function addEmails(emails, es) {
    for (var e in es) {
      if (es[e].length > 0) {
        emails.push(es[e]);
      }
    }
  }

  export function init() {
    var reQuoted = /^On(?:.|[\r\n])*wrote:$(?:[\r\n]*^>.*$)+[\r\n]*/gm;
    var reSpaces = /\s+/g;

    GmailJs.after.send_message(function(
        whatever1: any,
        url: string,
        em: GmailJs.SendMessageData,
        whatever2: any,
        xhr: XMLHttpRequest) {
      if (CurrentThread.task.isValid()) {
        var emails = [];
        addEmails(emails, em.to);
        addEmails(emails, em.cc);
        addEmails(emails, em.bcc);

        var snippet = em.ishtml ? $("<span>" + em.body + "</span>").text()
                                : em.body;
        snippet = snippet.replace(reQuoted, "")
                         .trim()
                         .split(reSpaces).join(" ")
                         .substr(0, 200);

        Api.notifyTaskMessage(CurrentThread.task.get(), emails, snippet);
      }
    });
  }
}
