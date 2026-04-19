import React, { useState, useEffect } from 'react';

const AddClicksModal = ({ isOpen, onClose, onSave, publishers, initialData = null }) => {
    const [formData, setFormData] = useState({
        publisherId: '',
        basedOn: 'Sub ID (Source)',
        subIdsType: 'All',
        subIds: '',
        type: 'Clicks', // 'Clicks' or 'Unique Clicks'
        cutoffType: 'percentage', // 'percentage' or 'count'
        value: '',
        action: 'Cutoff' // Fixed for now as per requirement implication
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                subIds: initialData.subIds ? initialData.subIds.join(', ') : '',
            });
        } else {
            setFormData({
                publisherId: '',
                basedOn: 'Sub ID (Source)',
                subIdsType: 'All',
                subIds: '',
                type: 'Clicks',
                cutoffType: 'percentage',
                value: '',
                action: 'Cutoff'
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!formData.publisherId || !formData.value) {
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
                    <h3>{initialData ? 'Edit Clicks Config' : 'Add Clicks Config'}</h3>
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
                        <label>Type <span className="red">*</span></label>
                        <select 
                            className="form-select"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value})}
                        >
                            <option value="Clicks">Clicks</option>
                            <option value="Unique Clicks">Unique Clicks</option>
                            <option value="Both">Both</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Based On</label>
                        <select 
                            className="form-select"
                            value={formData.basedOn}
                            onChange={e => setFormData({...formData, basedOn: e.target.value})}
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
                        <label>Cutoff Type <span className="red">*</span></label>
                        <select 
                            className="form-select"
                            value={formData.cutoffType}
                            onChange={e => setFormData({...formData, cutoffType: e.target.value})}
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="count">Count</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Cutoff Value {formData.cutoffType === 'percentage' ? '(%)' : '(Count)'} <span className="red">*</span></label>
                        <div className="input-group"> 
                            <input 
                                type="number" 
                                className="form-input" 
                                placeholder={formData.cutoffType === 'percentage' ? '0-100' : 'Enter count'}
                                min={formData.cutoffType === 'percentage' ? '0' : '1'}
                                max={formData.cutoffType === 'percentage' ? '100' : undefined}
                                value={formData.value}
                                onChange={e => setFormData({...formData, value: e.target.value})}
                            />
                            {formData.cutoffType === 'percentage' && (
                                <div className="input-suffix">%</div>
                            )}
                        </div>
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
                    flex: 1;
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

export default AddClicksModal;
