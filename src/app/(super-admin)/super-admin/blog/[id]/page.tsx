"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ArrowLeft, Save, Send } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    heading: "",
    cover_image: "",
    content: "",
    excerpt: "",
    author_name: "CaseFiles Team",
    meta_title: "",
    meta_description: "",
    status: "draft",
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/blog/${id}`);
        const data = await res.json();
        if (data.post) {
          setForm({
            title: data.post.title || "",
            heading: data.post.heading || "",
            cover_image: data.post.cover_image || "",
            content: data.post.content || "",
            excerpt: data.post.excerpt || "",
            author_name: data.post.author_name || "CaseFiles Team",
            meta_title: data.post.meta_title || "",
            meta_description: data.post.meta_description || "",
            status: data.post.status || "draft",
          });
        }
      } catch {
        toast.error("Failed to load post");
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  const handleSave = async (status: "draft" | "published") => {
    if (!form.title.trim() || !form.heading.trim() || !form.content.trim()) {
      toast.error("Title, heading, and content are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(status === "published" ? "Post published!" : "Draft saved");
        router.push("/super-admin/blog");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading post...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/super-admin/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Blog Post</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> Save Draft
          </Button>
          <Button onClick={() => handleSave("published")} disabled={saving}>
            <Send className="h-4 w-4 mr-2" /> Publish
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Heading (display)</label>
            <Input value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cover Image URL</label>
            <Input value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Excerpt</label>
            <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Author</label>
            <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Meta Title</label>
            <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <Input value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
