"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LabUploadForm() {
  const [testName, setTestName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("testName", testName);
    if (testDate) formData.append("testDate", testDate);
    formData.append("file", file);

    const res = await fetch("/api/portal/labs", { method: "POST", body: formData });
    setLoading(false);

    if (res.ok) {
      setMessage("Lab result uploaded successfully");
      setTestName("");
      setTestDate("");
      setFile(null);
      window.location.reload();
    } else {
      const data = await res.json();
      setMessage(data.error || "Upload failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Lab Result</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`rounded-lg px-4 py-3 text-sm ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {message}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="testName">Test name</Label>
              <Input id="testName" value={testName} onChange={(e) => setTestName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testDate">Test date</Label>
              <Input id="testDate" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Lab result file (PDF, image)</Label>
            <Input id="file" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
