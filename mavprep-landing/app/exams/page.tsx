"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, fetchUserAttributes } from "@aws-amplify/auth";
import AuthGuard from "../../components/AuthGuard";

type ExamPaper = {
  paperID: string;
  courseCode: string;
  courseName?: string;
  semester: string;
  year: number;
  professor: string;
  examType: "midterm" | "final" | "quiz";
  fileName: string;
  s3Key: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadDate: string;
  downloadCount?: number;
};

export default function ExamsPage() {
  const router = useRouter();

  // User state
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
  }>({ id: "", name: "", email: "" });

  // Exam papers state
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [courseCodeFilter, setCourseCodeFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCourseCode, setUploadCourseCode] = useState("");
  const [uploadCourseName, setUploadCourseName] = useState("");
  const [uploadSemester, setUploadSemester] = useState<"Fall" | "Spring" | "Summer">("Fall");
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear());
  const [uploadProfessor, setUploadProfessor] = useState("");
  const [uploadExamType, setUploadExamType] = useState<"midterm" | "final" | "quiz">("midterm");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setCurrentUser({
          id: user.userId,
          name: attributes.preferred_username || attributes.email || "User",
          email: attributes.email || "",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
    fetchUser();
  }, []);

  // Fetch exam papers
  useEffect(() => {
    async function fetchPapers() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (courseCodeFilter) params.append("courseCode", courseCodeFilter);
        if (semesterFilter) params.append("semester", semesterFilter);
        if (yearFilter) params.append("year", yearFilter);
        if (examTypeFilter) params.append("examType", examTypeFilter);
        if (professorFilter) params.append("professor", professorFilter);

        const response = await fetch(`/api/exam-papers/list?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch exam papers");
        }

        const data = await response.json();
        setPapers(data.papers || []);
      } catch (err) {
        setError("Failed to load exam papers. Please try again.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPapers();
  }, [courseCodeFilter, semesterFilter, yearFilter, examTypeFilter, professorFilter]);

  // Filter papers by search query
  const filteredPapers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return papers;

    return papers.filter(paper =>
      paper.courseCode.toLowerCase().includes(query) ||
      paper.courseName?.toLowerCase().includes(query) ||
      paper.professor.toLowerCase().includes(query) ||
      paper.fileName.toLowerCase().includes(query)
    );
  }, [papers, searchQuery]);

  // Get unique values for filters
  const uniqueCourses = useMemo(() =>
    Array.from(new Set(papers.map(p => p.courseCode))).sort(),
    [papers]
  );

  const uniqueProfessors = useMemo(() =>
    Array.from(new Set(papers.map(p => p.professor))).sort(),
    [papers]
  );

  const uniqueYears = useMemo(() =>
    Array.from(new Set(papers.map(p => p.year))).sort((a, b) => b - a),
    [papers]
  );

  // Reset upload form
  function resetUploadForm() {
    setUploadFile(null);
    setUploadCourseCode("");
    setUploadCourseName("");
    setUploadSemester("Fall");
    setUploadYear(new Date().getFullYear());
    setUploadProfessor("");
    setUploadExamType("midterm");
    setUploadError(null);
    setUploadProgress(0);
  }

  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are allowed");
      return;
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError("File size must be less than 10MB");
      return;
    }

    setUploadFile(file);
    setUploadError(null);
  }

  // Handle upload
  async function handleUpload() {
    if (!uploadFile) {
      setUploadError("Please select a file");
      return;
    }

    if (!uploadCourseCode.trim() || !uploadProfessor.trim()) {
      setUploadError("Please fill in all required fields");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned upload URL
      const urlResponse = await fetch("/api/exam-papers/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadFile.name,
          fileSize: uploadFile.size,
        }),
      });

      if (!urlResponse.ok) {
        const error = await urlResponse.json();
        throw new Error(error.error || "Failed to generate upload URL");
      }

      const { uploadUrl, paperID, s3Key } = await urlResponse.json();
      setUploadProgress(20);

      // Step 2: Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: uploadFile,
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }
      setUploadProgress(60);

      // Step 3: Save metadata to DynamoDB
      const metadata: ExamPaper = {
        paperID,
        courseCode: uploadCourseCode.trim(),
        courseName: uploadCourseName.trim() || undefined,
        semester: uploadSemester,
        year: uploadYear,
        professor: uploadProfessor.trim(),
        examType: uploadExamType,
        fileName: uploadFile.name,
        s3Key,
        fileSize: uploadFile.size,
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.name,
        uploadDate: new Date().toISOString(),
      };

      const metadataResponse = await fetch("/api/exam-papers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(error.error || "Failed to save metadata");
      }

      setUploadProgress(100);

      // Add to local state
      setPapers(prev => [metadata, ...prev]);

      // Close modal and reset
      setTimeout(() => {
        setShowUploadModal(false);
        resetUploadForm();
        setUploading(false);
      }, 500);

    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setUploadProgress(0);
    }
  }

  // Handle download
  async function handleDownload(paperID: string, fileName: string) {
    try {
      const response = await fetch(`/api/exam-papers/download/${paperID}`);

      if (!response.ok) {
        throw new Error("Failed to generate download URL");
      }

      const { downloadUrl } = await response.json();

      // Open download URL in new tab
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download file. Please try again.");
    }
  }

  // Handle delete
  async function handleDelete(paperID: string) {
    if (!confirm("Are you sure you want to delete this exam paper?")) {
      return;
    }

    try {
      const response = await fetch(`/api/exam-papers/delete/${paperID}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete exam paper");
      }

      // Remove from local state
      setPapers(prev => prev.filter(p => p.paperID !== paperID));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete exam paper. Please try again.");
    }
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // Format date
  function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/home")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold neon-text-glow">Past Exam Papers</h1>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-accent transition-colors"
              >
                Upload Exam
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className="w-64 flex-shrink-0">
              <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4 space-y-4 sticky top-8">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Filters
                </h3>

                {/* Search */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Course, prof, filename..."
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Course Code */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Course</label>
                  <select
                    value={courseCodeFilter}
                    onChange={(e) => setCourseCodeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">All Courses</option>
                    {uniqueCourses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Semester</label>
                  <select
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">All Semesters</option>
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Year</label>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">All Years</option>
                    {uniqueYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Exam Type */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Type</label>
                  <select
                    value={examTypeFilter}
                    onChange={(e) => setExamTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">All Types</option>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>

                {/* Professor */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Professor</label>
                  <select
                    value={professorFilter}
                    onChange={(e) => setProfessorFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="">All Professors</option>
                    {uniqueProfessors.map(prof => (
                      <option key={prof} value={prof}>{prof}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setCourseCodeFilter("");
                    setSemesterFilter("");
                    setYearFilter("");
                    setExamTypeFilter("");
                    setProfessorFilter("");
                    setSearchQuery("");
                  }}
                  className="w-full px-3 py-2 bg-gray-800 text-sm rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-4 text-gray-400">Loading exam papers...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                  {error}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && filteredPapers.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-400 text-lg mb-2">No exam papers found</p>
                  <p className="text-gray-500 text-sm">Try adjusting your filters or upload a new exam paper</p>
                </div>
              )}

              {/* Papers Grid */}
              {!loading && !error && filteredPapers.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    {filteredPapers.length} {filteredPapers.length === 1 ? "paper" : "papers"} found
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredPapers.map(paper => (
                      <div
                        key={paper.paperID}
                        className="bg-gradient-to-br from-[#041022] via-[#00131a] to-[#001f2b] border border-primary/30 rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">
                              {paper.courseCode}
                              {paper.courseName && ` - ${paper.courseName}`}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {paper.semester} {paper.year} • {paper.examType.charAt(0).toUpperCase() + paper.examType.slice(1)}
                            </p>
                          </div>
                          {paper.uploadedBy === currentUser.id && (
                            <button
                              onClick={() => handleDelete(paper.paperID)}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Prof. {paper.professor}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{paper.fileName}</span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatFileSize(paper.fileSize)}</span>
                            <span>•</span>
                            <span>Uploaded {formatDate(paper.uploadDate)}</span>
                            {paper.downloadCount !== undefined && paper.downloadCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{paper.downloadCount} downloads</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownload(paper.paperID, paper.fileName)}
                          className="w-full px-4 py-2 bg-primary text-black rounded-lg font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg bg-gradient-to-br from-[#041022] via-[#00131a] to-[#001f2b] border border-primary/30 rounded-xl shadow-[0_20px_60px_rgba(0,217,255,0.08)] p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-6">Upload Exam Paper</h3>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    PDF File <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-accent disabled:opacity-50"
                    />
                  </div>
                  {uploadFile && (
                    <p className="mt-1 text-xs text-gray-400">
                      {uploadFile.name} ({formatFileSize(uploadFile.size)})
                    </p>
                  )}
                </div>

                {/* Course Code */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Course Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadCourseCode}
                    onChange={(e) => setUploadCourseCode(e.target.value)}
                    placeholder="e.g., CSE-2320"
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Course Name (Optional) */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={uploadCourseName}
                    onChange={(e) => setUploadCourseName(e.target.value)}
                    placeholder="e.g., Data Structures"
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Professor */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Professor <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadProfessor}
                    onChange={(e) => setUploadProfessor(e.target.value)}
                    placeholder="e.g., Dr. Smith"
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Semester */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Semester <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={uploadSemester}
                      onChange={(e) => setUploadSemester(e.target.value as "Fall" | "Spring" | "Summer")}
                      disabled={uploading}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    >
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Year <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={uploadYear}
                      onChange={(e) => setUploadYear(parseInt(e.target.value))}
                      min="2000"
                      max={new Date().getFullYear() + 1}
                      disabled={uploading}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Exam Type */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Exam Type <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    {(["midterm", "final", "quiz"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setUploadExamType(type)}
                        disabled={uploading}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                          uploadExamType === type
                            ? "bg-primary text-black"
                            : "bg-black border border-gray-700 text-gray-200 hover:border-gray-600"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div>
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {uploadError && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    {uploadError}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      resetUploadForm();
                    }}
                    disabled={uploading}
                    className="px-4 py-2 rounded-lg bg-gray-800 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !uploadFile}
                    className="px-4 py-2 rounded-lg bg-primary text-black text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
