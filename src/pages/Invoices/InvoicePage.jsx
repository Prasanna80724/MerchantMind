import { useEffect, useState } from "react";
import { Check, Eye, FileText, X } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/Layout/AppLayout";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import DataTable from "../../components/DataTable/DataTable";
import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { Select } from "../../components/Input/Input";
import {
  approveInvoice,
  declineInvoice,
  getPendingInvoices,
} from "../../services/invoiceService";

const statusVariant = {
  Pending: "warning",
  Approved: "success",
  Declined: "danger",
};

export default function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Pending");

  const fetchInvoices = async () => {
    try {
      const data = await getPendingInvoices();
      setInvoices(data);
      setFilteredInvoices(data.filter((i) => i.status === "Pending"));
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleFilterChange = (e) => {
    const selected = e.target.value;
    setFilter(selected);
    setFilteredInvoices(selected === "All" ? invoices : invoices.filter((i) => i.status === selected));
  };

  const handleAccept = async (invoiceId) => {
    try {
      await approveInvoice(invoiceId);
      toast.success("Invoice approved");
      fetchInvoices();
    } catch {
      toast.error("Failed to approve invoice");
    }
  };

  const handleReject = async (invoiceId) => {
    try {
      await declineInvoice(invoiceId);
      toast.success("Invoice declined");
      fetchInvoices();
    } catch {
      toast.error("Failed to decline invoice");
    }
  };

  const handleViewPdf = (invoice) => {
    const blob = new Blob(
      [Uint8Array.from(atob(invoice.invoice_file_path), (c) => c.charCodeAt(0))],
      { type: "application/pdf" }
    );
    window.open(URL.createObjectURL(blob));
  };

  const columns = [
    { key: "id", label: "Invoice", render: (r) => `#${r.invoice_id}` },
    { key: "product", label: "Product", render: (r) => r.p_name || `#${r.product_id}` },
    { key: "date", label: "Generated", render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : "N/A") },
    { key: "status", label: "Status", render: (r) => <Badge variant={statusVariant[r.status] || "default"}>{r.status}</Badge> },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => handleViewPdf(r)}>
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          {r.status === "Pending" && (
            <>
              <Button variant="success" size="sm" onClick={() => handleAccept(r.invoice_id)}>
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleReject(r.invoice_id)}>
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <PageHeader title="Invoices" description="Review and manage auto-generated purchase invoices" />

      <Card className="mb-6 flex flex-wrap items-center gap-4">
        <Select label="Filter by status" value={filter} onChange={handleFilterChange} className="max-w-xs">
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Declined">Declined</option>
          <option value="All">All</option>
        </Select>
        <p className="text-sm text-slate-500">{filteredInvoices.length} invoice(s)</p>
      </Card>

      {loading ? (
        <Loader label="Loading invoices..." />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices" description="Invoices appear when stock falls below threshold." />
      ) : (
        <DataTable columns={columns} data={filteredInvoices} rowKey={(r) => r.invoice_id} />
      )}
    </AppLayout>
  );
}
