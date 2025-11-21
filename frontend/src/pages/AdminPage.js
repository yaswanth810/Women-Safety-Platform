import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { LayoutDashboard, FileText, AlertTriangle, TrendingUp, MapPin, Users } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AdminPage = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('stats'); // stats, incidents, map

  useEffect(() => {
    fetchStats();
    fetchIncidents();
    fetchHotspots();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/analytics/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await axios.get(`${API}/admin/incidents`);
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const fetchHotspots = async () => {
    try {
      const response = await axios.get(`${API}/admin/analytics/hotspots`);
      setHotspots(response.data.hotspots || []);
    } catch (error) {
      console.error('Error fetching hotspots:', error);
    }
  };

  const updateIncidentStatus = async (incidentId, newStatus) => {
    try {
      await axios.put(`${API}/admin/incidents/${incidentId}`, { status: newStatus });
      toast.success('Incident status updated');
      fetchIncidents();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update incident');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredIncidents = selectedStatus === 'all'
    ? incidents
    : incidents.filter(i => i.status === selectedStatus);

  if (!stats) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8" data-testid="admin-page">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Monitor and manage platform activities</p>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'stats' ? 'default' : 'outline'}
            onClick={() => setViewMode('stats')}
            className={viewMode === 'stats' ? 'bg-gradient-to-r from-indigo-500 to-blue-600' : ''}
            data-testid="view-stats-tab"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Statistics
          </Button>
          <Button
            variant={viewMode === 'incidents' ? 'default' : 'outline'}
            onClick={() => setViewMode('incidents')}
            className={viewMode === 'incidents' ? 'bg-gradient-to-r from-indigo-500 to-blue-600' : ''}
            data-testid="view-incidents-tab"
          >
            <FileText className="w-4 h-4 mr-2" />
            Incidents
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            className={viewMode === 'map' ? 'bg-gradient-to-r from-indigo-500 to-blue-600' : ''}
            data-testid="view-map-tab"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Hotspot Map
          </Button>
        </div>

        {/* Statistics View */}
        {viewMode === 'stats' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-hover border-blue-100">
                <CardHeader className="pb-3">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-3xl font-bold text-blue-600" data-testid="stat-total-users">
                    {stats.total_users}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Registered users</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover border-purple-100">
                <CardHeader className="pb-3">
                  <CardDescription>Total Incidents</CardDescription>
                  <CardTitle className="text-3xl font-bold text-purple-600" data-testid="stat-total-incidents">
                    {stats.total_incidents}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>Reports filed</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover border-red-100">
                <CardHeader className="pb-3">
                  <CardDescription>SOS Alerts</CardDescription>
                  <CardTitle className="text-3xl font-bold text-red-600" data-testid="stat-total-sos">
                    {stats.total_sos_alerts}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Emergency alerts</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover border-amber-100">
                <CardHeader className="pb-3">
                  <CardDescription>Active SOS</CardDescription>
                  <CardTitle className="text-3xl font-bold text-amber-600" data-testid="stat-active-sos">
                    {stats.active_sos_alerts}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Currently active</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Incidents by Status */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Incidents by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(stats.incidents_by_status || {}).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{count}</p>
                      <p className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Incidents View */}
        {viewMode === 'incidents' && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by status:</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48" data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Incidents List */}
            {filteredIncidents.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No incidents found</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((incident) => (
                  <Card key={incident.id} className="card-hover" data-testid="admin-incident-card">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">
                              {incident.incident_type.replace('_', ' ').toUpperCase()}
                            </CardTitle>
                            <Badge className={getStatusColor(incident.status)}>
                              {incident.status.replace('_', ' ')}
                            </Badge>
                            {incident.is_anonymous && (
                              <Badge variant="outline" className="border-gray-300">
                                Anonymous
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            ID: {incident.id} • {new Date(incident.created_at).toLocaleString()} • {incident.location}
                          </CardDescription>
                        </div>
                        <Select
                          value={incident.status}
                          onValueChange={(value) => updateIncidentStatus(incident.id, value)}
                        >
                          <SelectTrigger className="w-40" data-testid="incident-status-select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-3">{incident.description}</p>
                      {incident.evidence_files?.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Evidence: {incident.evidence_files.length} file(s) attached
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <Card className="shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle>Incident Hotspot Map</CardTitle>
              <CardDescription>
                {hotspots.length} incidents with location data
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                {hotspots.length > 0 ? (
                  <MapContainer
                    center={[hotspots[0].latitude, hotspots[0].longitude]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {hotspots.map((spot, index) => (
                      <Marker key={index} position={[spot.latitude, spot.longitude]}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{spot.incident_type.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-600">Location: {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600">No location data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminPage;