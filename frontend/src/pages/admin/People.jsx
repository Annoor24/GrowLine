import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/index.js";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusPill from "../../components/StatusPill.jsx";

// MOCK summary tiles from the design; the real numbers come from the API.
const FARMER_TILES = [
  { label: "Farmers", value: "1,200", note: "Unique farmer profiles" },
  { label: "Farms", value: "1,680", note: "Separate farm records" },
  { label: "Multi-farm farmers", value: "320", note: "More than one farm" },
  { label: "Awaiting GPS checks", value: "168", note: "Across all farms" },
];
const FARM_TILES = [
  { label: "Total farms", value: "1,680", note: "Across 1,200 farmers" },
  { label: "Verified", value: "1,512", note: "90% of farms" },
  { label: "Pending verification", value: "146", note: "Farm location review" },
  { label: "Invalid GPS", value: "22", note: "Requires recapture" },
];

export function AdminFarmers() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(api.adminFarmers);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "id", label: "Farmer ID" },
    { key: "name", label: "Farmer" },
    { key: "phone", label: "Phone" },
    { key: "farms", label: "Farms" },
    { key: "api", label: "Pilot API" },
    { key: "location", label: "Location" },
    { key: "status", label: "Status", render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];
  return (
    <div className="stack">
      <PageHeader title="Farmer management" subtitle="One farmer can own multiple tomato farms" />
      <div className="grid grid-4">
        {FARMER_TILES.map((tile) => (
          <StatCard key={tile.label} {...tile} />
        ))}
      </div>
      <Card title="Farmer directory" subtitle="Farmer ID is unique; API assigned per farmer for pilot consistency">
        <DataTable
          columns={columns}
          rows={data}
          onRowClick={(row) => navigate(`/admin/farmers/${row.id}`)}
          empty="No farmers have been registered yet."
        />
      </Card>
    </div>
  );
}

export function AdminFarmerDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.adminFarmers(), api.adminFarms(), api.adminAlerts()]),
    [id],
  );
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const [farmers, farms, alerts] = data;
  const farmer = farmers.find((item) => item.id === id);
  if (!farmer) return <p className="notice notice-warning">Farmer not found.</p>;
  const farmerFarms = farms.filter((farm) => farm.farmerId === id);
  const farmerAlerts = alerts.filter((alert) => alert.farmerId === id);

  const farmColumns = [
    { key: "id", label: "Farm ID" },
    { key: "size", label: "Farm size" },
    { key: "status", label: "GPS status", render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];
  const alertColumns = [
    { key: "id", label: "Alert ID" },
    { key: "farmId", label: "Farm ID" },
    { key: "api", label: "Weather API" },
    { key: "delivery", label: "SMS status", render: (row) => <StatusPill>{row.delivery}</StatusPill> },
    { key: "feedback", label: "Feedback", render: (row) => <StatusPill>{row.feedback}</StatusPill> },
    { key: "sentAt", label: "Timestamp" },
  ];

  return (
    <div className="stack">
      <PageHeader title={`Farmer profile / ${farmer.id}`} subtitle={`${farmer.name} • ${farmer.api} • ${farmer.location}`} />
      <div className="grid grid-2">
        <Card title="Farmer information">
          <div className="kv">
            <span>Phone: {farmer.phone}</span>
            <span>Crop: Tomatoes only</span>
            <div>
              <StatusPill>{farmer.status}</StatusPill>
            </div>
          </div>
        </Card>
        <Card title="Farm portfolio" subtitle={`${farmerFarms.length} farms under one farmer ID`}>
          <DataTable columns={farmColumns} rows={farmerFarms} empty="No farms recorded." />
        </Card>
      </div>
      <Card title="Pilot and communication history" subtitle="API assignment inherited by this farmer's farms for the test">
        <DataTable columns={alertColumns} rows={farmerAlerts} empty="No alerts sent yet." />
      </Card>
    </div>
  );
}

export function AdminFarms() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(api.adminFarms);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "id", label: "Farm ID" },
    { key: "farmerId", label: "Farmer ID" },
    { key: "crop", label: "Crop" },
    { key: "size", label: "Estimated size" },
    { key: "gps", label: "GPS coordinates" },
    { key: "status", label: "GPS status", render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];
  return (
    <div className="stack">
      <PageHeader title="Farm registry" subtitle="Individual GPS records for each tomato farm" />
      <div className="grid grid-4">
        {FARM_TILES.map((tile) => (
          <StatCard key={tile.label} {...tile} />
        ))}
      </div>
      <Card title="Farm records" subtitle="Do not derive exact boundaries from centre point + estimated area">
        <DataTable
          columns={columns}
          rows={data}
          onRowClick={(row) => navigate(`/admin/farms/${row.id}`)}
          empty="No farms have been recorded yet."
        />
      </Card>
    </div>
  );
}

export function AdminFarmDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(
    () => Promise.all([api.adminFarms(), api.adminFarmers(), api.adminAlerts()]),
    [id],
  );
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const [farms, farmers, alerts] = data;
  const farm = farms.find((item) => item.id === id);
  if (!farm) return <p className="notice notice-warning">Farm not found.</p>;
  const farmer = farmers.find((item) => item.id === farm.farmerId);
  const farmAlerts = alerts.filter((alert) => alert.farmId === id);

  const alertColumns = [
    { key: "id", label: "Alert ID" },
    { key: "api", label: "API" },
    { key: "delivery", label: "Delivery", render: (row) => <StatusPill>{row.delivery}</StatusPill> },
    { key: "feedback", label: "Feedback", render: (row) => <StatusPill>{row.feedback}</StatusPill> },
    { key: "sentAt", label: "Date" },
  ];

  return (
    <div className="stack">
      <PageHeader
        title={`Farm detail / ${farm.id}`}
        subtitle={farmer ? `${farmer.name} (${farmer.id}) • Tomatoes` : "Tomatoes"}
      />
      <div className="grid grid-2">
        <Card title="Location & identity">
          <div className="kv">
            <span>
              Farmer: {farm.farmerId}
              {farmer ? ` / ${farmer.name}` : ""}
            </span>
            <span>Crop: {farm.crop}</span>
            <span>Estimated area: {farm.size}</span>
            <span>Centre coordinates: {farm.gps}</span>
            <div>
              <StatusPill>{farm.status}</StatusPill>
            </div>
            <span className="muted small">Boundary polygon: Not available</span>
          </div>
        </Card>
        <Card title="Verification checks">
          <div className="kv">
            <span>Location accuracy: {farm.accuracy}</span>
            <div>
              <StatusPill>{farm.confidence}</StatusPill>
            </div>
            {farm.status !== "Verified" ? (
              <>
                <span>GPS must be confirmed before precision alerts.</span>
                <span>Suggested action: request location recapture.</span>
              </>
            ) : null}
          </div>
        </Card>
      </div>
      <Card title="Farm alert history">
        <DataTable columns={alertColumns} rows={farmAlerts} empty="No alerts sent yet." />
      </Card>
      <div>
        <Button variant="secondary" as={Link} to="/admin/farms">
          Back to farm registry
        </Button>
      </div>
    </div>
  );
}
