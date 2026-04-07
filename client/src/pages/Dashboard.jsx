import { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "./Dashboard.css";

import { Radar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function Dashboard() {

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef(null);

  /* ===============================
     Upload Video
  =============================== */

  const handleUpload = async () => {

    if (!file) return alert("Please select a video");

    try {

      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        }
      );

      setResult(res.data);

    } catch (err) {

      console.error(err);
      alert("Video analysis failed");

    } finally {

      setLoading(false);

    }

  };

  /* ===============================
     PDF Export
  =============================== */

  const downloadPDF = () => {

    if (!result) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("SmartKick AI Performance Report", 20, 20);

    doc.setFontSize(12);

    doc.text(`Performance Score: ${result.performance_score}`, 20, 40);
    doc.text(`Distance Covered: ${result.distance_meters} meters`, 20, 50);
    doc.text(`Average Speed: ${result.avg_speed_m_per_s} m/s`, 20, 60);
    doc.text(`Active Time: ${result.active_time_percent}%`, 20, 70);

    doc.text("Tactical Insights:", 20, 90);

    let y = 100;

    const insights = Array.isArray(result.tactical_insight)
      ? result.tactical_insight
      : [result.tactical_insight];

    insights.forEach((insight) => {
      doc.text(`• ${insight}`, 20, y);
      y += 10;
    });

    doc.save("SmartKick_Report.pdf");

  };

  /* ===============================
     Radar Chart Data
  =============================== */

  const radarData = result ? {
    labels: ["Performance", "Speed", "Activity", "Distance"],
    datasets: [
      {
        label: "Player Metrics",
        data: [
          result.performance_score || 0,
          (result.avg_speed_m_per_s || 0) * 10,
          result.active_time_percent || 0,
          (result.distance_meters || 0) / 10
        ],
        backgroundColor: "rgba(255,99,132,0.2)",
        borderColor: "rgba(255,99,132,1)",
        borderWidth: 2
      }
    ]
  } : null;

  /* ===============================
     Draw Heatmap
  =============================== */

  useEffect(() => {

    if (!result || !result.coordinates) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#166534";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    ctx.strokeRect(0, 0, w, h);

    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeRect(0, h / 2 - 110, 90, 220);
    ctx.strokeRect(w - 90, h / 2 - 110, 90, 220);
    ctx.strokeRect(0, h / 2 - 55, 40, 110);
    ctx.strokeRect(w - 40, h / 2 - 55, 40, 110);
    ctx.strokeRect(-10, h / 2 - 30, 10, 60);
    ctx.strokeRect(w, h / 2 - 30, 10, 60);

    ctx.fillStyle = "white";

    ctx.beginPath();
    ctx.arc(60, h / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(w - 60, h / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "red";

    if (Array.isArray(result.coordinates)) {
      result.coordinates.forEach((p) => {
        if (!Array.isArray(p)) return;
        const x = p[0] * w;
        const y = p[1] * h;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

  }, [result]);

  return (

    <div className="dashboard">

      <h1>⚽ SmartKick AI Dashboard</h1>

      <p>Upload a training video to analyze player performance.</p>

      {/* ================================
          🧪 Test Section
      ================================ */}
      <div style={{
        background: "#1a1a2e",
        border: "1px solid #333",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px"
      }}>

        
      {/* ================================
          📤 Upload Box
      ================================ */}
      <div className="upload-box">

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          className="upload-btn"
          onClick={handleUpload}
        >
          {loading ? "Analyzing..." : "Upload Video"}
        </button>

      </div>
      <br></br>

      

        <p style={{ color: "#aaa", marginBottom: "12px" }}>
          Don't have a video? Download a sample football training clip below:
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>

          <a
            href="/demoVGoalScored.mp4"
            download
            style={{
              background: "#1a1a2e",
        border: "1px solid #333",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "24px"
            }}
          >
            Download Test Video 1
          </a>

          <a
            href="/demoVNoGoal.mp4"
            download
            style={{
              background: "#1a1a2e",
        border: "1px solid #333",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px"
            }}
          >
            Download Test Video 2
          </a>

        </div>

       

      </div>


      {result && (

        <>

          {/* Stats Cards */}
          <div className="stats-grid">
            <StatCard title="Performance Score" value={result.performance_score} />
            <StatCard title="Distance (m)" value={result.distance_meters} />
            <StatCard title="Avg Speed (m/s)" value={result.avg_speed_m_per_s} />
            <StatCard title="Active Time (%)" value={result.active_time_percent} />
          </div>

          {/* Charts */}
          <div className="chart-grid">

            <div className="chart-box">
              <h3>Performance Radar</h3>
              {radarData && <Radar data={radarData} />}
            </div>

            <div className="chart-box">
              <h3>Movement Heatmap</h3>
              <canvas ref={canvasRef} width="500" height="350" />
            </div>

          </div>

          {/* PDF Button */}
          <button className="pdf-btn" onClick={downloadPDF}>
            Download PDF Report
          </button>

          {/* Tactical Insights */}
          <div className="insights-box">
            <h3>Tactical Insights</h3>
            {Array.isArray(result.tactical_insight) ? (
              result.tactical_insight.map((insight, i) => (
                <p key={i}>• {insight}</p>
              ))
            ) : (
              <p>• {result.tactical_insight}</p>
            )}
          </div>

        </>

      )}

    </div>

  );

}

/* Stat Card */
function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
}

export default Dashboard;
