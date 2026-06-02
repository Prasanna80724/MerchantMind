import { useState, useEffect, useMemo } from "react";
import { Mail, Package, Pencil, Phone, Plus, Truck, User, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/Layout/AppLayout";
import PageHeader from "../../components/PageHeader/PageHeader";
import SearchBar from "../../components/SearchBar/SearchBar";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import DataTable from "../../components/DataTable/DataTable";
import Modal, { ModalFooter } from "../../components/Modal/Modal";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import Input, { Select } from "../../components/Input/Input";
import Badge from "../../components/Badge/Badge";
import EmptyState from "../../components/EmptyState/EmptyState";
import Loader from "../../components/Loader/Loader";
import {
  addSupplier,
  deactivateSupplier,
  getActiveSuppliers,
  getSuppliers,
  getSupplies,
  getSupplyAuditLog,
  reactivateSupplier,
  recordSupply,
  updateSupply,
} from "../../services/supplierService";
import { getProductsCatalog } from "../../services/productService";

const emptySupplier = { name: "", email: "", phone: "" };
const emptySupply = { supplier_id: "", product_id: "", quantity: "", purchase_cost: "" };

function statusBadgeVariant(status) {
  if (status === "Active") return "success";
  if (status === "Blacklisted") return "danger";
  return "warning";
}

function toDatetimeLocal(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [activeSuppliers, setActiveSuppliers] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [supplyForm, setSupplyForm] = useState(emptySupply);
  const [editSupplyForm, setEditSupplyForm] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);

  const loadData = async () => {
    try {
      const [supplierData, activeData, supplyData, productData] = await Promise.all([
        getSuppliers(),
        getActiveSuppliers(),
        getSupplies(),
        getProductsCatalog(),
      ]);
      setSuppliers(supplierData);
      setActiveSuppliers(activeData);
      setSupplies(supplyData);
      setProducts(productData);
    } catch {
      toast.error("Failed to load supplier data");
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSupplies = supplies.filter(
    (s) =>
      s.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.p_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canRecordSupply = useMemo(
    () => activeSuppliers.length > 0 && products.length > 0,
    [activeSuppliers, products]
  );

  const handleSupplierChange = (e) => {
    setSupplierForm({ ...supplierForm, [e.target.name]: e.target.value });
  };

  const handleSupplyChange = (e) => {
    setSupplyForm({ ...supplyForm, [e.target.name]: e.target.value });
  };

  const handleEditSupplyChange = (e) => {
    setEditSupplyForm({ ...editSupplyForm, [e.target.name]: e.target.value });
  };

  const openEditSupply = async (supply) => {
    setEditSupplyForm({
      id: supply.id,
      product_name: supply.p_name,
      supplier_name: supply.supplier_name,
      quantity: supply.quantity,
      purchase_cost: supply.purchase_cost,
      supplied_date: toDatetimeLocal(supply.supplied_date),
    });
    try {
      const log = await getSupplyAuditLog(supply.id);
      setAuditLog(log);
    } catch {
      setAuditLog([]);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await addSupplier(supplierForm);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add supplier");
      toast.success("Supplier created. Record a supply to update inventory.");
      setSupplierForm(emptySupplier);
      setShowSupplierModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordSupply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        supplier_id: Number(supplyForm.supplier_id),
        product_id: Number(supplyForm.product_id),
        quantity: Number(supplyForm.quantity),
        purchase_cost: Number(supplyForm.purchase_cost),
      };
      const response = await recordSupply(payload);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to record supply");
      toast.success(`Supply recorded. Stock is now ${data.current_stock}.`);
      setSupplyForm(emptySupply);
      setShowSupplyModal(false);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSupply = async (e) => {
    e.preventDefault();
    if (!editSupplyForm) return;
    setSubmitting(true);
    try {
      const result = await updateSupply(editSupplyForm.id, {
        quantity: Number(editSupplyForm.quantity),
        purchase_cost: Number(editSupplyForm.purchase_cost),
        supplied_date: new Date(editSupplyForm.supplied_date).toISOString(),
      });
      toast.success(`Supply updated. Stock is now ${result.current_stock}.`);
      setEditSupplyForm(null);
      setAuditLog([]);
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    try {
      if (statusTarget.action === "deactivate") {
        await deactivateSupplier(statusTarget.supplier_id);
        toast.success("Supplier deactivated");
      } else {
        await reactivateSupplier(statusTarget.supplier_id);
        toast.success("Supplier reactivated");
      }
      await loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusTarget(null);
    }
  };

  const supplierColumns = [
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
            <p className="text-xs text-slate-500">{row.email || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge variant={statusBadgeVariant(r.status || "Active")}>{r.status || "Active"}</Badge>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (r) => (
        <div className="space-y-1 text-xs text-slate-500">
          {r.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>}
          {r.phone_no && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone_no}</span>}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex gap-1">
          {r.status === "Active" ? (
            <button
              type="button"
              onClick={() => setStatusTarget({ supplier_id: r.supplier_id, action: "deactivate", name: r.name })}
              className="rounded-lg p-2 text-slate-400 hover:bg-warning-light hover:text-amber-700"
              aria-label="Deactivate supplier"
              title="Deactivate supplier"
            >
              <UserX className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStatusTarget({ supplier_id: r.supplier_id, action: "reactivate", name: r.name })}
              className="rounded-lg p-2 text-slate-400 hover:bg-success-light hover:text-emerald-700"
              aria-label="Reactivate supplier"
              title="Reactivate supplier"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const supplyColumns = [
    { key: "date", label: "Date", render: (r) => new Date(r.supplied_date).toLocaleString() },
    { key: "supplier", label: "Supplier", render: (r) => r.supplier_name },
    { key: "product", label: "Product", render: (r) => r.p_name },
    { key: "qty", label: "Qty", render: (r) => r.quantity },
    { key: "cost", label: "Cost", render: (r) => `₹${Number(r.purchase_cost).toLocaleString()}` },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <button
          type="button"
          onClick={() => openEditSupply(r)}
          className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
          aria-label="Edit supply"
          title="Edit supply transaction"
        >
          <Pencil className="h-4 w-4" />
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
        description="Manage vendors, record supply transactions, and correct mistakes via edits — history is never deleted."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowSupplierModal(true)}>
              <Plus className="h-4 w-4" /> Add supplier
            </Button>
            <Button onClick={() => setShowSupplyModal(true)} disabled={!canRecordSupply}>
              <Truck className="h-4 w-4" /> Record supply
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search suppliers or supply records..." />
      </Card>

      {filteredSuppliers.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.slice(0, 3).map((s) => (
            <Card key={s.supplier_id} hover className="!p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg shadow-brand-600/20">
                  <User className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{s.email}</p>
                  <Badge variant={statusBadgeVariant(s.status || "Active")} className="mt-3">
                    {s.status || "Active"}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Supplier directory</h3>
        {filteredSuppliers.length === 0 ? (
          <EmptyState title="No suppliers yet" action={<Button onClick={() => setShowSupplierModal(true)}><Plus className="h-4 w-4" /> Add supplier</Button>} />
        ) : (
          <DataTable columns={supplierColumns} data={filteredSuppliers} rowKey={(r) => r.supplier_id} />
        )}
      </Card>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Package className="h-4 w-4" /> Supply history
        </h3>
        {filteredSupplies.length === 0 ? (
          <EmptyState title="No supply records" description="Record a supply to add stock to inventory." />
        ) : (
          <DataTable columns={supplyColumns} data={filteredSupplies} rowKey={(r) => r.id} />
        )}
      </Card>

      <Modal open={showSupplierModal} onClose={() => setShowSupplierModal(false)} title="Add supplier" description="Register vendor details only. Inventory is updated via supply transactions.">
        <form onSubmit={handleAddSupplier} className="grid gap-4 sm:grid-cols-2">
          <Input label="Supplier name" name="name" value={supplierForm.name} onChange={handleSupplierChange} required className="sm:col-span-2" />
          <Input label="Email" name="email" type="email" value={supplierForm.email} onChange={handleSupplierChange} />
          <Input label="Phone" name="phone" value={supplierForm.phone} onChange={handleSupplierChange} />
          <ModalFooter className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setShowSupplierModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create supplier</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal open={showSupplyModal} onClose={() => setShowSupplyModal(false)} title="Record supply" description="Only active suppliers appear here. Stock increases after submission." size="lg">
        <form onSubmit={handleRecordSupply} className="grid gap-4 sm:grid-cols-2">
          <Select label="Supplier" name="supplier_id" value={supplyForm.supplier_id} onChange={handleSupplyChange} required className="sm:col-span-2">
            <option value="">Select active supplier</option>
            {activeSuppliers.map((s) => (
              <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
            ))}
          </Select>
          <Select label="Product" name="product_id" value={supplyForm.product_id} onChange={handleSupplyChange} required className="sm:col-span-2">
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.p_name} (current stock: {p.quantity})
              </option>
            ))}
          </Select>
          <Input label="Quantity" name="quantity" type="number" min="1" value={supplyForm.quantity} onChange={handleSupplyChange} required />
          <Input label="Purchase cost (₹)" name="purchase_cost" type="number" min="0" step="0.01" value={supplyForm.purchase_cost} onChange={handleSupplyChange} required />
          <ModalFooter className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setShowSupplyModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting} disabled={!supplyForm.supplier_id || !supplyForm.product_id}>Record supply</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal
        open={!!editSupplyForm}
        onClose={() => { setEditSupplyForm(null); setAuditLog([]); }}
        title="Edit supply transaction"
        description={`${editSupplyForm?.product_name} from ${editSupplyForm?.supplier_name}. Quantity changes adjust inventory automatically.`}
        size="lg"
      >
        {editSupplyForm && (
          <form onSubmit={handleUpdateSupply} className="grid gap-4 sm:grid-cols-2">
            <Input label="Quantity" name="quantity" type="number" min="1" value={editSupplyForm.quantity} onChange={handleEditSupplyChange} required />
            <Input label="Purchase cost (₹)" name="purchase_cost" type="number" min="0" step="0.01" value={editSupplyForm.purchase_cost} onChange={handleEditSupplyChange} required />
            <Input label="Supply date" name="supplied_date" type="datetime-local" value={editSupplyForm.supplied_date} onChange={handleEditSupplyChange} required className="sm:col-span-2" />

            {auditLog.length > 0 && (
              <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Audit log</p>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-slate-600">
                  {auditLog.map((entry) => (
                    <li key={entry.audit_id}>
                      <span className="font-medium">{entry.field_name}</span>: {entry.old_value ?? "—"} → {entry.new_value ?? "—"}
                      <span className="ml-2 text-slate-400">{new Date(entry.changed_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ModalFooter className="sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => { setEditSupplyForm(null); setAuditLog([]); }}>Cancel</Button>
              <Button type="submit" loading={submitting}>Save changes</Button>
            </ModalFooter>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusChange}
        title={statusTarget?.action === "deactivate" ? "Deactivate supplier?" : "Reactivate supplier?"}
        description={
          statusTarget?.action === "deactivate"
            ? `${statusTarget?.name} will be hidden from supply forms. Historical supply records are preserved.`
            : `${statusTarget?.name} will appear in supply forms again.`
        }
        confirmLabel={statusTarget?.action === "deactivate" ? "Deactivate" : "Reactivate"}
        variant={statusTarget?.action === "deactivate" ? "danger" : "primary"}
      />
    </AppLayout>
  );
}
