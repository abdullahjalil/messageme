import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    arrayUnion
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { X, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
    { id: 'technology', name: 'Technology' },
    { id: 'business', name: 'Business' },
    { id: 'creative', name: 'Creative' },
    { id: 'education', name: 'Education' },
    { id: 'entertainment', name: 'Entertainment' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'health', name: 'Health' },
    { id: 'lifestyle', name: 'Lifestyle' },
    { id: 'science', name: 'Science' },
];

const CreateTopicModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'technology',
        rules: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Topic name is required';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Topic name must be at least 3 characters';
        } else if (formData.name.length > 50) {
            newErrors.name = 'Topic name must be less than 50 characters';
        } else if (!/^[a-zA-Z0-9\s-]+$/.test(formData.name)) {
            newErrors.name = 'Only letters, numbers, spaces, and hyphens are allowed';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        } else if (formData.description.length > 500) {
            newErrors.description = 'Description must be less than 500 characters';
        }

        if (formData.rules.length > 1000) {
            newErrors.rules = 'Rules must be less than 1000 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            toast.error('You must be logged in to create a topic');
            return;
        }

        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        setLoading(true);

        try {
            // Format the topic name for URL
            const urlName = formData.name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');

            // Check for existing topic
            const topicsRef = collection(db, 'topics');
            const q = query(topicsRef, where('urlName', '==', urlName));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setErrors(prev => ({
                    ...prev,
                    name: 'A topic with this name already exists'
                }));
                setLoading(false);
                return;
            }

            // Create timestamp
            const now = serverTimestamp();

            // Create topic document
            // In your handleSubmit function:

            const topicData = {
                name: formData.name.trim(),
                urlName,
                description: formData.description.trim(),
                category: formData.category,
                rules: formData.rules.trim(),
                createdBy: currentUser.uid,
                creatorName: currentUser.displayName, // Make sure this is set
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastActivityAt: serverTimestamp(),
                memberCount: 1,
                postCount: 0,
                members: [currentUser.uid],
                moderators: [currentUser.uid],
                isPrivate: false,
                isNSFW: false,
                settings: {
                    allowImages: true,
                    allowPolls: true,
                    allowLinks: true,
                    requireModeratorApproval: false,
                }
            };

            const docRef = await addDoc(collection(db, 'topics'), topicData);

            // Update user's topics list
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, {
                    topics: arrayUnion(docRef.id),
                    moderatingTopics: arrayUnion(docRef.id)
                });
            } catch (error) {
                console.error('Error updating user document:', error);
                // Continue since the topic was created successfully
            }

            toast.success('Topic created successfully!');
            onClose();
            navigate(`/topic/${urlName}`);
        } catch (error) {
            console.error('Error creating topic:', error);
            toast.error(error.message || 'Error creating topic. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="relative bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-msme-sage/70 hover:text-msme-sage transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="px-6 py-4 border-b border-msme-sage/10">
                    <h2 className="text-2xl font-bold text-msme-sage">Create New Topic</h2>
                    <p className="text-sm text-msme-sage/70 mt-1">
                        Create a new topic for people to join and discuss
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-medium text-msme-sage mb-1">
                                Topic Name*
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Web Development"
                                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-msme-gold focus:border-transparent
                          bg-msme-cream/10 placeholder:text-msme-sage/50 ${errors.name ? 'border-red-500' : 'border-msme-sage/10'
                                    }`}
                                maxLength={50}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    {errors.name}
                                </p>
                            )}
                            <p className="text-xs text-msme-sage/50 mt-1">
                                {50 - formData.name.length} characters remaining • Letters, numbers, spaces, and hyphens only
                            </p>
                        </div>

                        {/* Category Field */}
                        <div>
                            <label className="block text-sm font-medium text-msme-sage mb-1">
                                Category*
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-msme-gold focus:border-transparent
                          bg-msme-cream/10 border-msme-sage/10"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="block text-sm font-medium text-msme-sage mb-1">
                                Description*
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="What's this topic about?"
                                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-msme-gold focus:border-transparent
                          bg-msme-cream/10 placeholder:text-msme-sage/50 min-h-[100px] ${errors.description ? 'border-red-500' : 'border-msme-sage/10'
                                    }`}
                                maxLength={500}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    {errors.description}
                                </p>
                            )}
                            <p className="text-xs text-msme-sage/50 mt-1">
                                {500 - formData.description.length} characters remaining
                            </p>
                        </div>

                        {/* Rules Field */}
                        <div>
                            <label className="block text-sm font-medium text-msme-sage mb-1">
                                Rules (Optional)
                            </label>
                            <textarea
                                name="rules"
                                value={formData.rules}
                                onChange={handleChange}
                                placeholder="Add any specific rules for your topic..."
                                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-msme-gold focus:border-transparent
                          bg-msme-cream/10 placeholder:text-msme-sage/50 min-h-[100px] ${errors.rules ? 'border-red-500' : 'border-msme-sage/10'
                                    }`}
                                maxLength={1000}
                            />
                            {errors.rules && (
                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    {errors.rules}
                                </p>
                            )}
                            <p className="text-xs text-msme-sage/50 mt-1">
                                {1000 - formData.rules.length} characters remaining
                            </p>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-msme-sage/10">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="bg-msme-sage/10 hover:bg-msme-sage/20 text-msme-sage"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-msme-gold hover:bg-msme-gold/90 text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </span>
                            ) : (
                                'Create Topic'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTopicModal;