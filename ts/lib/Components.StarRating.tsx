/*
  A component used for a "star" menu
*/

/// <reference path="./ReactHelpers.ts" />

module Esper.Components {

  interface StarRatingProps {
    value: number;  // Rating, 1-indexed
    max?: number;   // Max-rating, defaults to 5
    onChange: (value: number) => void;
  }

  interface StarRatingState {
    hoverValue?: number;
  }

  export class StarRating
    extends ReactHelpers.Component<StarRatingProps, StarRatingState>
  {
    constructor(props: StarRatingProps) {
      super(props);
      this.state = {};
    }

    render() {
      return <div className="star-rating">
       { _.times(this.props.max || 5, (i) => this.renderStar(i + 1)) }
      </div>;
    }

    renderStar(index: number) {
      var shownValue = this.state.hoverValue || this.props.value;
      var icon = (index > shownValue ? "fa-star-o" : "fa-star");
      return <a key={index.toString()}
        className={"action rating-action fa fa-fw " + icon}
        onClick={() => this.props.onChange(index)}
        onMouseEnter={() => this.setState({ hoverValue: index })}
        onMouseLeave={() => this.setState({ hoverValue: null })}
      />;
    }
  }

}
