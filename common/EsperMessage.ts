module Esper.EsperMessage {
  export interface EsperMessage {
    sender: string; // "Esper"
    type: string;
    value: any
  }
}
