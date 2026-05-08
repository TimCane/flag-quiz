import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-white to-surface-300 text-surface-950 shadow-md shadow-black/20 hover:from-surface-300 hover:to-surface-400 active:shadow-sm",
        destructive:
          "bg-gradient-to-b from-red-500 to-red-700 text-white shadow-md shadow-red-900/30 hover:from-red-400 hover:to-red-600",
        outline:
          "border border-surface-700/80 bg-surface-900/50 text-surface-300 shadow-sm hover:bg-surface-800/80 hover:border-surface-600 hover:text-white backdrop-blur-sm",
        ghost:
          "text-surface-400 hover:bg-surface-800/60 hover:text-white",
        success:
          "bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-900/30 hover:from-emerald-400 hover:to-emerald-600",
        warning:
          "bg-gradient-to-b from-amber-500 to-amber-700 text-white shadow-md shadow-amber-900/30 hover:from-amber-400 hover:to-amber-600",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        xl: "h-13 rounded-xl px-8 text-base",
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
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
