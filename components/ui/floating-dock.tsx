import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, useSpring, useTransform, useMotionValue, AnimatePresence, MotionValue } from "motion/react";


export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void }[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void }[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                {item.onClick ? (
                  <button
                    onClick={item.onClick}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border shadow-lg"
                  >
                    <div className="flex items-center justify-center h-5 w-5 [&>i]:text-xl">{item.icon}</div>
                  </button>
                ) : (
                  <a
                    href={item.href}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border shadow-lg"
                  >
                    <div className="flex items-center justify-center h-5 w-5 [&>i]:text-xl">{item.icon}</div>
                  </a>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-card border border-border shadow-lg"
      >
        <Download className="text-muted-foreground" size={24} />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void }[];
  className?: string;
}) => {
  let mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-12 items-end gap-4 rounded-lg bg-card border border-border shadow-lg px-4 pb-2 md:flex",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  onClick,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  let ref = useRef<HTMLDivElement>(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  
  let iconScaleTransform = useTransform(distance, [-150, 0, 150], [1, 2, 1]);

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  
  let iconScale = useSpring(iconScaleTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const container = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      className="relative flex aspect-square items-center justify-center"
    >
      <motion.div
        style={{ scale: iconScale }}
        className="flex items-center justify-center"
      >
        {icon}
      </motion.div>
    </motion.div>
  );

  if (onClick) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={onClick} type="button" className="border-0 bg-transparent p-0">
            {container}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a href={href}>{container}</a>
      </TooltipTrigger>
      <TooltipContent side="top">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}
