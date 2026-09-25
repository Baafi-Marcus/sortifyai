import React, { useState } from 'react';
import { XMarkIcon, StarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const FeedbackModal = ({ isOpen, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        if (!name.trim()) {
            alert('Please enter your name');
            return;
        }
        if (!email.trim()) {
            alert('Please enter your email');
            return;
        }
        if (!message.trim()) {
            alert('Please write your feedback');
            return;
        }

        setSubmitting(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    rating,
                    message
                })
            });

            if (response.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    onClose();
                    setRating(0);
                    setName('');
                    setEmail('');
                    setMessage('');
                    setSubmitted(false);
                }, 2000);
            } else {
                alert('Failed to submit feedback. Please try again.');
            }
        } catch (error) {
            alert('Error submitting feedback: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-md max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    aria-label="Close feedback modal"
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-standard"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>

                {submitted ? (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-white mb-1">Feedback Submitted</h3>
                        <p className="text-xs text-slate-400">Thank you for helping us refine SortifyAI.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-base font-semibold text-white mb-1">Product Feedback</h2>
                        <p className="text-xs text-slate-400 mb-5">Share observations or suggestions directly with the development team</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Star Rating */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rating *</label>
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            aria-label={`Rate ${star} stars`}
                                            className="p-1 rounded text-slate-500 hover:text-amber-400 transition-standard"
                                        >
                                            {star <= (hoverRating || rating) ? (
                                                <StarIconSolid className="w-6 h-6 text-amber-400" />
                                            ) : (
                                                <StarIcon className="w-6 h-6 text-slate-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                                    placeholder="Your name"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Feedback *</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary resize-none"
                                    placeholder="Enter your observations or requests..."
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full px-4 py-2.5 bg-brand-primary hover:bg-brand-accent text-slate-900 font-semibold rounded text-xs transition-standard hover-subtle disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <ArrowPathIcon className="w-4 h-4 animate-spin text-slate-900" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <span>Submit Feedback</span>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;
