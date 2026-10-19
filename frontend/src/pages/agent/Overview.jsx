import { Link } from "react-router-dom";
import { api } from "../../api/index.js";
import useAsync from "../../hooks/useAsync.js";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import DataTable from "../../components/DataTable.jsx";
import Loading from "../../components/Loading.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusPill from "../../components/StatusPill.jsx";

export default function AgentOverview() {
  const { data, loading, error, reload } = useAsync(api.agentOverview);
  if (loading || !data) return <Loading error={error} onRetry={reload} />;

  const { summary } = data;
  const columns = [
    { key: "farmer", label: "Farmer" },
    { key: "farmId", label: "Farm ID" },
    { key: "risk", label: "Weather risk", render: (row) => <StatusPill>{row.risk}</StatusPill> },
    { key: "sms", label: "SMS status", render: (row) => <StatusPill>{row.sms}</StatusPill> },
    { key: "api", label: "Weather API" },
    { key: "sentAt", label: "Sent at" },
  ];

  return (
    <div className="stack">
      <PageHeader
        crumb="GrowLine / Extension Agent"
        title={`Good morning, ${data.name}`}
        subtitle={`${data.dateLabel} · ${data.area}`}
        actions={[
          <Button key="refresh" variant="secondary" onClick={() => window.location.reload()}>
            Refresh
          </Button>,
          <Button key="add" as={Link} to="/agent/farms/new">
            + Add farm
          </Button>,
        ]}
      />

      <Card title="Today's priorities" actions={<StatusPill tone="warning">{data.prioritiesBadge}</StatusPill>}>
        <div className="priority-list">
          {data.priorities.map((item) => (
            <div key={item.title} className={`notice notice-${item.tone}`}>
              <strong>{item.title}</strong>
              <div className="small">{item.note}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-4">
        {data.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-2">
        <Card title="Farm advisory summary" subtitle={`${summary.total} monitored tomato farms`} actions={<StatusPill>Today</StatusPill>}>
          <div className="risk-bar">
            <span style={{ flex: summary.favourable }} />
            <span style={{ flex: summary.caution }} />
            <span style={{ flex: summary.highRisk }} />
          </div>
          <div className="row" style={{ marginTop: 12, gap: 32 }}>
            <div>
              <div className="small muted">Favourable</div>
              <strong>{summary.favourable}</strong>
            </div>
            <div>
              <div className="small muted">Caution</div>
              <strong>{summary.caution}</strong>
            </div>
            <div>
              <div className="small muted">High risk</div>
              <strong>{summary.highRisk}</strong>
            </div>
          </div>
          <p style={{ marginTop: 12 }}>
            <Link className="link-button" to="/agent/advisory">
              View farm advisories
            </Link>
          </p>
        </Card>
      </div>

      <Card
        title="Recent advisory activity"
        actions={
          <Link className="link-button" to="/agent/sms">
            View all activity
          </Link>
        }
      >
        <DataTable columns={columns} rows={data.recent} />
      </Card>

      <div className="grid grid-2">
        <Card title="Farm registration & verification">
          <div className="kv">
            <span>{data.registration.verified} verified GPS locations</span>
            <span className="muted">{data.registration.awaiting} farms awaiting GPS verification</span>
            <Link className="link-button" to="/agent/farms">
              Review pending farms
            </Link>
          </div>
        </Card>
        <Card title="Quick actions">
          <div className="row">
            <Button variant="soft" as={Link} to="/agent/farmers/new">
              Register farmer
            </Button>
            <Button variant="soft" as={Link} to="/agent/farms/new">
              Add farm
            </Button>
            <Button variant="soft" as={Link} to="/agent/advisory">
              Send SMS
            </Button>
          </div>
          <p style={{ marginTop: 12 }}>
            <Link className="link-button" to="/agent/farmers">
              Manage farmers
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
