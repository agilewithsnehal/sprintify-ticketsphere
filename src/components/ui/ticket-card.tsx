
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface TicketCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const TicketCard = React.forwardRef<
  HTMLDivElement,
  TicketCardProps
>(({ className, children, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      "border bg-card rounded-md shadow-sm hover:shadow-md transition-all duration-200",
      className
    )}
    {...props}
  >
    {children}
  </Card>
));
TicketCard.displayName = "TicketCard";

const TicketCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardHeader ref={ref} className={cn("p-3 pb-0", className)} {...props} />
));
TicketCardHeader.displayName = "TicketCardHeader";

const TicketCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardContent ref={ref} className={cn("p-3 pt-1", className)} {...props} />
));
TicketCardContent.displayName = "TicketCardContent";

const TicketCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardFooter ref={ref} className={cn("p-3 pt-0 flex justify-between items-center", className)} {...props} />
));
TicketCardFooter.displayName = "TicketCardFooter";

export { TicketCard, TicketCardHeader, TicketCardContent, TicketCardFooter };
