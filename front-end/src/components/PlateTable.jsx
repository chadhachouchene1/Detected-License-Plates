import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PlateTable = () => {
  const [plates, setPlates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newPlateValue, setNewPlateValue] = useState('');
  const [showPlate, setShowPlate] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedPlates, setSelectedPlates] = useState([]);

  const fetchPlates = () => {
    axios.get('http://localhost:5000/api/plates')
      .then(res => setPlates(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPlates();
  }, []);

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const sortedPlates = [...plates].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const startEditing = (plate) => {
    setEditingId(plate.id);
    setNewPlateValue(plate.plate);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewPlateValue('');
  };

  const saveEdit = async (plate) => {
    try {
      await axios.put(`http://localhost:5000/api/plates/${plate.id}`, { plate: newPlateValue });
      setPlates(prev => prev.map(p => p.id === plate.id ? { ...p, plate: newPlateValue } : p));
      cancelEditing();
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update plate');
    }
  };

  const handleDelete = async (plate) => {
    try {
      await axios.delete(`http://localhost:5000/api/plates/${plate.id}`);
      setPlates(prev => prev.filter(p => p.id !== plate.id));
      setSelectedPlates(prev => prev.filter(id => id !== plate.id));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete plate');
    }
  };

  const handleShow = (plate) => {
    setShowPlate(plate);
  };

  const closeShowCard = () => {
    setShowPlate(null);
  };

  const handleSelectPlate = (id) => {
    setSelectedPlates(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlates.length === plates.length) {
      setSelectedPlates([]);
    } else {
      setSelectedPlates(plates.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPlates.length === 0) return;

    try {
      await axios.post('http://localhost:5000/api/delete-multiple', {
        ids: selectedPlates
      });

      setPlates(prev => prev.filter(p => !selectedPlates.includes(p.id)));
      setSelectedPlates([]);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Failed to delete selected plates');
    }
  };

  const sortIcons = { asc: '▲', desc: '▼' };

  return (
    <div style={{ padding: '20px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2>Detected License Plates</h2>

      {selectedPlates.length > 0 && (
        <button
          onClick={handleBulkDelete}
          style={{
            marginBottom: '10px',
            background: 'red',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          Delete Selected ({selectedPlates.length})
        </button>
      )}

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f0f0f0' }}>
          <tr>
            <th>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="checkbox"
                  checked={selectedPlates.length === plates.length}
                  onChange={handleSelectAll}
                />
                ID
              </label>
            </th>
            <th
              onClick={toggleSortOrder}
              style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Click to toggle sort by Date then Time"
            >
              Date
              <span style={{ fontSize: '18px', color: '#000' }}>
                {sortIcons[sortOrder]}
              </span>
            </th>
            <th>Time</th>
            <th>Plate</th>
            <th>Plate Image</th>
            <th>Original Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlates.map((plate) => (
            <tr
              key={plate.id}
              style={{
                backgroundColor: selectedPlates.includes(plate.id) ? '#e0f7fa' : 'white',
                verticalAlign: 'middle'
              }}
            >
              <td>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={selectedPlates.includes(plate.id)}
                    onChange={() => handleSelectPlate(plate.id)}
                  />
                  {plate.id}
                </label>
              </td>
              <td>{plate.date}</td>
              <td>{plate.time}</td>
              <td>
                {editingId === plate.id ? (
                  <input
                    type="text"
                    value={newPlateValue}
                    onChange={(e) => setNewPlateValue(e.target.value)}
                    style={{ width: '150px' }}
                  />
                ) : (
                  plate.plate
                )}
              </td>
              <td>
                <img
                  src={`http://localhost:5000/plates/${plate.plate_image}`}
                  alt="plate"
                  width="120"
                  style={{ borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                />
              </td>
              <td>
                <img
                  src={`http://localhost:5000/original_images/${plate.original_image}`}
                  alt="original"
                  width="120"
                  style={{ borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                />
              </td>
              <td>
                {editingId === plate.id ? (
                  <>
                    <button onClick={() => saveEdit(plate)}>Save</button>{' '}
                    <button onClick={cancelEditing}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleShow(plate)}>Show</button>{' '}
                    <button onClick={() => startEditing(plate)}>Edit</button>{' '}
                    <button onClick={() => handleDelete(plate)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showPlate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            maxWidth: '500px', width: '100%', padding: '20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)', position: 'relative',
            textAlign: 'center',
          }}>
            <h3 style={{ marginBottom: '20px' }}>Plate Details (ID: {showPlate.id})</h3>

            <div style={{ marginBottom: '15px' }}>
              <strong>Date:</strong> {showPlate.date} <br />
              <strong>Time:</strong> {showPlate.time}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
              <div>
                <h4>Original Image</h4>
                <img
                  src={`http://localhost:5000/original_images/${showPlate.original_image}`}
                  alt="Original"
                  style={{ maxWidth: '200px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}
                />
              </div>
              <div>
                <h4>Plate Image</h4>
                <img
                  src={`http://localhost:5000/plates/${showPlate.plate_image}`}
                  alt="Plate"
                  style={{ maxWidth: '200px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}
                />
              </div>
            </div>

            <button
              onClick={closeShowCard}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlateTable;
