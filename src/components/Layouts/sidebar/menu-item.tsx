import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Link from "next/link";
import { useSidebarContext } from "./sidebar-context";

const menuItemBaseStyles = cva(
  "rounded-lg px-3 font-medium text-dark-4 transition-all duration-200 dark:text-dark-6 text-sm",
  {
    variants: {
      isActive: {
        true: "bg-[rgba(87,80,241,0.07)] text-primary hover:bg-[rgba(87,80,241,0.07)] dark:bg-[#FFFFFF1A] dark:text-white",
        false:
          "hover:bg-gray-100 hover:text-dark hover:dark:bg-[#FFFFFF1A] hover:dark:text-white",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { toggleSidebar, isMobile } = useSidebarContext();

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        // Close sidebar on clicking link if it's mobile
        onClick={() => {
          if (isMobile) {
            toggleSidebar();
          }
        }}
        className={cn(
          menuItemBaseStyles({
            isActive: props.isActive,
            className: "relative block py-1.5",
          }),
          props.className,
        )}
      >
        {props.children}
      </Link>
    );
  }

  // Default to button behavior when as is not specified
  return (
    <button
      onClick={(e) => {
        console.log('MenuItem button clicked:', e);
        console.log('Event target:', e.target);
        console.log('Event currentTarget:', e.currentTarget);
        e.preventDefault();
        e.stopPropagation();
        console.log('Calling onClick function');
        if ('onClick' in props) {
          console.log('onClick exists, calling it...');
          props.onClick();
        } else {
          console.log('onClick does not exist in props');
        }
      }}
      aria-expanded={props.isActive}
      className={menuItemBaseStyles({
        isActive: props.isActive,
        className: "flex w-full items-center gap-2.5 py-2",
      })}
    >
      {props.children}
    </button>
  );
}
