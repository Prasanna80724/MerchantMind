import Card from "../Card/Card";
import CountResponse from "./responses/CountResponse";
import MetricResponse from "./responses/MetricResponse";
import RankingResponse from "./responses/RankingResponse";
import ProductListResponse from "./responses/ProductListResponse";
import SupplierResponse from "./responses/SupplierResponse";
import RevenueResponse from "./responses/RevenueResponse";
import PurchaseOrdersResponse from "./responses/PurchaseOrdersResponse";
import GenericListResponse from "./responses/GenericListResponse";

const STRUCTURED_TYPES = new Set([
  "count",
  "metric",
  "ranking",
  "product_list",
  "supplier",
  "revenue",
  "purchase_orders",
]);

function hasStructuredContent(presentation) {
  if (!presentation?.type) return false;
  if (presentation.type === "empty") return false;
  if (presentation.type === "count") return presentation.value != null;
  if (presentation.type === "metric" || presentation.type === "revenue") {
    return presentation.amount != null || (presentation.items?.length ?? 0) > 0;
  }
  return (presentation.items?.length ?? 0) > 0 || presentation.value != null;
}

export default function AssistantResponse({ summary, presentation }) {
  const type = presentation?.type;
  const showStructured = hasStructuredContent(presentation);
  const showSummary =
    summary &&
    (!STRUCTURED_TYPES.has(type) || type === "generic") &&
    summary !== presentation?.title;

  return (
    <div className="w-full min-w-0 space-y-3">
      {showSummary ? (
        <p className="text-sm font-medium text-slate-800">{summary}</p>
      ) : null}

      {type === "empty" && (
        <Card className="border-slate-200 bg-white">
          <p className="text-sm font-medium text-slate-900">{presentation?.title || "No Results"}</p>
          <p className="mt-1 text-sm text-slate-600">{presentation?.message || "No matching records."}</p>
        </Card>
      )}

      {type === "count" && (
        <CountResponse title={presentation.title} value={presentation.value} unit={presentation.unit} />
      )}

      {type === "metric" && (
        <MetricResponse
          title={presentation.title}
          amount={presentation.amount}
          secondary={presentation.secondary}
        />
      )}

      {type === "revenue" && (
        <RevenueResponse
          title={presentation.title}
          amount={presentation.amount}
          items={presentation.items}
          allItems={presentation.allItems}
          hasMore={presentation.hasMore}
          totalCount={presentation.totalCount}
          listMode={presentation.listMode}
        />
      )}

      {type === "ranking" && (
        <RankingResponse
          title={presentation.title}
          items={presentation.items}
          allItems={presentation.allItems}
          hasMore={presentation.hasMore}
          totalCount={presentation.totalCount}
          valueLabel={presentation.valueLabel}
        />
      )}

      {type === "product_list" && (
        <ProductListResponse
          title={presentation.title}
          variant={presentation.variant}
          items={presentation.items}
          allItems={presentation.allItems}
          hasMore={presentation.hasMore}
          totalCount={presentation.totalCount}
        />
      )}

      {type === "supplier" && (
        <SupplierResponse
          title={presentation.title}
          items={presentation.items}
          allItems={presentation.allItems}
          hasMore={presentation.hasMore}
          totalCount={presentation.totalCount}
        />
      )}

      {type === "purchase_orders" && (
        <PurchaseOrdersResponse
          title={presentation.title}
          items={presentation.items}
          allItems={presentation.allItems}
          hasMore={presentation.hasMore}
          totalCount={presentation.totalCount}
        />
      )}

      {type === "generic" && showStructured && (
        <GenericListResponse
          title={presentation.title}
          items={presentation.items}
          allItems={presentation.allItems}
          hasMore={presentation.hasMore}
          totalCount={presentation.totalCount}
        />
      )}

      {!showStructured && !showSummary && type !== "empty" && (
        <Card className="border-slate-200 bg-white">
          <p className="text-sm text-slate-600">No matching records were found.</p>
        </Card>
      )}

      {presentation?.truncated && (
        <p className="text-xs text-slate-400">Results capped for performance.</p>
      )}
    </div>
  );
}
