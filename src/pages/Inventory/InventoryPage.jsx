import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import ProductImage from "../../components/ProductImage/ProductImage";
import { StockBadge } from "../../components/Badge/Badge";
import Loader from "../../components/Loader/Loader";
import EmptyState from "../../components/EmptyState/EmptyState";
import { addProduct, deleteProduct, getInventory } from "../../services/productService";

const emptyProduct = {
  product_id: "",
  p_name: "",
  description: "",
  category: "",
  price: "",
  threshold: "",
  image_url: "",
};

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newProduct, setNewProduct] = useState(emptyProduct);

  const fetchProducts = async () => {
    try {
      const data = await getInventory();
      setProducts(data);
    } catch {
      toast.error("Failed to load inventory");
    }
  };

  useEffect(() => {
    fetchProducts().finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch = Object.values(product).some((v) =>
      v?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await addProduct(newProduct);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add product");
      toast.success("Product created with zero stock. Record a supply to add inventory.");
      await fetchProducts();
      setNewProduct(emptyProduct);
      setShowModal(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget);
      toast.success("Product deleted");
      await fetchProducts();
    } catch (err) {
      toast.error(err.message || "Product cannot be deleted");
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      key: "product",
      label: "Product",
      render: (row) => (
        <div className="flex items-center gap-3">
          <ProductImage name={row.p_name} src={row.image_url} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{row.p_name}</p>
            <p className="text-xs text-slate-500">ID: {row.product_id}</p>
          </div>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (row) => row.category || "—" },
    { key: "price", label: "Price", render: (row) => `₹${Number(row.price).toLocaleString()}` },
    {
      key: "stock",
      label: "Stock",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.quantity}</span>
          <StockBadge quantity={row.quantity} threshold={row.threshold} />
        </div>
      ),
    },
    {
      key: "updated",
      label: "Updated",
      render: (row) => (row.updated_at ? new Date(row.updated_at).toLocaleDateString() : "N/A"),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDeleteTarget(row.product_id)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-danger-light hover:text-danger"
          aria-label={`Delete ${row.p_name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <Loader label="Loading inventory..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Inventory"
        description="Products catalog and current stock. Stock increases only via supply transactions."
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Add product
          </Button>
        }
      />

      <Card className="mb-6">
        <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products...">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </SearchBar>
      </Card>

      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Create a product first, then record supply from the Suppliers page."
          action={<Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Add product</Button>}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.slice(0, 4).map((product) => (
              <Card key={product.product_id} hover className="!p-4">
                <div className="flex items-start gap-3">
                  <ProductImage name={product.p_name} src={product.image_url} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{product.p_name}</p>
                    <p className="text-sm text-slate-500">{product.category}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold text-brand-600">₹{product.price}</span>
                      <StockBadge quantity={product.quantity} threshold={product.threshold} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <DataTable columns={columns} data={filteredProducts} rowKey={(row) => row.product_id} />
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add new product" description="Products start with zero stock. Use Suppliers → Record Supply to add inventory." size="lg">
        <form onSubmit={handleAddProduct} className="grid gap-4 sm:grid-cols-2">
          <Input label="Product ID" name="product_id" value={newProduct.product_id} onChange={handleInputChange} required />
          <Input label="Product name" name="p_name" value={newProduct.p_name} onChange={handleInputChange} required />
          <Input label="Category" name="category" value={newProduct.category} onChange={handleInputChange} required />
          <Input label="Price (₹)" name="price" type="number" min="0" step="0.01" value={newProduct.price} onChange={handleInputChange} required />
          <Input label="Low-stock threshold" name="threshold" type="number" min="0" value={newProduct.threshold} onChange={handleInputChange} required />
          <Input label="Image URL" name="image_url" type="url" value={newProduct.image_url} onChange={handleInputChange} required placeholder="https://..." />
          <Input label="Description" name="description" value={newProduct.description} onChange={handleInputChange} required className="sm:col-span-2" />
          <ModalFooter className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create product</Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProduct}
        title="Delete product?"
        description="Products with sales, supply history, or remaining stock cannot be deleted."
        confirmLabel="Delete"
        variant="danger"
      />
    </AppLayout>
  );
}
