import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { User, Phone, Mail, Shield, Users, Plus, Trash2, QrCode } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';

const ProfilePage = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', relationship: '' });
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '' });
  const [twoFASetup, setTwoFASetup] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [twoFADialogOpen, setTwoFADialogOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchEmergencyContacts();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/users/profile`);
      setProfile(response.data);
      setEditData({ name: response.data.name, phone: response.data.phone || '' });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const response = await axios.get(`${API}/users/emergency-contacts`);
      setEmergencyContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const updateProfile = async () => {
    try {
      await axios.put(`${API}/users/profile`, editData);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const addEmergencyContact = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/users/emergency-contacts`, newContact);
      toast.success('Emergency contact added');
      setNewContact({ name: '', phone: '', email: '', relationship: '' });
      setDialogOpen(false);
      fetchEmergencyContacts();
    } catch (error) {
      toast.error('Failed to add contact');
    }
  };

  const setup2FA = async () => {
    try {
      const response = await axios.post(`${API}/auth/2fa/setup`);
      setTwoFASetup(response.data);
      setTwoFADialogOpen(true);
    } catch (error) {
      toast.error('Failed to setup 2FA');
    }
  };

  const enable2FA = async () => {
    if (totpCode.length !== 6) {
      toast.error('Please enter 6-digit code');
      return;
    }

    try {
      await axios.post(`${API}/auth/2fa/enable`, null, {
        params: { totp_code: totpCode }
      });
      toast.success('2FA enabled successfully');
      setTwoFADialogOpen(false);
      setTotpCode('');
      fetchProfile();
    } catch (error) {
      toast.error('Invalid code. Please try again.');
    }
  };

  if (!profile) {
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
      <div className="space-y-8" data-testid="profile-page">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Profile Settings
              </h1>
              <p className="text-gray-600">Manage your account and security</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input
                      id="edit-name"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      data-testid="edit-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      data-testid="edit-phone-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={updateProfile} className="bg-gradient-to-r from-blue-500 to-indigo-600" data-testid="save-profile-button">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)} data-testid="cancel-edit-button">
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{profile.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{profile.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => setEditing(true)} variant="outline" className="w-full" data-testid="edit-profile-button">
                    Edit Profile
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Two-Factor Authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">2FA Status</p>
                    <p className="text-sm text-gray-600">
                      {profile.totp_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  {profile.totp_enabled ? (
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  ) : (
                    <Button
                      onClick={setup2FA}
                      className="bg-gradient-to-r from-green-500 to-emerald-600"
                      data-testid="setup-2fa-button"
                    >
                      Enable 2FA
                    </Button>
                  )}
                </div>
                {!profile.totp_enabled && (
                  <p className="text-sm text-gray-600">
                    Add an extra layer of security by enabling two-factor authentication using an authenticator app.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contacts */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Emergency Contacts
                </CardTitle>
                <CardDescription>People to notify in case of emergency</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-rose-500 to-pink-600" data-testid="add-contact-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Emergency Contact</DialogTitle>
                    <DialogDescription>This person will be notified during SOS alerts</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={addEmergencyContact} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name *</Label>
                      <Input
                        id="contact-name"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        required
                        data-testid="contact-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone *</Label>
                      <Input
                        id="contact-phone"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        required
                        data-testid="contact-phone-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        data-testid="contact-email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-relationship">Relationship *</Label>
                      <Input
                        id="contact-relationship"
                        value={newContact.relationship}
                        onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                        placeholder="e.g., Family, Friend, Colleague"
                        required
                        data-testid="contact-relationship-input"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-pink-600" data-testid="save-contact-button">
                      Save Contact
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {emergencyContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No emergency contacts added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencyContacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid="emergency-contact-item">
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                      <p className="text-xs text-gray-500">{contact.relationship}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2FA Setup Dialog */}
        <Dialog open={twoFADialogOpen} onOpenChange={setTwoFADialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
              <DialogDescription>Scan the QR code with your authenticator app</DialogDescription>
            </DialogHeader>
            {twoFASetup && (
              <div className="space-y-4">
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={twoFASetup.qr_code} alt="QR Code" className="w-48 h-48" data-testid="2fa-qr-code" />
                </div>
                <div className="space-y-2">
                  <Label>Enter the 6-digit code from your app</Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={totpCode} onChange={setTotpCode}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} data-testid="totp-slot-0" />
                        <InputOTPSlot index={1} data-testid="totp-slot-1" />
                        <InputOTPSlot index={2} data-testid="totp-slot-2" />
                        <InputOTPSlot index={3} data-testid="totp-slot-3" />
                        <InputOTPSlot index={4} data-testid="totp-slot-4" />
                        <InputOTPSlot index={5} data-testid="totp-slot-5" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button
                  onClick={enable2FA}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                  disabled={totpCode.length !== 6}
                  data-testid="verify-2fa-button"
                >
                  Verify and Enable
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProfilePage;