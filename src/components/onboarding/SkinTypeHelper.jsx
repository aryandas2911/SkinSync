import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export function SkinTypeHelperToggle({ isOpen, onToggle }) {
  return (
    <div className="mt-6 pt-4 border-t border-border/40 w-full">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors w-full"
      >
        <HelpCircle size={16} />
        <span className="font-medium">Not sure? Find your skin type</span>
        {isOpen ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
      </button>
    </div>
  );
}

export function SkinTypeHelperContent({ isOpen }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setTimeout(() => {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={contentRef}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="pt-2 text-sm text-text-muted space-y-4 pb-2 text-left">
            <div>
              <h4 className="font-bold text-text mb-1 text-base">How to identify your skin type</h4>
              <div className="mt-3">
                <h5 className="font-semibold text-text mb-1">Test 1: Bare Face Test</h5>
                <ol className="list-decimal pl-4 space-y-1 mb-2">
                  <li>Wash your face with a gentle cleanser</li>
                  <li>Do not apply any products</li>
                  <li>Wait 30–60 minutes</li>
                </ol>
                <ul className="list-disc pl-4 space-y-1">
                  <li><span className="font-medium text-text">Feels tight:</span> Dry skin</li>
                  <li><span className="font-medium text-text">Looks shiny all over:</span> Oily skin</li>
                  <li><span className="font-medium text-text">Shiny in T-zone only:</span> Combination skin</li>
                  <li><span className="font-medium text-text">Feels comfortable, not oily or dry:</span> Normal skin</li>
                </ul>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-text mb-1">Test 2: Blotting Paper Test</h5>
              <p className="mb-2">Gently press blotting paper on different areas of your face:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><span className="font-medium text-text">Picks up oil from all areas:</span> Oily skin</li>
                <li><span className="font-medium text-text">Little to no oil:</span> Dry skin</li>
                <li><span className="font-medium text-text">Oil only from forehead/nose:</span> Combination skin</li>
              </ul>
            </div>

            <div className="bg-[#f0f4f8] p-3 rounded-xl border border-border mt-4">
              <span className="font-semibold text-text block mb-1">Sensitive Skin Note</span>
              If your skin frequently stings, burns, or reacts easily to products, you may have sensitive skin (this can occur with any skin type).
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
