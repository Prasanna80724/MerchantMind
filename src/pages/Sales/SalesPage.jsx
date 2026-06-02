import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "../../components/Layout/AppLayout";
import PageHeader from "../../components/PageHeader/PageHeader";
import SearchBar from "../../components/SearchBar/SearchBar";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import DataTable from "../../components/DataTable/DataTable";
import Modal, { ModalFooter } from "../../components/Modal/Modal";
import Input, { Select } from "../../components/Input/Input";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import Badge from "../../components/Badge/Badge";
import { getSales, recordSale } from "../../services/salesService";

const emptySale = {
  product_id: "",
  quantity: "",
  total_price: "",
  customer_name: "",
  payment_method: "Cash",
};

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptySale);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await getSales();
      setSales(data);
    } catch (err) {
      toast.error(err.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await recordSale(formData);
      if (response.ok) {
        toast.success("Sale recorded successfully!");
        fetchSales();
        setShowModal(false);
        setFormData(emptySale);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to record sale");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSales = sales.filter((sale) => {
    const query = searchQuery.toLowerCase().trim();
    const saleDate = new Date(sale.sales_date).toISOString().split("T")[0];
    const matchesQuery =
      !searchQuery ||
      sale.sales_id?.toString().includes(query) ||
      sale.product_id?.toString().includes(query) ||
      sale.customer_name?.toLowerCase().includes(query) ||
      sale.payment_method?.toLowerCase().includes(query) ||
      sale.p_name?.toLowerCase().includes(query);
    const matchesDate = !startDate || saleDate === startDate;
    return matchesQuery && matchesDate;
  });

  const columns = [
    { key: "id", label: "Sale ID", render: (r) => `#${r.sales_id}` },
    { key: "product", label: "Product", render: (r) => r.p_name || `Product #${r.product_id}` },
    { key: "qty", label: "Qty", render: (r) => r.quantity },
    { key: "price", label: "Total", render: (r) => `₹${parseFloat(r.total_price || 0).toFixed(2)}` },
    { key: "date", label: "Date", render: (r) => (r.sales_date ? new Date(r.sales_date).toLocaleDateString() : "N/A") },
    { key: "customer", label: "Customer", render: (r) => r.customer_name },
    { key: "payment", label: "Payment", render: (r) => <Badge variant="brand">{r.payment_method}</Badge> },
  ];

  return (
    <AppLayout>
      <PageHeader
        title="Sales"
        description="Track and record customer transactions"
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Record sale
          </Button>
        }
      />

      <Card className="mb-6">
        <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search sales...">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </SearchBar>
      </Card>

      {loading ? (
        <Loader label="Loading sales..." />
      ) : filteredSales.length === 0 ? (
        <EmptyState title="No sales found" description="Record your first sale to get started." action={<Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Record sale</Button>} />
      ) : (
        <DataTable columns={columns} data={filteredSales} rowKey={(r) => r.sales_id} />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record new sale" description="Enter sale details below." size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Product ID" name="product_id" type="number" value={formData.product_id} onChange={handleInputChange} required />
          <Input label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required />
          <Input label="Total price (₹)" name="total_price" type="number" step="0.01" value={formData.total_price} onChange={handleInputChange} required />
          <Input label="Customer name" name="customer_name" value={formData.customer_name} onChange={handleInputChange} required />
          <Select label="Payment method" name="payment_method" value={formData.payment_method} onChange={handleInputChange} required>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Net Banking">Net Banking</option>
            <option value="UPI">UPI</option>
          </Select>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Submit sale</Button>
          </ModalFooter>
        </form>
      </Modal>
    </AppLayout>
  );
}
