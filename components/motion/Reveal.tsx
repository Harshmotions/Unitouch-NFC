"use client";

import { useEffect, useRef } from "react";

type Props = React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "ul" | "ol" | "header" | "footer";
  children: React.ReactNode;
};

/* Section entrances: the direct children of this element rise in reading
   order (staggered by their --i, set in CSS via style or here by index)
   when it first comes into view, once. The hidden state lives in
   globals.css under html.js and prefers-reduced-motion: no-preference, so
   without script, or with reduced motion, everything is simply there. */
export default function Reveal({ as = "div", children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement;
      if (!c.style.getPropertyValue("--i")) c.style.setProperty("--i", String(i));
    });
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      // Fire when the top is about 88% of the way down the viewport.
      { rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as "div";
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} data-reveal="" {...rest}>
      {children}
    </Tag>
  );
}
