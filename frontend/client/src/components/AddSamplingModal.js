import React, { useState, useEffect } from 'react';

const AddSamplingModal = ({ isOpen, onClose, onSave, publishers, initialData = null }) => {
    const [formData, setFormData] = useState({
        publisherId: '',
        samplingBasedOn: 'Sub ID (Source)',
        subIdsType: 'All',
        subIds: '',
        samplingType: 'fixed', // Default (lowercase to match backend enum)
        samplingValue: '',
        goalName: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                subIds: initialData.subIds ? initialData.subIds.join(', ') : '',
                samplingType: initialData.samplingType || 'Fixed' // Fallback
            });
        } else {
            setFormData({
                publisherId: '',
                samplingBasedOn: 'Sub ID (Source)',
                subIdsType: 'All',
                subIds: '',
                samplingType: 'fixed',
                samplingValue: '',
                goalName: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!formData.publisherId || !formData.samplingValue || !formData.goalName) {
            alert('Please fill in all required fields');
            return;
        }

        const selectedPublisher = publishers.find(p => p.id.toString() === formData.publisherId.toString());

        onSave({
            ...formData,
            publisherName: selectedPublisher ? selectedPublisher.fullName : 'Unknown',
            subIds: formData.subIds.split(',').map(s => s.trim()).filter(s => s)
        });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{initialData ? 'Edit Sampling' : 'Add Sampling'}</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Publisher <span className="red">*</span></label>
                        <select 
                            className="form-select"
                            value={formData.publisherId}
                            onChange={e => setFormData({...formData, publisherId: e.target.value})}
                            disabled={!!initialData} 
                        >
                            <option value="">Choose any Publisher</option>
                            {publishers.map(pub => (
                                <option key={pub.id} value={pub.id}>{pub.fullName} (ID: {pub.id})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Sampling Based On</label>
                        <select 
                            className="form-select"
                            value={formData.samplingBasedOn}
                            onChange={e => setFormData({...formData, samplingBasedOn: e.target.value})}
                        >
                            <option value="Sub ID (Source)">Sub ID (Source)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Sub IDs</label>
                        <div className="radio-group">
                            <label>
                                <input 
                                    type="radio" 
                                    checked={formData.subIdsType === 'All'}
                                    onChange={() => setFormData({...formData, subIdsType: 'All'})}
                                /> All
                            </label>
                            <label>
                                <input 
                                    type="radio" 
                                    checked={formData.subIdsType === 'Exclude'}
                                    onChange={() => setFormData({...formData, subIdsType: 'Exclude'})}
                                /> All excluding specific sub ids
                            </label>
                            <label>
                                <input 
                                    type="radio" 
                                    checked={formData.subIdsType === 'Include'}
                                    onChange={() => setFormData({...formData, subIdsType: 'Include'})}
                                /> Only on Particular sub ids
                            </label>
                        </div>
                        {formData.subIdsType !== 'All' && (
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Enter Sub IDs separated by comma"
                                value={formData.subIds}
                                onChange={e => setFormData({...formData, subIds: e.target.value})}
                                style={{marginTop: '10px'}}
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label>Goal Name <span className="red">*</span></label>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Install, Event"
                            value={formData.goalName}
                            onChange={e => setFormData({...formData, goalName: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Sampling Value <span className="red">*</span></label>
                        <div className="input-group">
                            <input 
                                type="number" 
                                className="form-input" 
                                value={formData.samplingValue}
                                onChange={e => setFormData({...formData, samplingValue: e.target.value})}
                            />
                            <span className="input-suffix">%</span>
                        </div>
                    </div>

                    <div className="note-box">
                        <strong>Note:</strong> Sampling is Applied on Gross Conversions(Approved + Pending + Sampled + Cancelled Conversions) or Gross Goals.
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-primary" onClick={handleSubmit}>Save</button>
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    width: 500px;
                    max-width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                .red { color: red; }
                .radio-group {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .radio-group label {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-weight: normal;
                }
                .help-text {
                    display: block;
                    color: #666;
                    font-size: 0.85rem;
                    margin-top: 5px;
                }
                .input-group {
                    display: flex;
                    align-items: center;
                }
                .input-suffix {
                    padding: 8px 12px;
                    background: #eee;
                    border: 1px solid #ddd;
                    border-left: none;
                    border-radius: 0 4px 4px 0;
                }
                .input-group .form-input {
                    border-radius: 4px 0 0 4px;
                }
                .note-box {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    margin-bottom: 20px;
                }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    border-top: 1px solid #eee;
                    padding-top: 15px;
                }
            `}</style>
        </div>
    );
};

export default AddSamplingModal;
