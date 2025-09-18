import { Card, Statistic, Row, Col } from 'antd';

export default function OverviewPage() {
  return (
    <div>
      <h1>Overview</h1>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Total Trips" value={15} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Active Drivers" value={8} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Available Trucks" value={5} />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <h2>Recent Activities</h2>
        <ul>
          <li>Driver "Budi" started trip to RSUD Palangkaraya</li>
          <li>Truck "TRK-001" assigned to new route</li>
          <li>New delivery point added: Puskesmas Jago</li>
        </ul>
      </div>
    </div>
  );
}