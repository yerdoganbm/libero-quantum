export function DashboardPage() {
  const stats = [
    { label: 'Tests Run', value: '1,234' },
    { label: 'Pass Rate', value: '94%' },
    { label: 'Coverage', value: '87%' },
  ];

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p className="subtitle">Your testing metrics at a glance</p>

      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Recent Tests</h2>
        <table style={{ width: '100%', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Status</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Login Flow</td>
              <td><span className="badge success">PASS</span></td>
              <td>1.2s</td>
            </tr>
            <tr>
              <td>Checkout Process</td>
              <td><span className="badge success">PASS</span></td>
              <td>3.4s</td>
            </tr>
            <tr>
              <td>Form Validation</td>
              <td><span className="badge success">PASS</span></td>
              <td>0.8s</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
