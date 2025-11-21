import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { FileText, Upload, MapPin, Eye } from 'lucide-react';
import { Badge } from '../components/ui/badge';

const IncidentReportPage = ({ user, onLogout }) => {
  const [formData, setFormData] = useState({
    incident_type: '',
    description: '',
    location: '',
    latitude: null,
    longitude: null,
    is_anonymous: false
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myIncidents, setMyIncidents] = useState([]);
  const [viewingIncidents, setViewingIncidents] = useState(false);

  useEffect(() => {
    fetchMyIncidents();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        () => {}
      );
    }
  };

  const fetchMyIncidents = async () => {
    try {
      const response = await axios.get(`${API}/incidents`);
      setMyIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.incident_type) {
      toast.error('Please select an incident type');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/incidents`, formData);
      const incidentId = response.data.incident_id;

      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          await axios.post(`${API}/incidents/${incidentId}/evidence`, fileFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      toast.success('Incident reported successfully');
      setFormData({
        incident_type: '',
        description: '',
        location: '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        is_anonymous: false
      });
      setFiles([]);
      fetchMyIncidents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const incidentTypes = [
    { value: 'harassment', label: 'Harassment' },
    { value: 'assault', label: 'Assault' },
    { value: 'stalking', label: 'Stalking' },
    { value: 'domestic_violence', label: 'Domestic Violence' },
    { value: 'workplace_harassment', label: 'Workplace Harassment' },
    { value: 'online_abuse', label: 'Online Abuse' },
    { value: 'other', label: 'Other' }
  ];

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

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8" data-testid="incident-report-page">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Incident Reporting
              </h1>
              <p className="text-gray-600">Report incidents safely and confidentially</p>
            </div>
          </div>
        </div>

        {/* Toggle View */}
        <div className="flex gap-4">
          <Button
            variant={!viewingIncidents ? 'default' : 'outline'}
            onClick={() => setViewingIncidents(false)}
            className={!viewingIncidents ? 'bg-gradient-to-r from-pink-500 to-rose-600' : ''}
            data-testid="new-report-tab"
          >
            New Report
          </Button>
          <Button
            variant={viewingIncidents ? 'default' : 'outline'}
            onClick={() => setViewingIncidents(true)}
            className={viewingIncidents ? 'bg-gradient-to-r from-pink-500 to-rose-600' : ''}
            data-testid="my-reports-tab"
          >
            My Reports ({myIncidents.length})
          </Button>
        </div>

        {!viewingIncidents ? (
          /* Report Form */
          <Card className="shadow-lg border-pink-100">
            <CardHeader>
              <CardTitle>File Incident Report</CardTitle>
              <CardDescription>All reports are handled with strict confidentiality</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Incident Type *</Label>
                  <Select
                    value={formData.incident_type}
                    onValueChange={(value) => setFormData({ ...formData, incident_type: value })}
                  >
                    <SelectTrigger data-testid="incident-type-select">
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed description of the incident..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    required
                    data-testid="incident-description-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      type="text"
                      placeholder="Street, City, State"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="pl-10"
                      required
                      data-testid="incident-location-input"
                    />
                  </div>
                  {formData.latitude && formData.longitude && (
                    <p className="text-xs text-gray-500">
                      GPS: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Evidence (Photos/Videos)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <Input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => setFiles(Array.from(e.target.files))}
                      className="max-w-xs mx-auto"
                      data-testid="evidence-upload-input"
                    />
                    {files.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">{files.length} file(s) selected</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                    data-testid="anonymous-checkbox"
                  />
                  <Label htmlFor="anonymous" className="cursor-pointer">
                    Submit anonymously (your identity will be hidden)
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 h-12 text-lg"
                  data-testid="submit-report-button"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* My Incidents */
          <div className="space-y-4">
            {myIncidents.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No incidents reported yet</p>
              </Card>
            ) : (
              myIncidents.map((incident) => (
                <Card key={incident.id} className="card-hover" data-testid="incident-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {incident.incident_type.replace('_', ' ').toUpperCase()}
                          </CardTitle>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <CardDescription>
                          {new Date(incident.created_at).toLocaleDateString()} • {incident.location}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{incident.description}</p>
                    {incident.evidence_files?.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Upload className="w-4 h-4" />
                        <span>{incident.evidence_files.length} evidence file(s) attached</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default IncidentReportPage;