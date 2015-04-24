module Esper.ObserveMessage {

  function addEmails(emails, es) {
    for (var e in es) {
      if (es[e].length > 0) {
        emails.push(es[e]);
      }
    }
  }

  export function init() {
    esperGmail.after.send_message(function(
        whatever1: any,
        url: string,
        em: esperGmail.get.sendMessageData,
        whatever2: any,
        xhr: XMLHttpRequest) {
      Log.i("send-message", em);

      if (CurrentThread.task.isValid()) {
        var emails = [];
        addEmails(emails, em.to);
        addEmails(emails, em.cc);
        addEmails(emails, em.bcc);
        var snippet = em.ishtml ? $("<span>" + em.body + "</span>").text()
                                : em.body;
        Api.notifyTaskMessage(CurrentThread.task.get(), emails, snippet);
      }
    });
  }
}
