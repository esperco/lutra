/*
  Comma list is used to apply Oxford comma rules to a list of inline elements
*/

module Esper.Components {
  export function CommaList({children}: {
    children?: JSX.Element|JSX.Element[]
  }) {
    let childrenArr = React.Children.toArray(children);
    if (! childrenArr.length) { return <span /> }

    if (childrenArr.length === 1) {
      return <span>
        { childrenArr[0] }
      </span>
    }

    if (childrenArr.length === 2) {
      return <span>
        childrenArr[0]
        {" and "}
        childrenArr[1]
      </span>;
    }

    // Else, >= 3
    return <span>
      { _.map(childrenArr.slice(0, -1),
        (c, i) => <span key={i}>
          { c }{", "}
        </span>
      ) }
      {" and "}
      { childrenArr[childrenArr.length - 1] }
    </span>
  }
}
