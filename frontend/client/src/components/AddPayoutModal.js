import React, { useState, useEffect } from 'react';

const AddPayoutModal = ({ isOpen, onClose, onSave, publishers, initialData = null }) => {
    const [formData, setFormData] = useState({
        publisherId: '',
        goalName: 'Gross Conversions',
        payoutType: 'fixed',
        payoutValue: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                payoutValue: initialData.payoutValue || ''
            });
        } else {
            setFormData({
                publisherId: '',
                goalName: 'Gross Conversions',
                payoutType: 'fixed',
                payoutValue: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!formData.publisherId || !formData.payoutValue || !formData.goalName) {
            alert('Please fill in all required fields');
            return;
        }

        const selectedPublisher = publishers.find(p => p.id.toString() === formData.publisherId.toString());

        onSave({
            ...formData,
            publisherName: selectedPublisher ? selectedPublisher.fullName : 'Unknown',
            payoutValue: Number(formData.payoutValue)
        });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{initialData ? 'Edit Payout' : 'Add Payout'}</h3>
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
                        <label>Payout Type</label>
                        <select 
                            className="form-select"
                            value={formData.payoutType}
                            onChange={e => setFormData({...formData, payoutType: e.target.value})}
                        >
                            <option value="fixed">Fixed Amount</option>
                            <option value="percentage">Percentage (%)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Payout Value <span className="red">*</span></label>
                        <div className="input-group">
                            <input 
                                type="number" 
                                className="form-input" 
                                value={formData.payoutValue}
                                onChange={e => setFormData({...formData, payoutValue: e.target.value})}
                            />
                            <span className="input-suffix">
                                {formData.payoutType === 'percentage' ? '%' : '₹/Unit'}
                            </span>
                        </div>
                    </div>

                    <div className="note-box">
                        <strong>Note:</strong> Payout is the amount paid to the publisher for each valid conversion or goal completed.
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
                .form-select, .form-input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default AddPayoutModal;
