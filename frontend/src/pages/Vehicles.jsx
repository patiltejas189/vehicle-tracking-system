import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaTrash, FaTimes, FaCar, FaUser, FaSpinner, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const Vehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('vehicle_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formData, setFormData] = useState({
    vehicle_id: '',
    license_plate: '',
    make: '',
    model: '',
    year: '',
    status: 'active',
    assigned_driver_id: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    let filtered = [...vehicles];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.vehicle_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'year') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await axios.put(`http://localhost:5000/api/vehicles/${editingVehicle.id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/vehicles', formData);
      }
      setFormData({
        vehicle_id: '',
        license_plate: '',
        make: '',
        model: '',
        year: '',
        status: 'active',
        assigned_driver_id: ''
      });
      setShowForm(false);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_id: vehicle.vehicle_id,
      license_plate: vehicle.license_plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status || 'active',
      assigned_driver_id: vehicle.assigned_driver_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await axios.delete(`http://localhost:5000/api/vehicles/${id}`);
        fetchVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
      }
    }
  };

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    const csvContent = [
      ['Vehicle ID', 'License Plate', 'Make', 'Model', 'Year', 'Status', 'Driver', 'Last Updated'],
      ...filteredVehicles.map(vehicle => [
        vehicle.vehicle_id,
        vehicle.license_plate,
        vehicle.make || '',
        vehicle.model || '',
        vehicle.year || '',
        vehicle.status,
        vehicle.driver_name || 'Unassigned',
        vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleString() : 'Never'
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="w-3 h-3 text-secondary-400" />;
    return sortOrder === 'asc' ? 
      <FaSortUp className="w-3 h-3 text-primary-600" /> : 
      <FaSortDown className="w-3 h-3 text-primary-600" />;
  };

  const canManageVehicles = ['admin', 'fleet_manager'].includes(user?.role);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-secondary-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Vehicles</h1>
          <p className="text-secondary-600 mt-1">Manage your fleet vehicles</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105"
          >
            <FaDownload className="mr-2" />
            Export CSV
          </button>
          {canManageVehicles && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105"
            >
              {showForm ? <FaTimes className="mr-2" /> : <FaPlus className="mr-2" />}
              {showForm ? 'Cancel' : 'Add Vehicle'}
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-2xl shadow-soft p-6 border border-secondary-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">
              <FaSearch className="inline mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">
              <FaFilter className="inline mr-1" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            >
              <option value="vehicle_id">Vehicle ID</option>
              <option value="license_plate">License Plate</option>
              <option value="make">Make</option>
              <option value="year">Year</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-secondary-600">
            Showing <span className="font-semibold">{filteredVehicles.length}</span> of <span className="font-semibold">{vehicles.length}</span> vehicles
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-secondary-100 animate-slide-in">
          <h2 className="text-xl font-semibold mb-6 text-secondary-900">
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">Vehicle ID</label>
              <input
                type="text"
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">License Plate</label>
              <input
                type="text"
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">Make</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-secondary-700 mb-2">Assigned Driver ID (optional)</label>
              <input
                type="number"
                value={formData.assigned_driver_id}
                onChange={(e) => setFormData({ ...formData, assigned_driver_id: e.target.value })}
                className="w-full border border-secondary-300 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                placeholder="Leave empty for unassigned"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105"
              >
                {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-secondary-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors duration-200"
                  onClick={() => handleSort('vehicle_id')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Vehicle ID</span>
                    {getSortIcon('vehicle_id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors duration-200"
                  onClick={() => handleSort('license_plate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>License Plate</span>
                    {getSortIcon('license_plate')}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Make/Model
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors duration-200"
                  onClick={() => handleSort('year')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Year</span>
                    {getSortIcon('year')}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Driver
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider cursor-pointer hover:bg-secondary-100 transition-colors duration-200"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-secondary-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-3">
                        <FaCar className="text-white text-sm" />
                      </div>
                      <div className="text-sm font-medium text-secondary-900">{vehicle.vehicle_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {vehicle.license_plate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {vehicle.make} {vehicle.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {vehicle.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaUser className="text-secondary-400 mr-2" />
                      <span className="text-sm text-secondary-500">{vehicle.driver_name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vehicle.status === 'active' ? 'bg-success-100 text-success-800' :
                      vehicle.status === 'inactive' ? 'bg-secondary-100 text-secondary-800' :
                      'bg-warning-100 text-warning-800'
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(vehicle)}
                        className="text-primary-600 hover:text-primary-900 p-2 rounded-lg hover:bg-primary-50 transition-all duration-200"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {canManageVehicles && (
                        <>
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="text-warning-600 hover:text-warning-900 p-2 rounded-lg hover:bg-warning-50 transition-all duration-200"
                            title="Edit Vehicle"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            className="text-danger-600 hover:text-danger-900 p-2 rounded-lg hover:bg-danger-50 transition-all duration-200"
                            title="Delete Vehicle"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Details Modal */}
      {showDetailsModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative bg-white rounded-2xl shadow-large w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-secondary-900 flex items-center">
                  <FaCar className="mr-2 text-primary-600" />
                  Vehicle Details: {selectedVehicle.vehicle_id}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-secondary-400 hover:text-secondary-600 p-2 rounded-lg hover:bg-secondary-100 transition-all duration-200"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-secondary-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
                    Basic Information
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-secondary-100">
                      <span className="font-medium text-secondary-600">License Plate:</span>
                      <span className="text-secondary-900">{selectedVehicle.license_plate}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-secondary-100">
                      <span className="font-medium text-secondary-600">Make:</span>
                      <span className="text-secondary-900">{selectedVehicle.make}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-secondary-100">
                      <span className="font-medium text-secondary-600">Model:</span>
                      <span className="text-secondary-900">{selectedVehicle.model}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-secondary-100">
                      <span className="font-medium text-secondary-600">Year:</span>
                      <span className="text-secondary-900">{selectedVehicle.year}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-secondary-100">
                      <span className="font-medium text-secondary-600">Status:</span>
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                        selectedVehicle.status === 'active' ? 'bg-success-100 text-success-800' :
                        selectedVehicle.status === 'inactive' ? 'bg-secondary-100 text-secondary-800' :
                        'bg-warning-100 text-warning-800'
                      }`}>
                        {selectedVehicle.status}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-medium text-secondary-600">Driver:</span>
                      <span className="text-secondary-900">{selectedVehicle.driver_name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-secondary-800 mb-4 flex items-center">
                    <div className="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
                    Performance Metrics
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-secondary-100">
                      <span className="font-medium text-secondary-600">Total Distance:</span>
                      <span className="text-secondary-900">{selectedVehicle.total_distance || 'N/A'} km</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-secondary-100">
                      <span className="font-medium text-secondary-600">Fuel Efficiency:</span>
                      <span className="text-secondary-900">{selectedVehicle.fuel_efficiency || 'N/A'} km/L</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-secondary-100">
                      <span className="font-medium text-secondary-600">Last Service:</span>
                      <span className="text-secondary-900">{selectedVehicle.last_service ? new Date(selectedVehicle.last_service).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-medium text-secondary-600">Next Service Due:</span>
                      <span className="text-secondary-900">{selectedVehicle.next_service ? new Date(selectedVehicle.next_service).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-semibold text-secondary-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-warning-500 rounded-full mr-2"></div>
                  Recent Activity
                </h4>
                <div className="bg-secondary-50 p-6 rounded-xl border border-secondary-200">
                  <p className="text-sm text-secondary-600 mb-2">Activity tracking and history will be displayed here.</p>
                  <p className="text-xs text-secondary-500">Last updated: {selectedVehicle.updated_at ? new Date(selectedVehicle.updated_at).toLocaleString() : 'Never'}</p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-secondary-200 px-6 py-4 rounded-b-2xl">
              <div className="flex justify-end space-x-3">
                {canManageVehicles && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEdit(selectedVehicle);
                    }}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-medium hover:shadow-large hover:scale-105"
                  >
                    Edit Vehicle
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;