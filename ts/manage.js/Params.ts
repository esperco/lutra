module Esper.Params {
  // TODO
  export function cleanCustomerId(custId?: string): string {
    return custId || "cust-id";
  }
}
