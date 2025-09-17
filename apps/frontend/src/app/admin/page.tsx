import DashboardLayout from "./layout";

export default function AdminHomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, Admin</h1>
        <p className="text-gray-600">
          Use the sidebar to manage trucks, delivery points, users, and trips.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">🚚 Trucks</h2>
            <p className="text-gray-600 text-sm">Manage vehicle fleet, models, and license plates.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">🏥 Delivery Points</h2>
            <p className="text-gray-600 text-sm">Add or edit hospitals, clinics, and puskesmas.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">👥 Users</h2>
            <p className="text-gray-600 text-sm">Manage drivers, admins, and access roles.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">📝 Trips</h2>
            <p className="text-gray-600 text-sm">View and log trip history and costs.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">📊 Reports</h2>
            <p className="text-gray-600 text-sm">Coming soon: Cost summaries and analytics.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}