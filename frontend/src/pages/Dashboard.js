import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { AlertTriangle, FileText, MessageSquare, BookOpen, Shield, TrendingUp } from 'lucide-react';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myIncidents: 0,
    activeSOS: 0,
    emergencyContacts: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [incidents, sosAlerts, contacts] = await Promise.all([
        axios.get(`${API}/incidents`),
        axios.get(`${API}/sos`),
        axios.get(`${API}/users/emergency-contacts`)
      ]);

      setStats({
        myIncidents: incidents.data.length,
        activeSOS: sosAlerts.data.length,
        emergencyContacts: contacts.data.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const quickActions = [
    {
      title: 'Emergency SOS',
      description: 'Trigger emergency alert',
      icon: AlertTriangle,
      action: () => navigate('/sos'),
      color: 'from-red-500 to-rose-600',
      testId: 'quick-action-sos'
    },
    {
      title: 'Report Incident',
      description: 'File a new incident report',
      icon: FileText,
      action: () => navigate('/report'),
      color: 'from-rose-500 to-pink-600',
      testId: 'quick-action-report'
    },
    {
      title: 'Community Forum',
      description: 'Connect with others',
      icon: MessageSquare,
      action: () => navigate('/forum'),
      color: 'from-pink-500 to-purple-600',
      testId: 'quick-action-forum'
    },
    {
      title: 'Legal Resources',
      description: 'Access legal information',
      icon: BookOpen,
      action: () => navigate('/legal'),
      color: 'from-purple-500 to-indigo-600',
      testId: 'quick-action-legal'
    }
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-8" data-testid="dashboard-page">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-8 border border-rose-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-600">You're safe with us</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-hover border-rose-100">
            <CardHeader className="pb-3">
              <CardDescription>My Incidents</CardDescription>
              <CardTitle className="text-3xl font-bold text-rose-600" data-testid="stat-incidents">
                {stats.myIncidents}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>Total reports filed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-pink-100">
            <CardHeader className="pb-3">
              <CardDescription>Active SOS</CardDescription>
              <CardTitle className="text-3xl font-bold text-pink-600" data-testid="stat-sos">
                {stats.activeSOS}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Active alerts</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-purple-100">
            <CardHeader className="pb-3">
              <CardDescription>Emergency Contacts</CardDescription>
              <CardTitle className="text-3xl font-bold text-purple-600" data-testid="stat-contacts">
                {stats.emergencyContacts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>Contacts added</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="card-hover cursor-pointer border-gray-200 overflow-hidden"
                onClick={action.action}
                data-testid={action.testId}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-md`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Safety Tip */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-amber-900">Safety Tip of the Day</CardTitle>
                <CardDescription className="text-amber-700">
                  Always share your location with trusted contacts when traveling alone. Enable location sharing in your profile settings.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;