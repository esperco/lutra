module Esper.Message {
  export interface Message {
    sender: string; // "Esper"
    type: string;
    value: any
  }
}
