export default function TestPage() {
  return (
    <div style={{ padding: "20px", backgroundColor: "#f0f0f0" }}>
      <h1 style={{ color: "blue", fontSize: "32px", marginBottom: "20px" }}>
        Test Page - Inline CSS
      </h1>
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ marginBottom: "10px" }}>
          If you can see this styled, then:
        </p>
        <ul style={{ marginLeft: "20px" }}>
          <li>✅ React is working</li>
          <li>✅ Next.js is working</li>
          <li>❌ Tailwind CSS is NOT working</li>
        </ul>
      </div>

      <div className="mt-8 p-4 bg-blue-500 text-white rounded-lg">
        <p>
          If this box has blue background and white text, Tailwind is working!
        </p>
      </div>
    </div>
  );
}
