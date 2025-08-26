import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Eye, Edit, Trash2 } from 'lucide-react';

const PlateTable = () => {
  const [plates, setPlates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newPlateValue, setNewPlateValue] = useState('');
  const [showPlate, setShowPlate] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedPlates, setSelectedPlates] = useState([]);

  const animatedButtonStyle = {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.1s ease-in-out, background 0.2s',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  };

  const iconButtonStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease, background 0.2s ease',
  };

  const fetchPlates = () => {
    axios.get('http://localhost:5000/api/plates')
      .then(res => setPlates(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPlates();
    const interval = setInterval(() => fetchPlates(), 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleSortOrder = () => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));

  const sortedPlates = [...plates].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const startEditing = (plate) => { setEditingId(plate.id); setNewPlateValue(plate.plate); };
  const cancelEditing = () => { setEditingId(null); setNewPlateValue(''); };
  const saveEdit = async (plate) => {
    try {
      await axios.put(`http://localhost:5000/api/plates/${plate.id}`, { plate: newPlateValue });
      setPlates(prev => prev.map(p => p.id === plate.id ? { ...p, plate: newPlateValue } : p));
      cancelEditing();
    } catch (error) { console.error('Update failed:', error); alert('Failed to update plate'); }
  };

  const handleDelete = async (plate) => {
    try {
      await axios.delete(`http://localhost:5000/api/plates/${plate.id}`);
      setPlates(prev => prev.filter(p => p.id !== plate.id));
      setSelectedPlates(prev => prev.filter(id => id !== plate.id));
    } catch (error) { console.error('Delete failed:', error); alert('Failed to delete plate'); }
  };

  const handleShow = (plate) => setShowPlate(plate);
  const closeShowCard = () => setShowPlate(null);

  const handleSelectPlate = (id) => setSelectedPlates(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  const handleSelectAll = () => setSelectedPlates(selectedPlates.length === plates.length ? [] : plates.map(p => p.id));

  const handleBulkDelete = async () => {
    if (selectedPlates.length === 0) return;
    try {
      await axios.post('http://localhost:5000/api/delete-multiple', { ids: selectedPlates });
      setPlates(prev => prev.filter(p => !selectedPlates.includes(p.id)));
      setSelectedPlates([]);
    } catch (err) { console.error('Bulk delete failed:', err); alert('Failed to delete selected plates'); }
  };

  const handleSendEmail = async () => {
    if (selectedPlates.length === 0) return;
    try {
      const response = await axios.post('http://localhost:5000/api/sendemail', { ids: selectedPlates });
      alert(response.data.message || 'Email sent successfully!');
    } catch (err) { console.error('Email sending failed:', err); alert('Failed to send email'); }
  };

  const sortIcons = { asc: '▲', desc: '▼' };

  return (
    <div style={{ padding: '20px', fontFamily: "Segoe UI, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Title */}
      <div style={{ marginBottom: '15px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', margin: 0, fontWeight: '600', color: '#333' }}>🚗 Detected License Plates</h2>
        <p style={{ color: '#666', margin: '3px 0 0', fontSize: '14px' }}>Real-time monitoring system</p>
      </div>

      {/* Bulk actions */}
      {selectedPlates.length > 0 && (
        <div style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
          <button onClick={handleBulkDelete} style={{ ...animatedButtonStyle, background: '#dc3545', color: 'white' }}>🗑 Delete Selected ({selectedPlates.length})</button>
          <button onClick={handleSendEmail} style={{ ...animatedButtonStyle, background: '#007bff', color: 'white' }}>✉️ Send Email</button>
        </div>
      )}

      {/* Table wrapper to center */}
      <div style={{ maxWidth: '1300px', width: '100%', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 3px 10px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px' }}>
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '8px', textAlign: 'left' }}>
                <input type="checkbox" checked={selectedPlates.length === plates.length} onChange={handleSelectAll} /> ID
              </th>
              <th onClick={toggleSortOrder} style={{ padding: '8px', cursor: 'pointer', userSelect: 'none' }}>
                Date & Time {sortIcons[sortOrder]}
              </th>
              <th style={{ padding: '8px' }}>Plate</th>
              <th style={{ padding: '8px' }}>Plate Image</th>
              <th style={{ padding: '8px' }}>Original Image</th>
              <th style={{ padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlates.map((plate, i) => {
              const isSelected = selectedPlates.includes(plate.id);
              return (
                <tr key={plate.id} style={{
                  backgroundColor: isSelected ? '#d0ebff' : i % 2 === 0 ? '#fff' : '#fdfdfd',
                  borderTop: '1px solid #eee',
                  transition: 'all 0.3s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}>
                  <td style={{ padding: '8px' }}>
                    <input type="checkbox" checked={isSelected} onChange={() => handleSelectPlate(plate.id)} /> {plate.id}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                      <span style={{ fontWeight: '600', color: '#333' }}>{plate.date}</span>
                      <span style={{ fontSize: '13px', color: '#888' }}>{plate.time}</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    {editingId === plate.id ? (
                      <input type="text" value={newPlateValue} onChange={(e) => setNewPlateValue(e.target.value)} style={{ width: '100px' }} />
                    ) : <span style={{ fontWeight: '500' }}>{plate.plate}</span>}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <img src={`http://localhost:5000/plates/${plate.plate_image}`} alt="plate" width="100" style={{ borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <img src={`http://localhost:5000/original_images/${plate.original_image}`} alt="original" width="100" style={{ borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  </td>
                  <td style={{ padding: '8px', display: 'flex', gap: '8px' }}>
                    {editingId === plate.id ? (
                      <>
                        <button style={{ ...animatedButtonStyle, background: '#28a745', color: 'white' }} onClick={() => saveEdit(plate)}>Save</button>
                        <button style={{ ...animatedButtonStyle, background: '#6c757d', color: 'white' }} onClick={cancelEditing}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button style={iconButtonStyle} onClick={() => handleShow(plate)} title="Show"><Eye size={20} color="#17a2b8" /></button>
                        <button style={iconButtonStyle} onClick={() => startEditing(plate)} title="Edit"><Edit size={20} color="#ffc107" /></button>
                        <button style={iconButtonStyle} onClick={() => handleDelete(plate)} title="Delete"><Trash2 size={20} color="#dc3545" /></button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showPlate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            maxWidth: '600px', width: '100%', padding: '20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center'
          }}>
            <h3>Plate Details (ID: {showPlate.id})</h3>
            <p><b>Date:</b> {showPlate.date} <br /><b>Time:</b> {showPlate.time}</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', margin: '20px 0' }}>
              <div>
                <h4>Original Image</h4>
                <img src={`http://localhost:5000/original_images/${showPlate.original_image}`} alt="original" width="200" style={{ borderRadius: '8px' }} />
              </div>
              <div>
                <h4>Plate Image</h4>
                <img src={`http://localhost:5000/plates/${showPlate.plate_image}`} alt="plate" width="200" style={{ borderRadius: '8px' }} />
              </div>
            </div>
            <button onClick={closeShowCard} style={{ ...animatedButtonStyle, background: '#007bff', color: 'white', marginTop: '10px' }}>Close</button>
          </div>
        </div>
      )}

      {/* Hover animation */}
      <style>{`
        .animated-button:active { transform: scale(0.95); }
      `}</style>
    </div>
  );
};

export default PlateTable;
