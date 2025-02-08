import { cn } from "@/lib/utils";
import {
  IconStar,
  IconStarFilled,
  IconStarHalfFilled,
} from "@tabler/icons-react";
import { forwardRef } from "react";

type RatingProps = {
  rating: number;
  size?: number;
  maxRating?: number;
  className?: string;
};

const Rating = forwardRef<HTMLDivElement, RatingProps>(
  ({ rating, size = 24, maxRating = 5, className }, ref) => {
    const fullStars = Math.floor(rating);
    const halfStars = fullStars < rating ? 1 : 0;
    const emptyStars = maxRating - fullStars - halfStars;

    return (
      <div
        ref={ref}
        className={cn("flex", className)}
        role="img"
        aria-label={`${rating.toFixed(1)} stars`}
      >
        {[...Array(fullStars)].map((_, index) => (
          <IconStarFilled key={index} size={size} />
        ))}
        {!!halfStars && <IconStarHalfFilled size={size} />}
        {[...Array(emptyStars)].map((_, index) => (
          <IconStar key={index + fullStars} size={size} />
        ))}
      </div>
    );
  },
);

Rating.displayName = "Rating";

export default Rating;
