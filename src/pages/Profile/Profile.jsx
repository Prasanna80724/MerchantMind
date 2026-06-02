import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "../../context/UserContext";
import AppLayout from "../../components/Layout/AppLayout";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import Loader from "../../components/Loader/Loader";
import PurchaseOrderPreview from "../../components/PurchaseOrder/PurchaseOrderPreview";
import { getProfile, updateCompanyProfile } from "../../services/profileService";

export default function Profile() {
  const { username, userId } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [company, setCompany] = useState({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_gst: "",
    company_website: "",
    company_logo_url: "",
  });

  useEffect(() => {
    getProfile()
      .then((data) => {
        setAccountEmail(data.email || "");
        setCompany({
          company_name: data.company_name || "",
          company_address: data.company_address || "",
          company_phone: data.company_phone || "",
          company_email: data.company_email || "",
          company_gst: data.company_gst || "",
          company_website: data.company_website || "",
          company_logo_url: data.company_logo_url || "",
        });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompanyProfile(company);
      toast.success("Company profile updated — new purchase orders will use this branding");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const previewPayload = {
    buyer: {
      name: company.company_name || username || "Our Company",
      email: company.company_email || accountEmail,
      phone: company.company_phone,
      address: company.company_address,
      gst: company.company_gst,
      website: company.company_website,
      logoUrl: company.company_logo_url,
    },
    purchaseOrder: {
      number: "PO-PREVIEW",
      date: new Date().toISOString(),
      status: "Pending",
      expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    },
    supplier: {
      name: "Sample Supplier Co.",
      email: "supplier@example.com",
      phone: "+91 90000 00000",
      address: "",
    },
    lineItems: [{ product: "Sample Product", quantityRequested: 10, unitCost: 500, estimatedTotal: 5000 }],
    summary: { estimatedTotal: 5000 },
    meta: {
      generatedAt: new Date().toISOString(),
      specialInstructions: "Preview of your purchase order layout with separated buyer and supplier sections.",
    },
  };

  if (loading) {
    return (
      <AppLayout>
        <Loader label="Loading profile..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Profile" description="Account and company branding used on purchase orders" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Account</h3>
          <dl className="mb-6 space-y-3">
            <div>
              <dt className="text-sm text-slate-500">Username</dt>
              <dd className="font-semibold text-slate-900">{username || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Email</dt>
              <dd className="font-semibold text-slate-900">{accountEmail || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">User ID</dt>
              <dd className="font-semibold text-slate-900">{userId || "N/A"}</dd>
            </div>
          </dl>

          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Company branding</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <Input label="Company name" name="company_name" value={company.company_name} onChange={handleChange} required />
            <Input label="Address" name="company_address" value={company.company_address} onChange={handleChange} />
            <Input label="Phone" name="company_phone" value={company.company_phone} onChange={handleChange} />
            <Input
              label="Company email (shown on purchase orders)"
              name="company_email"
              type="email"
              value={company.company_email}
              onChange={handleChange}
              placeholder={accountEmail || "orders@yourcompany.com"}
            />
            <Input label="GST number (optional)" name="company_gst" value={company.company_gst} onChange={handleChange} />
            <Input label="Website (optional)" name="company_website" value={company.company_website} onChange={handleChange} />
            <Input label="Logo URL (optional)" name="company_logo_url" type="url" value={company.company_logo_url} onChange={handleChange} placeholder="https://..." />
            <Button type="submit" loading={saving}>Save company profile</Button>
          </form>
        </Card>

        <div>
          <p className="mb-3 text-sm font-medium text-slate-600">Purchase order preview</p>
          <PurchaseOrderPreview data={previewPayload} compact />
        </div>
      </div>
    </AppLayout>
  );
}
