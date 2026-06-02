import { useUser } from "../../context/UserContext";
import AppLayout from "../../components/Layout/AppLayout";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";

export default function Profile() {
  const { username, userId } = useUser();

  return (
    <AppLayout>
      <PageHeader title="Profile" description="Your account information" />
      <Card className="max-w-md">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-slate-500">Username</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{username || "N/A"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">User ID</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{userId || "N/A"}</dd>
          </div>
        </dl>
      </Card>
    </AppLayout>
  );
}
