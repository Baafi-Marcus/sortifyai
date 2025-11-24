import React, { useState } from 'react';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
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
            const response = await fetch('http://localhost:8000/feedback', {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-brand-secondary/90 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {submitted ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
                        <p className="text-slate-400">Your feedback has been submitted successfully.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-2">Share Your Feedback</h2>
                        <p className="text-slate-400 mb-6">Help us improve SortifyAI!</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Star Rating */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Rating *</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="transition-transform hover:scale-110"
                                        >
                                            {star <= (hoverRating || rating) ? (
                                                <StarIconSolid className="w-8 h-8 text-yellow-400" />
                                            ) : (
                                                <StarIcon className="w-8 h-8 text-slate-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 bg-brand-dark/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary/50"
                                    placeholder="Your name"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 bg-brand-dark/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary/50"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Your Feedback *</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 bg-brand-dark/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary/50 resize-none"
                                    placeholder="Tell us what you think..."
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full px-6 py-3 bg-brand-primary text-brand-dark font-bold rounded-lg hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackModal;
