module Esper.ActiveThreads {

  /* Equality function used to deduplicate cache elements */
  function eq(a: Types.GmailThread, b: Types.GmailThread) {
    return a.threadId === b.threadId;
  }

  var cacheCapacity = 5;
  var activeEvents: LRU.C<Types.GmailThread>;

  function getCache() {
    if (activeEvents === undefined)
      activeEvents = new LRU.C(cacheCapacity, eq);
    return activeEvents;
  }

  function add(x: Types.GmailThread) {
    getCache().add(x);
  }

  function exportActiveThreads(): Types.ActiveThreads {
    return {
      googleAccountId: gmail.get.user_email(),
      threads: getCache().all
    };
  }

  export function handleNewActiveThread(threadId: string, subject: string) {
    add({ threadId: threadId, subject: subject });
    var esperMessage : EsperMessage.EsperMessage = {
      sender: "Esper",
      type: "ActiveThreads",
      value: exportActiveThreads()
    };
    window.postMessage(esperMessage, "*");
  }
}
