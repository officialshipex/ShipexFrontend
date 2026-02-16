import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';

const StatsCard = ({ title, value, color }) => (
  <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${color}`}>
    <h2 className="text-sm font-medium text-gray-500">{title}</h2>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

const BarChartBox = ({ title, data, barColor }) => {
  // choose color per status
  const getBarColor = status => {
    switch (status) {
      case 'delivered': return barColor.Delivered;
      case 'rto': return barColor.RTO;
      case 'pending':
      case 'in-transit':
      case 'ready to ship': return barColor.Pending;
      case 'rto in-transit':
      case "rto delivered":
        case "cancelled":
      default: return '#3b82f6';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          barCategoryGap="20%"
          barGap={4}
        >
          <XAxis
            dataKey="status"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 10 }}
          />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="count"
            barSize={16}          // narrow bars
            label={{ position: 'top', fontSize: 10 }}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={getBarColor(entry.status.toLowerCase())} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};



const STATUS_ORDER = [
  'new',
  'ready to ship',
  'in-transit',
  'out for delivery',
  'delivered',
  'undelivered',
  'rto',
  'rto in-transit',
  'rto delivered',
  "cancelled"
];

const padStatuses = (rawData) =>
  STATUS_ORDER.map(status => ({
    status,
    count: rawData.find(d => d.status.toLowerCase() === status)?.count || 0
  }));

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    courierData: { Delhivery: [], EcomExpress: [], DTDC: [] }
  });
  const [loading, setLoading] = useState(true);
  const API = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/admin/dashboard`);
        setStats(data);
        console.log("datat",data)
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const courierColors = {
    Delivered: '#22c55e',
    RTO: '#ef4444',
    Pending: '#f59e0b'
  };

  if (loading) return <p className="text-gray-600">Loading...</p>;

  // Compute stats-card values once
  const sumByStatus = (status) =>
    Object.values(stats.courierData)
      .flat()
      .filter(d => d.status.toLowerCase() === status)
      .reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="p-1 min-h-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Orders" value={stats.totalOrders} color="border-blue-500" />
        <StatsCard title="Delivered" value={sumByStatus('delivered')} color="border-green-500" />
        <StatsCard title="Undelivered" value={sumByStatus('undelivered')} color="border-yellow-500" />
        <StatsCard title="RTO Orders" value={sumByStatus('rto')} color="border-red-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {Object.entries(stats.courierData).map(([courier, data]) => (
          <BarChartBox
            key={courier}
            title={`${courier} Performance`}
            data={padStatuses(data)}
            barColor={courierColors}
          />
        ))}
      </div>
    </div>
  );
};


export default Dashboard;
