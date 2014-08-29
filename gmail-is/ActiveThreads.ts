module Esper.ActiveThreads {

  var activeEvents: LRU.C<Types.Visited<Types.GmailThread>>;

  function getCache() {
    if (activeEvents === undefined) {
      activeEvents =
        new LRU.C<Types.Visited<Types.GmailThread>>(Visited.maxThreads,
                                                    Visited.eq);
    }
    return activeEvents;
  }

  function add(x: Types.Visited<Types.GmailThread>) {
    getCache().add(x);
  }

  function exportActiveThreads(): Types.ActiveThreads {
    return {
      googleAccountId: gmail.get.user_email(),
      threads: getCache().all
    };
  }

  export function handleNewActiveThread(threadId: string, subject: string) {
    add({
      lastVisited: Date.now() / 1000,
      id: threadId,
      item: { threadId: threadId, subject: subject }
    });
    var esperMessage : Message.Message = {
      sender: "Esper",
      type: "ActiveThreads",
      value: exportActiveThreads()
    };
    window.postMessage(esperMessage, "*");
  }
}
