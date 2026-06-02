import { useState, useEffect } from "react";
import { Check, ClipboardList, Download, Eye, X } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/Layout/AppLayout";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import DataTable from "../../components/DataTable/DataTable";
import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import Modal, { ModalFooter } from "../../components/Modal/Modal";
import PurchaseOrderPreview from "../../components/PurchaseOrder/PurchaseOrderPreview";
import { samplePurchaseOrderPayload } from "../../components/PurchaseOrder/purchaseOrderUtils";
import { Select } from "../../components/Input/Input";
import {
  approvePurchaseOrder,
  declinePurchaseOrder,
  downloadPurchaseOrderPdf,
  getPurchaseOrderPreview,
  getPurchaseOrders,
} from "../../services/purchaseOrderService";

const statusVariant = {
  Pending: "warning",
  Approved: "success",
  Declined: "danger",
};

export default function PurchaseOrderPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const data = await getPurchaseOrders();
      setOrders(data);
      setFilteredOrders(data.filter((o) => o.status === "Pending"));
    } catch {
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleFilterChange = (e) => {
    const selected = e.target.value;
    setFilter(selected);
    setFilteredOrders(selected === "All" ? orders : orders.filter((o) => o.status === selected));
  };

  const handleAccept = async (poId) => {
    try {
      await approvePurchaseOrder(poId);
      toast.success("Purchase order approved");
      fetchOrders();
    } catch {
      toast.error("Failed to approve purchase order");
    }
  };

  const handleReject = async (poId) => {
    try {
      await declinePurchaseOrder(poId);
      toast.success("Purchase order declined");
      fetchOrders();
    } catch {
      toast.error("Failed to decline purchase order");
    }
  };

  const downloadPdf = async (order) => {
    try {
      await downloadPurchaseOrderPdf(
        order.po_id,
        `${order.po_number || `PO-${order.po_id}`}.pdf`
      );
    } catch {
      toast.error("Failed to download purchase order PDF");
    }
  };

  const closePreview = () => {
    setActiveOrder(null);
    setPreviewData(null);
  };

  const openPreview = async (order) => {
    setActiveOrder(order);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const data = await getPurchaseOrderPreview(order.po_id);
      setPreviewData(data);
    } catch {
      toast.error("Failed to load purchase order preview");
      setActiveOrder(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const columns = [
    {
      key: "po",
      label: "PO Number",
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.po_number || `PO-${r.po_id}`}</p>
          <p className="text-xs text-slate-500">ID {r.po_id}</p>
        </div>
      ),
    },
    { key: "product", label: "Product", render: (r) => r.p_name || `#${r.product_id}` },
    {
      key: "date",
      label: "PO Date",
      render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : "N/A"),
    },
    {
      key: "status",
      label: "PO Status",
      render: (r) => <Badge variant={statusVariant[r.status] || "default"}>{r.status}</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => openPreview(r)}>
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          <Button variant="ghost" size="sm" onClick={() => downloadPdf(r)}>
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
          {r.status === "Pending" && (
            <>
              <Button variant="success" size="sm" onClick={() => handleAccept(r.po_id)}>
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleReject(r.po_id)}>
                <X className="h-3.5 w-3.5" /> Decline
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Purchase Orders"
        description="Auto-generated replenishment requests when stock falls below threshold"
        actions={
          <Button variant="secondary" onClick={() => setShowSample(true)}>
            <Eye className="h-4 w-4" /> Sample preview
          </Button>
        }
      />

      <Card className="mb-6 flex flex-wrap items-center gap-4">
        <Select label="Filter by PO status" value={filter} onChange={handleFilterChange} className="max-w-xs">
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Declined">Declined</option>
          <option value="All">All</option>
        </Select>
        <p className="text-sm text-slate-500">{filteredOrders.length} purchase order(s)</p>
      </Card>

      {loading ? (
        <Loader label="Loading purchase orders..." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No purchase orders"
          description="POs are created automatically when inventory drops below the product threshold."
        />
      ) : (
        <DataTable columns={columns} data={filteredOrders} rowKey={(r) => r.po_id} />
      )}

      <Modal
        open={!!activeOrder}
        onClose={closePreview}
        title="Purchase order preview"
        description={activeOrder?.po_number || `PO #${activeOrder?.po_id}`}
        size="xl"
      >
        {previewLoading ? (
          <Loader label="Loading preview..." />
        ) : previewData ? (
          <>
            <PurchaseOrderPreview data={previewData} />
            <ModalFooter>
              <Button variant="secondary" onClick={closePreview}>Close</Button>
              {activeOrder && (
                <Button onClick={() => downloadPdf(activeOrder)}>
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              )}
            </ModalFooter>
          </>
        ) : null}
      </Modal>

      <Modal open={showSample} onClose={() => setShowSample(false)} title="Sample purchase order" size="xl">
        <PurchaseOrderPreview data={samplePurchaseOrderPayload} />
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowSample(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </AppLayout>
  );
}
