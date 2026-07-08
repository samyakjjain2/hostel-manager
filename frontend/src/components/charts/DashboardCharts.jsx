import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const OccupancyChart = ({ data }) => {
  const chartData = {
    labels: data?.map(d => d.name) || [],
    datasets: [
      {
        label: 'Total Capacity',
        data: data?.map(d => d.capacity) || [],
        backgroundColor: 'rgba(63, 63, 70, 0.4)',
        borderColor: '#52525b',
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: 'Occupied Beds',
        data: data?.map(d => d.occupied) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11 } }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#94a3b8' } }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export const RevenueChart = ({ data }) => {
  const chartData = {
    labels: data?.map(d => d.label) || [],
    datasets: [
      {
        fill: true,
        label: 'Fee Revenue',
        data: data?.map(d => d.amount) || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11 } }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#94a3b8' } }
    }
  };

  return <Line data={chartData} options={options} />;
};