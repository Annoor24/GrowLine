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

const alertColumns = [
  { key: "code", label: "Alert ID" },
  { key: "farmCode", label: "Farm ID" },
  { key: "api", label: "Weather API" },
  { key: "directive", label: "Directive" },
  { key: "delivery", label: "SMS status", render: (row) => <StatusPill>{row.delivery}</StatusPill> },
  { key: "sentAt", label: "Sent" },
];

export function AdminFarmers() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() =>
    Promise.all([api.adminFarmers(), api.adminFarmerStats()]),
  );
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const [farmers, tiles] = data;
  const columns = [
    { key: "code", label: "Farmer ID" },
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
        {tiles.map((tile) => (
          <StatCard key={tile.label} {...tile} />
        ))}
      </div>
      <Card title="Farmer directory" subtitle="Farmer ID is unique; API assigned per farmer for pilot consistency">
        <DataTable
          columns={columns}
          rows={farmers}
          onRowClick={(row) => navigate(`/admin/farmers/${row.id}`)}
          empty="No farmers have been registered yet."
        />
      </Card>
    </div>
  );
}

export function AdminFarmerDetail() {
  const { id } = useParams();
  const { data: farmer, loading, error, reload } = useAsync(() => api.adminFarmerDetail(id), [id]);
  if (loading || !farmer) return <Loading error={error} onRetry={reload} />;

  const farmColumns = [
    { key: "code", label: "Farm ID" },
    { key: "name", label: "Farm" },
    { key: "size", label: "Farm size" },
    { key: "gps", label: "GPS status", render: (row) => <StatusPill>{row.gps}</StatusPill> },
    { key: "alerts", label: "Alerts" },
  ];

  return (
    <div className="stack">
      <PageHeader
        title={`Farmer profile / ${farmer.code}`}
        subtitle={`${farmer.name} • ${farmer.api} • ${farmer.location}`}
      />
      <div className="grid grid-2">
        <Card title="Farmer information">
          <div className="kv">
            <span>Phone: {farmer.phone}</span>
            <span>Crop: {farmer.crop}</span>
            <span>Registered: {farmer.registeredAt}</span>
            <div>
              <StatusPill>{farmer.status}</StatusPill>
            </div>
          </div>
        </Card>
        <Card title="Farm portfolio" subtitle={`${farmer.farms.length} farms under one farmer ID`}>
          <DataTable columns={farmColumns} rows={farmer.farms} empty="No farms recorded." />
        </Card>
      </div>
      <Card title="Pilot and communication history" subtitle="API assignment inherited by this farmer's farms for the test">
        <DataTable columns={alertColumns} rows={farmer.history} empty="No alerts sent yet." />
      </Card>
    </div>
  );
}

export function AdminFarms() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(api.adminFarms);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;
  const columns = [
    { key: "code", label: "Farm ID" },
    { key: "farmerCode", label: "Farmer ID" },
    { key: "crop", label: "Crop" },
    { key: "size", label: "Size" },
    { key: "coordinates", label: "GPS coordinates" },
    { key: "status", label: "GPS status", render: (row) => <StatusPill>{row.status}</StatusPill> },
  ];
  return (
    <div className="stack">
      <PageHeader title="Farm registry" subtitle="Individual GPS records for each tomato farm" />
      <div className="grid grid-4">
        {data.tiles.map((tile) => (
          <StatCard key={tile.label} {...tile} />
        ))}
      </div>
      <Card title="Farm records" subtitle="Do not derive exact boundaries from centre point + estimated area">
        <DataTable
          columns={columns}
          rows={data.rows}
          onRowClick={(row) => navigate(`/admin/farms/${row.id}`)}
          empty="No farms have been recorded yet."
        />
      </Card>
    </div>
  );
}

export function AdminFarmDetail() {
  const { id } = useParams();
  const { data: farm, loading, error, reload } = useAsync(() => api.adminFarmDetail(id), [id]);
  if (loading || !farm) return <Loading error={error} onRetry={reload} />;

  const needsReview = farm.status !== "Verified";
  const hasAccuracy = Boolean(farm.accuracy);

  return (
    <div className="stack">
      <PageHeader
        title={`Farm detail / ${farm.code}`}
        subtitle={`${farm.farmerName} (${farm.farmerCode}) • ${farm.crop}${
          farm.position ? ` • Farm ${farm.position.index} of ${farm.position.total}` : ""
        }`}
      />
      <div className="grid grid-2">
        <Card title="Location & identity">
          <div className="kv">
            <span>
              Farmer: {farm.farmerCode} / {farm.farmerName}
            </span>
            <span>Crop: {farm.crop}</span>
            <span>Estimated area: {farm.size}</span>
            <span>Coordinates: {farm.coordinates}</span>
            <div>
              <StatusPill>{farm.status}</StatusPill>
            </div>
          </div>
        </Card>
        <Card title="Verification checks">
          <div className="kv">
            <span>Location captured: {farm.locationCaptured ? "Yes" : "No"}</span>
            {hasAccuracy ? <span>Location accuracy: {farm.accuracy}</span> : null}
            {farm.confidence ? (
              <div>
                <StatusPill>{farm.confidence}</StatusPill>
              </div>
            ) : null}
            {needsReview ? (
              <>
                <span>GPS must be confirmed before precision alerts.</span>
                <span>Suggested action: request location recapture.</span>
              </>
            ) : null}
            {!hasAccuracy ? (
              <span className="muted small">Accuracy and confidence are not provided by the backend yet.</span>
            ) : null}
          </div>
        </Card>
      </div>
      <Card title="Farm alert history">
        <DataTable columns={alertColumns} rows={farm.alerts} empty="No alerts sent yet." />
      </Card>
      <div>
        <Button variant="secondary" as={Link} to="/admin/farms">
          Back to farm registry
        </Button>
      </div>
    </div>
  );
}
