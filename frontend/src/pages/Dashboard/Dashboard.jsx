import { useState } from "react";
import ProfileCard from "../../layouts/ProfileCard/ProfileCard.jsx";
import "./Dashboard.css";

const stats = [
  { label: "Total Users", value: "51" },
  { label: "Total Asset", value: "165" },
  { label: "Computers", value: "110" },
  { label: "Faulty Items", value: "6", highlight: true },
];

const recentItems = [
  { title: "HP Laptop", status: "AVAILABLE", variant: "success" },
  { title: "Dell Monitor", status: "ASSIGNED", variant: "info" },
  { title: "Cisco Switch", status: "FAULTY", variant: "danger" },
];

const vendors = [
  { name: "HP India", value: "42 Items" },
  { name: "Lenovo", value: "31 Items" },
  { name: "Cisco", value: "15 Devices" },
];

const schedule = [
  { title: "Printer Room", date: "20 Oct" },
  { title: "Server Rack", date: "25 Oct" },
  { title: "Lab 2 PCs", date: "28 Oct" },
];

const statusOverview = [
  { label: "In Stock", value: "84" },
  { label: "Assigned", value: "136" },
  { label: "In Repair", value: "14" },
  { label: "Retired", value: "6" },
];

const alerts = [
  {
    asset: "Dell OptiPlex 3080",
    category: "Desktop",
    issue: "Warranty Expiring Soon",
    reported: "15-Oct-2025",
    status: "In Process",
  },
  {
    asset: "Cisco Switch 2960",
    category: "Networking",
    issue: "Device Down",
    reported: "18-Oct-2025",
    status: "Critical",
  },
  {
    asset: "HP EliteBook 850",
    category: "Laptop",
    issue: "Battery Health Moderate",
    reported: "17-Oct-2025",
    status: "Resolved",
  },
  {
    asset: "Projector EPSON X500",
    category: "Peripheral",
    issue: "Lamp Replacement Due",
    reported: "14-Oct-2025",
    status: "Pending",
  },
];

const Dashboard = () => {
  const [profile] = useState({
    name: "Super Admin",
    role: "SUPER_ADMIN",
    userId: "superadmin",
  });

  const [branch, setBranch] = useState("__ALL__");
  const [selectedAppModule, setSelectedAppModule] = useState("IT_OPERATIONS");

  const branchOptions = [
    { value: "north", label: "North Zone" },
    { value: "east", label: "East Zone" },
    { value: "west", label: "West Zone" },
  ];

  const appModuleOptions = [
    { value: "IT_OPERATIONS", label: "IT Operations" },
    { value: "FINANCE", label: "Finance" },
    { value: "HR", label: "HR" },
    { value: "SALES", label: "Sales" },
  ];

  const handleApplyFilters = () => {
    console.log("Applying filters:", { branch, selectedAppModule });
  };

  return (
    <>
      <div className="dashboard">
        <div className="dash-header">
          <div>
            <h1>IT Asset Overview</h1>
            <p>School-wide visibility of assets, issues, and maintenance</p>
          </div>
        </div>

        <div className="stats-wrapper">
          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-tile">
                <span className="stat-title">{stat.label}</span>
                <span
                  className={`stat-value ${stat.highlight ? "danger" : ""}`}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-profile-actions">
          <div className="dashboard-profile-box">
            <ProfileCard
              profile={profile}
              branch={branch}
              setBranch={setBranch}
              branchOptions={branchOptions}
              selectedAppModule={selectedAppModule}
              setSelectedAppModule={setSelectedAppModule}
              appModuleOptions={appModuleOptions}
              onApplyFilters={handleApplyFilters}
            />
          </div>

          <div className="quick-actions">
            <button
              type="button"
              className="dashboard-action-button dashboard-action-button--primary"
            >
              Add Item
            </button>
            <button
              type="button"
              className="dashboard-action-button dashboard-action-button--secondary"
            >
              View Reports
            </button>
            <button
              type="button"
              className="dashboard-action-button dashboard-action-button--ghost"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
