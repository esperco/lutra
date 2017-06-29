/*
  Resizable text area
*/

/// <reference path="./ReactHelpers.ts" />

module Esper.Components {

  interface Props {
    id?: string;
    placeholder?: string;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
  }

  export class TextArea extends ReactHelpers.Component<Props, {}> {
    _ref: HTMLTextAreaElement;

    render() {
      return <textarea id={this.props.id}
        ref={(ref) => this._ref = ref}
        className={ this.props.className }
        value={this.props.value}
        onChange={this.onChange}
        placeholder={this.props.placeholder}
      />
    }

    onChange = (e: React.FormEvent) => {
      var value = (e.target as HTMLTextAreaElement).value;
      this.props.onChange && this.props.onChange(value);
    }

    componentDidMount() {
      if (this._ref) {
        autosize($(this._ref));
      }
    }
  }

}
