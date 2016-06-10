/*
  Resizable text area
*/

/// <reference path="./ReactHelpers.ts" />

module Esper.Components {

  interface Props {
    id?: string;
    placeholder?: string;
    className?: string;
    initValue?: string;
    onChange?: (value: string) => void;
  }

  interface State {
    value: string;
  }

  export class TextArea extends ReactHelpers.Component<Props, State> {
    _ref: HTMLTextAreaElement;

    constructor(props: Props) {
      super(props);
      this.state = { value: props.initValue || "" };
    }

    render() {
      return <textarea id={this.props.id}
        ref={(ref) => this._ref = ref}
        className={ this.props.className }
        value={this.state.value}
        onChange={this.onChange}
        placeholder={this.props.placeholder}
      />
    }

    onChange = (e: React.FormEvent) => {
      var value = (e.target as HTMLTextAreaElement).value;
      this.setState({value: value});
      this.props.onChange && this.props.onChange(value);
    }

    componentDidMount() {
      if (this._ref) {
        autosize($(this._ref));
      }
    }
  }

}
