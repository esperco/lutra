/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {
  export class RatingChartInsight extends GroupChartInsight {
    getGroupBy() { return Charting.GroupByRating; }

    render() {
      return this.getResult().mapOr(
        null,

        /*
          NB: We'd move more of this to Text namespace but given the complexity
          of the scenarios, leave alone for the time being
        */
        (s) => {
          let totalSome = s.group.all.totalValue -
                          s.group.none.totalValue;
          let totalRating = 0;
          let avgRating = 0;

          if (totalSome > 0) {
            _.each(s.group.some, (v, k) => {
              let rating = parseInt(k);
              if (! isNaN(rating)) {
                // Rating is weighted by time of event
                totalRating += rating * v.totalValue;
              }
            });
            avgRating = totalRating / totalSome;
          }

          // Colorize average rating
          let color = [
            Colors.gray,
            Colors.level5,
            Colors.level4,
            Colors.level3,
            Colors.level2,
            Colors.level1
          ][Math.floor(avgRating)] || Colors.lightGray;

          let hasOneStar = (s.group.some["1"] &&
            s.group.some["1"].totalUnique);
          let hasTwoStar = (s.group.some["2"] &&
            s.group.some["2"].totalUnique);
          let oneTwoStarBadges = <CommaList>
            { hasOneStar ?
              <Badge text={Text.stars(1)} color={Colors.level5} /> : null }
            { hasTwoStar ?
              <Badge text={Text.stars(2)} color={Colors.level4} />: null }
          </CommaList>;

          return <div>
            { totalRating > 0 ?
              <p>
                Your average event rating is{" "}
                <Badge text={Text.stars(avgRating)} color={color} />.{" "}
                {(() => {
                  if (avgRating < 2.5) {
                    return <span>
                      Looks like those meetings could have gone better. Having
                      an agenda and replacing large group meetings with one on one
                      meetings can sometimes help.
                    </span>;
                  }

                  else if (avgRating < 4) {
                    return <span>
                      Not bad, but there's room for improvement.
                      { hasOneStar || hasTwoStar ?
                        <span>
                          {" "}Be sure to look into those{" "}
                          { oneTwoStarBadges }{" "}ratings.
                        </span> : null
                      }
                    </span>;
                  }

                  return <span>
                    Looks like things are going well!
                    { hasOneStar || hasTwoStar ?
                      <span>
                        {" "}There are some{" "}{ oneTwoStarBadges }{" "}
                        ratings you may want to look into though.
                      </span> : null
                    }
                  </span>
                })()}
              </p> :
              <p>{ Text.NoRatingsMessage }</p>
            }
          </div>;
        }
      );
    }
  }
}
