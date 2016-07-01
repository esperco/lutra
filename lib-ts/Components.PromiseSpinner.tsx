/*
  A spinner in a Bootstrap container that becomes an error if a promise
  fails
*/

/// <reference path="./Components.ErrorMsg.tsx" />

module Esper.Components {
  interface Props {
    promise: JQueryPromise<any>;
  }

  export class PromiseSpinner extends ReactHelpers.Component<Props, {
    error: boolean;
  }> {
    constructor(props: Props) {
      super(props);
      this.state = { error: false };
      this.hookUpPromise(props.promise);
    }

    componentWillReceiveProps(props: Props) {
      if (this.props.promise !== props.promise) {
        this.setState({ error: false })
        this.hookUpPromise(props.promise);
      }
    }

    hookUpPromise(promise: JQueryPromise<any>) {
      promise.fail(() => this.setState({ error: true }));
    }

    render() {
      return <div className="container">
        {
          this.state.error ?
          <ErrorMsg /> :
          <div className="esper-spinner esper-large esper-centered" />
        }
      </div>;
    }
  }
}
