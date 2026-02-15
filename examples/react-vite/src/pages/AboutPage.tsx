export function AboutPage() {
  return (
    <div className="page">
      <h1>About Libero Quantum</h1>
      <div className="card">
        <h2>What is Libero?</h2>
        <p>Libero Quantum is an autonomous testing platform that maps, generates, executes, and heals tests automatically.</p>
        
        <h3 style={{ marginTop: '1.5rem' }}>Key Features:</h3>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Framework-agnostic testing</li>
          <li>Intelligent test generation</li>
          <li>Self-healing selectors</li>
          <li>Parallel execution</li>
          <li>Rich reporting</li>
        </ul>
      </div>
    </div>
  );
}
