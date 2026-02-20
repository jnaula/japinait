import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, XCircle, Eye, Mail, Phone, MapPin, Calendar, User, 
  Building2, Users, LayoutDashboard, Trash2, Edit
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export default function AdminPanel() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Stats
  const [stats, setStats] = useState({
    users: 0,
    venues: 0,
    events: 0,
    pendingVenues: 0
  });

  // Data Lists
  const [venues, setVenues] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [pendingVenuesList, setPendingVenuesList] = useState([]);

  useEffect(() => {
    if (user) {
      checkAdminAndFetchData();
    }
  }, [user]);

  const checkAdminAndFetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      if (data.role !== 'venue_admin') {
        window.location.href = '/home';
        return;
      }

      await Promise.all([
        fetchStats(),
        fetchVenues(),
        fetchUsers()
      ]);
    } catch (err) {
      console.error('AdminPanel: Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: venuesCount } = await supabase.from('venues').select('*', { count: 'exact', head: true });
    const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
    const { count: pendingCount } = await supabase.from('venues').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    setStats({
      users: usersCount || 0,
      venues: venuesCount || 0,
      events: eventsCount || 0,
      pendingVenues: pendingCount || 0
    });
  };

  const fetchVenues = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false });
    
    setVenues(data || []);
    setPendingVenuesList(data?.filter(v => v.status === 'pending') || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsersList(data || []);
  };

  const handleVenueStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('venues')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh data
      fetchVenues();
      fetchStats();
    } catch (err) {
      console.error('Error updating venue:', err);
      alert('Error al actualizar el estado del local');
    }
  };

  const handleDeleteVenue = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este local?')) return;

    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      fetchVenues();
      fetchStats();
    } catch (err) {
      console.error('Error deleting venue:', err);
      alert('Error al eliminar el local');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || profile.role !== 'venue_admin') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Panel de Super Admin</h1>
            <p className="text-gray-400">Gestión general de la plataforma</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <User className="w-4 h-4" />
            <span>{profile.email}</span>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="venues">Locales</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard 
                title="Total Usuarios" 
                value={stats.users} 
                icon={<Users className="w-6 h-6 text-blue-500" />} 
              />
              <StatsCard 
                title="Total Locales" 
                value={stats.venues} 
                icon={<Building2 className="w-6 h-6 text-purple-500" />} 
              />
              <StatsCard 
                title="Total Eventos" 
                value={stats.events} 
                icon={<Calendar className="w-6 h-6 text-green-500" />} 
              />
              <StatsCard 
                title="Pendientes" 
                value={stats.pendingVenues} 
                icon={<AlertIcon count={stats.pendingVenues} />} 
              />
            </div>

            {pendingVenuesList.length > 0 && (
              <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="text-white">Locales Pendientes de Aprobación</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                        <TableHead className="text-gray-400">Nombre</TableHead>
                        <TableHead className="text-gray-400">Propietario</TableHead>
                        <TableHead className="text-gray-400">Fecha Registro</TableHead>
                        <TableHead className="text-gray-400">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingVenuesList.map((venue) => (
                        <TableRow key={venue.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                          <TableCell className="font-medium text-white">{venue.name}</TableCell>
                          <TableCell className="text-gray-300">{venue.profiles?.email}</TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(venue.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleVenueStatus(venue.id, 'approved')}
                              >
                                Aprobar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleVenueStatus(venue.id, 'rejected')}
                              >
                                Rechazar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="venues">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-white">Todos los Locales</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                      <TableHead className="text-gray-400">Nombre</TableHead>
                      <TableHead className="text-gray-400">Estado</TableHead>
                      <TableHead className="text-gray-400">Propietario</TableHead>
                      <TableHead className="text-gray-400">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venues.map((venue) => (
                      <TableRow key={venue.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                        <TableCell className="font-medium text-white">{venue.name}</TableCell>
                        <TableCell>
                          <StatusBadge status={venue.status} />
                        </TableCell>
                        <TableCell className="text-gray-300">{venue.profiles?.email}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {venue.status === 'pending' && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                onClick={() => handleVenueStatus(venue.id, 'approved')}
                                title="Aprobar"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteVenue(venue.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-white">Usuarios Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Nombre</TableHead>
                      <TableHead className="text-gray-400">Rol</TableHead>
                      <TableHead className="text-gray-400">Fecha Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersList.map((u) => (
                      <TableRow key={u.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                        <TableCell className="text-white">{u.email}</TableCell>
                        <TableCell className="text-gray-300">{u.full_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#2a2a2a] text-gray-300">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon }) {
  return (
    <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
          </div>
          <div className="p-3 bg-[#1a1a1a] rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const styles = {
    approved: 'bg-green-500/10 text-green-500 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20'
  };
  
  const labels = {
    approved: 'Aprobado',
    pending: 'Pendiente',
    rejected: 'Rechazado'
  };

  return (
    <Badge variant="outline" className={styles[status] || styles.pending}>
      {labels[status] || status}
    </Badge>
  );
}

function AlertIcon({ count }) {
  return (
    <div className="relative">
      <Eye className="w-6 h-6 text-yellow-500" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}
