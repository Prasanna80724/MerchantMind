import { useState, useEffect } from "react";
import { Mail, Phone, Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/Layout/AppLayout";
import PageHeader from "../../components/PageHeader/PageHeader";
import SearchBar from "../../components/SearchBar/SearchBar";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import DataTable from "../../components/DataTable/DataTable";
import Modal, { ModalFooter } from "../../components/Modal/Modal";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import Input from "../../components/Input/Input";
import Badge from "../../components/Badge/Badge";
import EmptyState from "../../components/EmptyState/EmptyState";
import Loader from "../../components/Loader/Loader";
import { addSupplier, deleteSupplier, getSuppliers } from "../../services/supplierService";

const emptyForm = { name: "", email: "", phone: "", product: "", quantity: "", purchase_cost: "" };

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch {
      toast.error("Failed to load suppliers");
    }
  };

  useEffect(() => {
    fetchSuppliers().finally(() => setLoading(false));
  }, []);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.p_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const response = await addSupplier(formData);
    if (response.ok) {
      toast.success("Supplier added successfully");
      setFormData(emptyForm);
      setShowModal(false);
      fetchSuppliers();
    } else {
      toast.error("Failed to add supplier");
    }
    setSubmitting(false);
  };

  const handleDeleteSupplier = async () => {
    if (!deleteTarget) return;
    try {
      const response = await deleteSupplier(deleteTarget);
      if (!response.ok) throw new Error();
      toast.success("Supplier removed");
      setSuppliers((prev) => prev.filter((s) => s.supplier_id !== deleteTarget));
    } catch {
      toast.error("Failed to delete supplier");
    } finally {
      setDeleteTarget(null);
    }
  };

  const uniqueSuppliers = [...new Map(filteredSuppliers.map((s) => [s.supplier_id, s])).values()];

  const columns = [
    {
      key: "name",
      label: "Supplier",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: "product", label: "Product", render: (r) => r.p_name || "—" },
    { key: "qty", label: "Qty", render: (r) => r.quantity },
    { key: "cost", label: "Cost", render: (r) => `₹${r.purchase_cost}` },
    {
      key: "contact",
      label: "Contact",
      render: (r) => (
        <div className="space-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone_no}</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <button type="button" onClick={() => setDeleteTarget(r.supplier_id)} className="rounded-lg p-2 text-slate-400 hover:bg-danger-light hover:text-danger" aria-label="Delete supplier">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <Loader label="Loading suppliers..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Suppliers"
        description="Manage vendor relationships and supply records"
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Add supplier
          </Button>
        }
      />

      <Card className="mb-6">
        <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search suppliers or products..." />
      </Card>

      {uniqueSuppliers.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uniqueSuppliers.slice(0, 3).map((s) => (
            <Card key={s.supplier_id} hover className="!p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg shadow-brand-600/20">
                  <User className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{s.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="success">Active</Badge>
                    {s.p_name && <Badge variant="brand">{s.p_name}</Badge>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredSuppliers.length === 0 ? (
        <EmptyState title="No suppliers found" action={<Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Add supplier</Button>} />
      ) : (
        <DataTable columns={columns} data={filteredSuppliers} rowKey={(r) => `${r.supplier_id}-${r.product_id}`} />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add supplier" description="Register a new supplier and supply record." size="lg">
        <form onSubmit={handleFormSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input label="Supplier name" name="name" value={formData.name} onChange={handleInputChange} required />
          <Input label="Product name" name="product_name" value={formData.product_name} onChange={handleInputChange} required />
          <Input label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required />
          <Input label="Purchase cost" name="purchase_cost" type="number" value={formData.purchase_cost} onChange={handleInputChange} required />
          <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
          <Input label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
          <ModalFooter className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Submit</Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteSupplier} title="Remove supplier?" description="This removes the supplier's supply mapping." confirmLabel="Remove" />
    </AppLayout>
  );
}
