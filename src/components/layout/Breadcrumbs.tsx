import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import React from "react";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center text-sm font-medium">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {item.path && !isLast ? (
              <Link to={item.path} className="text-slate-400 hover:text-slate-200 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-slate-100" : "text-slate-400"}>
                {item.label}
              </span>
            )}
            
            {!isLast && (
              <ChevronRight className="w-4 h-4 text-slate-600 mx-2 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
