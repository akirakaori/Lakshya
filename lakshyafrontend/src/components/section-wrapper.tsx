import React from "react";

type SectionWrapperProps = {
  id?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const SectionWrapper: React.FC<SectionWrapperProps> = ({ id, title, children, className = "" }) => {
  return (
    <section id={id} className={`px-4 py-6 md:px-6 md:py-8 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {title && <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-slate-100">{title}</h2>}
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper;
