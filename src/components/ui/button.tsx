import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-[3px] active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_5px_0_0_hsl(var(--primary)/0.5),0_8px_16px_-3px_hsl(var(--primary)/0.35)] hover:shadow-[0_3px_0_0_hsl(var(--primary)/0.5),0_5px_10px_-3px_hsl(var(--primary)/0.35)] hover:translate-y-[2px] hover:brightness-110",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_5px_0_0_hsl(var(--destructive)/0.5),0_8px_16px_-3px_hsl(var(--destructive)/0.35)] hover:shadow-[0_3px_0_0_hsl(var(--destructive)/0.5),0_5px_10px_-3px_hsl(var(--destructive)/0.35)] hover:translate-y-[2px] hover:brightness-110",
        outline:
          "border-2 border-input bg-background shadow-[0_5px_0_0_hsl(var(--border)),0_8px_16px_-4px_hsl(var(--foreground)/0.08),inset_0_1px_0_0_hsl(var(--background))] hover:bg-accent hover:text-accent-foreground hover:shadow-[0_3px_0_0_hsl(var(--border)),0_5px_10px_-4px_hsl(var(--foreground)/0.08)] hover:translate-y-[2px]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_5px_0_0_hsl(var(--secondary)/0.5),0_8px_16px_-3px_hsl(var(--secondary)/0.3)] hover:shadow-[0_3px_0_0_hsl(var(--secondary)/0.5),0_5px_10px_-3px_hsl(var(--secondary)/0.3)] hover:translate-y-[2px]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
