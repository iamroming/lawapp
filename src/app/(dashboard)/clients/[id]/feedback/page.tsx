"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Star,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Feedback {
  id: string;
  rating: number;
  feedback_text: string | null;
  feedback_type: string;
  is_anonymous: boolean;
  created_at: string;
  case: { case_number: string; title: string } | null;
}

export default function ClientFeedbackPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    rating: 5,
    feedback_text: "",
    feedback_type: "general",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [clientId]);

  const fetchFeedback = async () => {
    try {
      const res = await fetch(`/api/clients/feedback?client_id=${clientId}`);
      if (!res.ok) throw new Error("Failed");
      const result = await res.json();
      setFeedback(result.data || []);
      setAvgRating(result.average_rating || 0);
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/clients/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, ...newFeedback }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Feedback submitted");
      setShowRequestModal(false);
      setNewFeedback({ rating: 5, feedback_text: "", feedback_type: "general" });
      fetchFeedback();
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${
            s <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/clients/${clientId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            Client Feedback
          </h1>
          <p className="text-gray-500">Ratings and feedback history</p>
        </div>
        <Button onClick={() => setShowRequestModal(true)}>
          <Send className="h-4 w-4 mr-2" />
          Request Feedback
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500">Average Rating</p>
            <p className="text-3xl font-bold">{avgRating}</p>
            <StarRating rating={Math.round(avgRating)} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Reviews</p>
            <p className="text-2xl font-bold">{feedback.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">5-Star Reviews</p>
            <p className="text-2xl font-bold">
              {feedback.filter((f) => f.rating === 5).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback History</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No feedback yet for this client.
            </p>
          ) : (
            <div className="space-y-4">
              {feedback.map((f) => (
                <div key={f.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <StarRating rating={f.rating} />
                      <Badge variant="secondary" className="mt-1">
                        {f.feedback_type.replace("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(f.created_at)}
                    </span>
                  </div>
                  {f.feedback_text && (
                    <p className="text-sm text-gray-600 mt-2">{f.feedback_text}</p>
                  )}
                  {f.case && (
                    <p className="text-xs text-gray-400 mt-1">
                      Case: {f.case.case_number} - {f.case.title}
                    </p>
                  )}
                  {f.is_anonymous && (
                    <p className="text-xs text-gray-400 italic">Anonymous</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">Submit Feedback</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewFeedback({ ...newFeedback, rating: s })}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        s <= newFeedback.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={newFeedback.feedback_type}
                onChange={(e) =>
                  setNewFeedback({
                    ...newFeedback,
                    feedback_type: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="general">General</option>
                <option value="case_resolution">Case Resolution</option>
                <option value="consultation">Consultation</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Comments</label>
              <textarea
                value={newFeedback.feedback_text}
                onChange={(e) =>
                  setNewFeedback({
                    ...newFeedback,
                    feedback_text: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={3}
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRequestModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitFeedback} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
