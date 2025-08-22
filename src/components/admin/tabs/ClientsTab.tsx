import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Mail, Building2, Calendar, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { Client } from '../../../lib/supabase';
import bcrypt from 'bcryptjs';

export function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading clients:', error);
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    setFormError('');
    setFormSuccess('');

    // Validation
    if (!formData.name || !formData.email || !formData.company || !formData.password) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    try {
      // Check if email already exists
      const { data: existingAuth } = await supabase
        .from('auth_credentials')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingAuth) {
        setFormError('Email already exists');
        return;
      }

      // Create client record
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          email: formData.email,
          company: formData.company
        })
        .select()
        .single();

      if (clientError || !newClient) {
        console.error('Error creating client:', clientError);
        setFormError('Error creating client. Please try again.');
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(formData.password, 10);

      // Create auth credentials
      const { error: authError } = await supabase
        .from('auth_credentials')
        .insert({
          email: formData.email,
          password_hash: passwordHash,
          user_type: 'client',
          user_id: newClient.id
        });

      if (authError) {
        console.error('Error creating auth credentials:', authError);
        // Clean up client record if auth creation fails
        await supabase.from('clients').delete().eq('id', newClient.id);
        setFormError('Error creating client credentials. Please try again.');
        return;
      }

      setFormSuccess('Client created successfully!');
      setFormData({ name: '', email: '', company: '', password: '' });
      setShowCreateForm(false);
      await loadClients();

    } catch (error) {
      console.error('Error creating client:', error);
      setFormError('Error creating client. Please try again.');
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client.id);
    setFormData({
      name: client.name,
      email: client.email,
      company: client.company,
      password: ''
    });
    setFormError('');
    setFormSuccess('');
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    setFormError('');
    setFormSuccess('');

    // Validation
    if (!formData.name || !formData.email || !formData.company) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      // Update client record
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          email: formData.email,
          company: formData.company
        })
        .eq('id', editingClient);

      if (clientError) {
        console.error('Error updating client:', clientError);
        setFormError('Error updating client. Please try again.');
        return;
      }

      // Update auth credentials email if changed
      const { error: authError } = await supabase
        .from('auth_credentials')
        .update({ email: formData.email })
        .eq('user_id', editingClient)
        .eq('user_type', 'client');

      if (authError) {
        console.error('Error updating auth credentials:', authError);
        setFormError('Error updating client credentials. Please try again.');
        return;
      }

      // Update password if provided
      if (formData.password && formData.password.length >= 6) {
        const passwordHash = await bcrypt.hash(formData.password, 10);
        const { error: passwordError } = await supabase
          .from('auth_credentials')
          .update({ password_hash: passwordHash })
          .eq('user_id', editingClient)
          .eq('user_type', 'client');

        if (passwordError) {
          console.error('Error updating password:', passwordError);
          setFormError('Error updating password. Please try again.');
          return;
        }
      }

      setFormSuccess('Client updated successfully!');
      setEditingClient(null);
      setFormData({ name: '', email: '', company: '', password: '' });
      await loadClients();

    } catch (error) {
      console.error('Error updating client:', error);
      setFormError('Error updating client. Please try again.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all their applications and related data.')) {
      return;
    }

    try {
      // Delete auth credentials first
      const { error: authError } = await supabase
        .from('auth_credentials')
        .delete()
        .eq('user_id', clientId)
        .eq('user_type', 'client');

      if (authError) {
        console.error('Error deleting auth credentials:', authError);
        alert('Error deleting client credentials. Please try again.');
        return;
      }

      // Delete client (applications will be deleted via cascade)
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (clientError) {
        console.error('Error deleting client:', clientError);
        alert('Error deleting client. Please try again.');
        return;
      }

      await loadClients();
      alert('Client deleted successfully');

    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error deleting client. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
    setShowCreateForm(false);
    setFormData({ name: '', email: '', company: '', password: '' });
    setFormError('');
    setFormSuccess('');
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Client Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Client</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {formSuccess && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{formSuccess}</span>
        </div>
      )}

      {formError && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{formError}</span>
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingClient) && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingClient ? 'Edit Client' : 'Create New Client'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter client's full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editingClient ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={editingClient ? "Enter new password (optional)" : "Enter password"}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={editingClient ? handleUpdateClient : handleCreateClient}
              disabled={!formData.name || !formData.email || !formData.company || (!editingClient && !formData.password)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
            >
              <Save className="h-4 w-4" />
              <span>{editingClient ? 'Update Client' : 'Create Client'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
        />
      </div>

      {/* Clients Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-600">Total Clients</p>
              <p className="text-2xl font-semibold text-blue-900">{clients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-600">Active Companies</p>
              <p className="text-2xl font-semibold text-green-900">
                {new Set(clients.map(c => c.company)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-600">New This Month</p>
              <p className="text-2xl font-semibold text-purple-900">
                {clients.filter(c => {
                  const created = new Date(c.created_at);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading clients...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">
                            {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">ID: {client.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{client.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{client.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClient(client)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredClients.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first client to get started.'}
          </p>
        </div>
      )}
    </div>
  );
}