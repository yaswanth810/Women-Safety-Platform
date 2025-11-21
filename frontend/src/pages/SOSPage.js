import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, MapPin, Users, Clock } from 'lucide-react';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const SOSPage = ({ user, onLogout }) => {
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    getCurrentLocation();
    fetchActiveAlerts();
    fetchContacts();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          toast.error('Unable to get location. Please enable location services.');
          // Default to a location for demo
          setLocation({ latitude: 40.7128, longitude: -74.0060 });
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
      setLocation({ latitude: 40.7128, longitude: -74.0060 });
    }
  };

  const fetchActiveAlerts = async () => {
    try {
      const response = await axios.get(`${API}/sos`);
      setActiveAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API}/users/emergency-contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const triggerSOS = async () => {
    if (!location) {
      toast.error('Location not available');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/sos`, {
        latitude: location.latitude,
        longitude: location.longitude,
        notes
      });

      toast.success(`SOS Alert triggered! ${response.data.contacts_notified} contacts notified.`);
      setNotes('');
      fetchActiveAlerts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to trigger SOS');
    } finally {
      setLoading(false);
    }
  };

  const deactivateAlert = async (alertId) => {
    try {
      await axios.post(`${API}/sos/${alertId}/deactivate`);
      toast.success('Alert deactivated');
      fetchActiveAlerts();
    } catch (error) {
      toast.error('Failed to deactivate alert');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8" data-testid="sos-page">
        {/* Emergency SOS Header */}
        <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Emergency SOS
              </h1>
              <p className="text-gray-600">Instant alert to your emergency contacts</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SOS Trigger Card */}
          <div className="space-y-6">
            <Card className="border-red-200 shadow-lg">
              <CardHeader>
                <CardTitle>Trigger Emergency Alert</CardTitle>
                <CardDescription>
                  Your current location will be shared with {contacts.length} emergency contacts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>
                      Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Notes (Optional)</label>
                  <Textarea
                    placeholder="Describe the situation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    data-testid="sos-notes-input"
                  />
                </div>

                <Button
                  onClick={triggerSOS}
                  disabled={loading || !location}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg"
                  data-testid="trigger-sos-button"
                >
                  {loading ? 'Sending Alert...' : 'Trigger SOS Alert'}
                </Button>

                <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                  <Users className="w-4 h-4" />
                  <span>{contacts.length} contacts will be notified</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-900">Active Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="bg-white p-4 rounded-lg border border-amber-200" data-testid="active-alert-item">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-gray-600">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deactivateAlert(alert.id)}
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                          data-testid="deactivate-alert-button"
                        >
                          Deactivate
                        </Button>
                      </div>
                      {alert.notes && <p className="text-sm text-gray-700">{alert.notes}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map */}
          <Card className="border-gray-200 overflow-hidden shadow-lg">
            <CardHeader>
              <CardTitle>Your Location</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px]">
                {location ? (
                  <MapContainer
                    center={[location.latitude, location.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[location.latitude, location.longitude]}>
                      <Popup>Your current location</Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Getting your location...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SOSPage;