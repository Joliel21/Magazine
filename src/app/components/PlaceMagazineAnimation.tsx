import { useEffect } from "react";
import { motion, useAnimation } from "motion/react";
import { MagazineCover } from "./MagazineCover";

interface PlaceMagazineAnimationProps {
  coverImageUrl: string;
  issueTitle: string;
  onComplete: () => void;
  spineText?: string;
  backCoverImageUrl?: string;
  backCoverText?: string;
  publisher?: string;
  issueNumber?: string;
  publicationDate?: string;
  width?: number;
  height?: number;
  isActive?: boolean;
}

export function PlaceMagazineAnimation({
  onComplete,
  issueTitle,
  spineText = "The Words We Carry • Volume I • 2025–2026",
  width = 480,
  height = 660,
  isActive = true,
}: PlaceMagazineAnimationProps) {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const controls = useAnimation();

  useEffect(() => {
    if (isActive) {
      controls.start({
        scale: 1,
        y: 0,
        rotateY: 0,
        rotateX: 0,
        rotateZ: 0,
        opacity: 1,
        transition: {
          duration: 3.2,
          ease: [0.22, 1, 0.36, 1], // easeOutQuint for a very smooth deceleration
          opacity: { duration: 1.2, ease: "linear" },
        },
      });
    }
  }, [isActive, controls]);

  const paperColor = "#F5F2EA";

  // The 3D Magazine Structure (identical to ClosedCover)
  const Magazine3D = () => (
    <div
      className="relative"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* FRONT FACE */}
        <div
          className="absolute inset-0 overflow-hidden flex flex-col items-center justify-center text-center p-0"
          style={{
            backgroundColor: "#0A1C27", // match coverFrameColor from ClosedCover
            transform: "translateZ(12px)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)", // Subtle shadow on the face itself
            transformStyle: "preserve-3d",
            borderRadius: "0",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="absolute inset-0 z-20 overflow-hidden">
            <MagazineCover issueTitle={issueTitle} />
          </div>

          {/* FOLD CREASE - Shadow/Depth Layer */}
          <div
            className="absolute top-0 bottom-0 left-0 w-[6px] z-30 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.18), transparent)",
              mixBlendMode: "multiply",
            }}
          />
          {/* FOLD CREASE - Highlight Ridge Line */}
          <div
            className="absolute top-0 bottom-0 left-[18px] w-[1px] z-40 pointer-events-none"
            style={{ background: "#FFFFFF" }}
          />
        </div>

        {/* BACK FACE */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: paperColor,
            transform: "translateZ(-12px) rotateY(180deg)",
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
          }}
        >
          {/* Blank Back Cover */}
        </div>

        {/* SPINE (LEFT) */}
        <div
          className="absolute top-0 left-0 h-full flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: "#0A1C27",
            width: "24px",
            transform: "rotateY(-90deg) translateX(-12px)",
            transformOrigin: "left center",
            transformStyle: "preserve-3d",
            boxShadow: "inset -3px 0 6px rgba(0,0,0,0.35)",
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 whitespace-nowrap"
            style={{
              transform: "translate(-50%, -50%) rotate(-90deg)",
              color: "#F8F3E8",
              fontFamily:
                "Inter, 'Arial Narrow', 'Helvetica Neue Condensed', 'Helvetica Neue', Arial, sans-serif",
              fontSize: "11px",
              fontWeight: 300,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textShadow: "0 1px 4px rgba(0,0,0,0.55)",
            }}
          >
            {spineText}
          </div>
        </div>

        {/* RIGHT EDGE (Pages) - Clean White/Gray */}
        <div
          className="absolute top-0 right-0 h-full bg-[#FAFAFA]"
          style={{
            width: "24px",
            transform: "rotateY(90deg) translateX(12px)",
            transformOrigin: "right center",
            transformStyle: "preserve-3d",
            boxShadow: "inset 3px 0 5px -2px rgba(0,0,0,0.1)",
          }}
        />

        {/* TOP EDGE (Pages) */}
        <div
          className="absolute top-0 left-0 w-full bg-[#FAFAFA]"
          style={{
            height: "24px",
            transform: "rotateX(90deg) translateY(-12px)",
            transformOrigin: "top center",
            transformStyle: "preserve-3d",
            boxShadow: "inset 0 3px 5px -2px rgba(0,0,0,0.1)",
          }}
        />

        {/* BOTTOM EDGE (Pages) */}
        <div
          className="absolute bottom-0 left-0 w-full bg-[#FAFAFA]"
          style={{
            height: "24px",
            transform: "rotateX(-90deg) translateY(12px)",
            transformOrigin: "bottom center",
            transformStyle: "preserve-3d",
            boxShadow: "inset 0 3px 5px -2px rgba(0,0,0,0.1)",
          }}
        />
      </div>
    </div>
  );

  if (prefersReducedMotion) {
    return (
      <motion.div
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        onAnimationComplete={() => isActive && onComplete()}
        style={{ perspective: "2000px" }}
      >
        <div
          className="relative"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transformStyle: "preserve-3d",
          }}
        >
          <Magazine3D />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center justify-center h-full"
      style={{ perspective: "2000px" }}
    >
      <motion.div
        className="relative"
        initial={{
          scale: 1.8,
          y: -150,
          rotateY: -12,
          rotateX: 20,
          rotateZ: -5,
          opacity: 0,
        }}
        animate={controls}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transformStyle: "preserve-3d",
        }}
        onAnimationComplete={onComplete}
      >
        <Magazine3D />
      </motion.div>
    </motion.div>
  );
}