import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<typeof Link>;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        isActive
          ? "bg-primary text-white border-primary hover:bg-primary/90 hover:text-white shadow-md shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          : "hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "rounded-md transition-colors duration-150",
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  const t = useTranslations("charges.pagination");
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">{t("previous")}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  const t = useTranslations("charges.pagination");
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">{t("next")}</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};

type PaginationBarProps = {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  siblingCount?: number;
};

function createPageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | "ellipsis")[] {
  const totalNumbers = siblingCount * 2 + 5; // first, last, current, and two ellipses
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  const range: (number | "ellipsis")[] = [];
  const addedPages = new Set<number>();
  
  // Always add first page
  range.push(1);
  addedPages.add(1);

  if (showLeftEllipsis) {
    range.push("ellipsis");
  } else {
    // Add pages between 1 and leftSiblingIndex
    for (let i = 2; i < leftSiblingIndex; i++) {
      if (!addedPages.has(i)) {
        range.push(i);
        addedPages.add(i);
      }
    }
  }

  // Add sibling range (pages around current page)
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    if (!addedPages.has(i)) {
      range.push(i);
      addedPages.add(i);
    }
  }

  if (showRightEllipsis) {
    range.push("ellipsis");
  } else {
    // Add pages between rightSiblingIndex and totalPages
    for (let i = rightSiblingIndex + 1; i < totalPages; i++) {
      if (!addedPages.has(i)) {
        range.push(i);
        addedPages.add(i);
      }
    }
  }

  // Always add last page if it's not already included
  if (totalPages > 1 && !addedPages.has(totalPages)) {
    range.push(totalPages);
  }
  
  return range;
}

function PaginationBar({
  currentPage,
  totalPages,
  hrefForPage,
  siblingCount = 1,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;
  const safeCurrent = Math.max(1, Math.min(currentPage, totalPages));
  const pages = createPageRange(safeCurrent, totalPages, siblingCount);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={hrefForPage(Math.max(1, safeCurrent - 1))}
            aria-disabled={safeCurrent === 1}
            tabIndex={safeCurrent === 1 ? -1 : 0}
          />
        </PaginationItem>
        {pages.map((p, idx) => (
          <PaginationItem key={`${p}-${idx}`}>
            {p === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href={hrefForPage(p)}
                isActive={p === safeCurrent}
                size="default"
              >
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={hrefForPage(Math.min(totalPages, safeCurrent + 1))}
            aria-disabled={safeCurrent === totalPages}
            tabIndex={safeCurrent === totalPages ? -1 : 0}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export { PaginationBar };
