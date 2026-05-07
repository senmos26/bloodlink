"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!measureRef.current) return;
    const rect = measureRef.current.getBoundingClientRect();
    setHeight(rect.height);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div ref={containerRef} className="relative w-full bg-white">
      <div ref={measureRef} className="relative max-w-6xl mx-auto pb-16">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-24 md:gap-4">
            {/* Sticky number + title */}
            <div className="sticky z-10 top-36 self-start w-12 flex items-start justify-center">
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-[#3a6873] text-[#3a6873] flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
              </div>
              {/* Title removed from sticky column to place above card */}
            </div>

            <div className="relative pl-14 pr-4 md:pl-16 w-full">
              <h3 className="block text-2xl md:text-4xl mb-4 text-left font-bold text-[#1d5175]">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* Animated vertical line */}
        <div
          style={{ height: height + "px" }}
          className="absolute left-6 md:left-6 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent via-[#cbd5e1] to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-[#3a6873] via-[#1d5175] to-transparent rounded-full"
          />
        </div>
      </div>
    </div>
  );
};


