import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Inventory,
  QrCode,
  Download as DownloadIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
const XLSX = require('xlsx');

interface AnalyticsData {
  overview: {
    totalLeads: number;
    totalCustomers: number;
    totalProducts: number;
    totalScans: number;
    conversionRate: number;
    activeCustomers: number;
  };
  leadMetrics: {
    conversionsBySource: Array<{ name: string; value: number }>;
    conversionTrend: Array<{ date: string; leads: number; conversions: number }>;
  };
  productMetrics: {
    scansByProduct: Array<{ name: string; scans: number }>;
    scanLocations: Array<{ location: string; count: number }>;
    scanTrend: Array<{ date: string; scans: number }>;
  };
  customerMetrics: {
    customersBySegment: Array<{ segment: string; count: number }>;
    activityTrend: Array<{ date: string; activities: number }>;
    retentionRate: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const timeRanges = ['7D', '30D', '90D', 'YTD', 'ALL'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30D');
  const [activeTab, setActiveTab] = useState(0);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/analytics?timeRange=${timeRange}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  const handleExportData = () => {
    if (!analytics) return;

    const workbook = XLSX.utils.book_new();

    // Overview Sheet
    const overviewData = [
      {
        Metric: 'Total Leads',
        Value: analytics.overview.totalLeads,
      },
      {
        Metric: 'Total Customers',
        Value: analytics.overview.totalCustomers,
      },
      {
        Metric: 'Conversion Rate',
        Value: `${analytics.overview.conversionRate}%`,
      },
      // ... add more metrics
    ];
    const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

    // Lead Metrics Sheet
    const leadSheet = XLSX.utils.json_to_sheet(analytics.leadMetrics.conversionTrend);
    XLSX.utils.book_append_sheet(workbook, leadSheet, 'Lead Metrics');

    // Product Metrics Sheet
    const productSheet = XLSX.utils.json_to_sheet(analytics.productMetrics.scansByProduct);
    XLSX.utils.book_append_sheet(workbook, productSheet, 'Product Metrics');

    // Customer Metrics Sheet
    const customerSheet = XLSX.utils.json_to_sheet(analytics.customerMetrics.customersBySegment);
    XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customer Metrics');

    // Save the file
    XLSX.writeFile(workbook, `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading || !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false}>
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Analytics Dashboard</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ButtonGroup variant="outlined" size="small">
              {timeRanges.map((range) => (
                <Button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  variant={timeRange === range ? 'contained' : 'outlined'}
                >
                  {range}
                </Button>
              ))}
            </ButtonGroup>
            <Tooltip title="Export Data">
              <IconButton onClick={handleExportData}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <People sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Leads</Typography>
                </Box>
                <Typography variant="h4">{analytics.overview.totalLeads}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Conversion Rate: {analytics.overview.conversionRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Customers</Typography>
                </Box>
                <Typography variant="h4">{analytics.overview.activeCustomers}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Retention Rate: {analytics.customerMetrics.retentionRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Inventory sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Products</Typography>
                </Box>
                <Typography variant="h4">{analytics.overview.totalProducts}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <QrCode sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Scans</Typography>
                </Box>
                <Typography variant="h4">{analytics.overview.totalScans}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for different metrics */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Lead Analytics" />
            <Tab label="Product Analytics" />
            <Tab label="Customer Analytics" />
          </Tabs>
        </Box>

        {/* Lead Analytics */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Lead Conversion Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.leadMetrics.conversionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="#8884d8" name="Leads" />
                    <Line type="monotone" dataKey="conversions" stroke="#82ca9d" name="Conversions" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Conversions by Source
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.leadMetrics.conversionsBySource}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {analytics.leadMetrics.conversionsBySource.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Product Analytics */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Product Scan Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.productMetrics.scanTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="scans" stroke="#8884d8" name="Scans" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Scanned Products
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.productMetrics.scansByProduct}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="scans" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Customer Analytics */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Customer Activity Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.customerMetrics.activityTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="activities" stroke="#8884d8" name="Activities" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Customer Segments
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.customerMetrics.customersBySegment}
                      dataKey="count"
                      nameKey="segment"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {analytics.customerMetrics.customersBySegment.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
} 