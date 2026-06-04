import { useState } from "react";

export default function ShowMoreList({
  items = [],
  allItems,
  hasMore = false,
  totalCount,
  renderItem,
  previewLimit = 5,
}) {
  const [expanded, setExpanded] = useState(false);
  const full = allItems?.length ? allItems : items;
  const visible = expanded ? full : items;
  const showToggle = hasMore && full.length > previewLimit;

  return (
    <>
      <ol className="list-none space-y-2">
        {visible.map((item, idx) => (
          <li key={item.rank ?? item.productId ?? item.supplierId ?? item.poId ?? idx}>
            {renderItem(item, idx)}
          </li>
        ))}
      </ol>
      {showToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {expanded ? "Show Less" : `Show More (${totalCount ?? full.length})`}
        </button>
      ) : null}
    </>
  );
}
