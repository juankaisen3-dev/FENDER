const API_BASE = "/api";

export const fetchVideos = async () => {
  const res = await fetch(`${API_BASE}/videos`);
  return res.json();
};

export const analyzeVideo = async (url) => {
  const res = await fetch(`${API_BASE}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return res.json();
};

export const downloadVideo = async (url, quality) => {
  const res = await fetch(`${API_BASE}/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, quality }),
  });
  return res.json();
};

export const deleteVideoFile = async (filename) => {
  const res = await fetch(`${API_BASE}/videos/${encodeURIComponent(filename)}`, { 
    method: "DELETE" 
  });
  return res.json();
};
