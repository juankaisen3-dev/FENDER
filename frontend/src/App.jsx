import React, { useState, useEffect, useRef } from 'react';
import {
  Download, Video, Trash2, Play, Clock, HardDrive, RefreshCw,
  AlertCircle, CheckCircle2, XCircle, Zap, Film, Settings, FolderOpen,
  Music, Subtitles, Info, List, BarChart3, Search, ChevronDown, X
} from 'lucide-react';

const API_URL = '/api';
const WS_URL = 'ws://localhost:8080';

function App() {
  const [videos, setVideos] = useState([]);
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('high');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('download');
  const [formats, setFormats] = useState(null);
  const [showFormats, setShowFormats] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [stats, setStats] = useState({});
  const [downloadMode, setDownloadMode] = useState('video');
  const [subLang, setSubLang] = useState('fr,en');
  const [audioFormat, setAudioFormat] = useState('mp3');
  
  const wsRef = useRef(null);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${API_URL}/videos`);
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      console.error('Erreur chargement vidéos:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchStats();
    
    wsRef.current = new WebSocket(WS_URL);
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress') {
        setVideos(prev => prev.map(v => 
          v.id === data.id ? { ...v, progress: data.progress } : v
        ));
      } else if (['completed', 'error', 'deleted', 'clear'].includes(data.type)) {
        fetchVideos();
        fetchStats();
      }
    };

    return () => wsRef.current?.close();
  }, []);

  // Analyser l'URL pour récupérer les formats
  const analyzeUrl = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/formats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setVideoInfo(data);
      setFormats(data.formats);
      setShowFormats(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'URL est supportée
  const checkUrl = async () => {
    if (!url) return;
    try {
      const res = await fetch(`${API_URL}/check-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.supported) {
        alert(`✅ URL supportée\nTitre: ${data.title}`);
      } else {
        alert(`❌ URL non supportée`);
      }
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError('');
    
    try {
      let endpoint = `${API_URL}/download`;
      let body = { url, quality };
      
      if (downloadMode === 'format' && selectedFormat) {
        endpoint = `${API_URL}/download-format`;
        body = { url, formatId: selectedFormat };
      } else if (downloadMode === 'audio') {
        endpoint = `${API_URL}/download-audio`;
        body = { url, format: audioFormat };
      } else if (downloadMode === 'subs') {
        endpoint = `${API_URL}/download-with-subs`;
        body = { url, subLang, quality };
      }
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setUrl('');
      setFormats(null);
      setShowFormats(false);
      setVideoInfo(null);
      fetchVideos();
      fetchStats();
      setActiveTab('queue');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/videos/${id}`, { method: 'DELETE' });
      fetchVideos();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Supprimer TOUTES les vidéos ?')) {
      await fetch(`${API_URL}/videos`, { method: 'DELETE' });
      fetchVideos();
      fetchStats();
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'downloading': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                <Film className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                FENDER
              </h1>
              <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-full font-medium">
                Pro
              </span>
            </div>
            
            {/* Mini stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Video className="w-4 h-4 text-gray-500" />
                <span>{stats.completed || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <HardDrive className="w-4 h-4 text-gray-500" />
                <span>{formatSize(stats.totalSize || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
          {[
            { id: 'download', label: 'Télécharger', icon: Download },
            { id: 'videos', label: 'Bibliothèque', icon: Video },
            { id: 'queue', label: 'En cours', icon: Clock },
            { id: 'stats', label: 'Stats', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="mt-6">
          {activeTab === 'download' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-500" />
                  Nouveau téléchargement
                </h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">URL de la vidéo</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                    <button
                      onClick={analyzeUrl}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
                      title="Analyser les formats"
                    >
                      <Search className="w-4 h-4" />
                      Analyser
                    </button>
                    <button
                      onClick={checkUrl}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      title="Vérifier URL"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Infos vidéo */}
                {videoInfo && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-start gap-3">
                      {videoInfo.thumbnail && (
                        <img src={videoInfo.thumbnail} alt="" className="w-24 h-16 object-cover rounded-lg" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{videoInfo.title}</h3>
                        <div className="flex gap-4 mt-1 text-sm text-gray-500">
                          <span>⏱️ {formatDuration(videoInfo.duration)}</span>
                          <span>👤 {videoInfo.uploader || 'Inconnu'}</span>
                        </div>
                      </div>
                      <button onClick={() => { setVideoInfo(null); setFormats(null); }} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode de téléchargement */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Mode</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'video', label: 'Vidéo', icon: Video },
                      { id: 'format', label: 'Format spécifique', icon: List },
                      { id: 'audio', label: 'Audio', icon: Music },
                      { id: 'subs', label: '+ Sous-titres', icon: Subtitles }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setDownloadMode(mode.id)}
                        className={`p-3 rounded-xl border transition flex flex-col items-center gap-1 ${
                          downloadMode === mode.id
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <mode.icon className="w-5 h-5" />
                        <span className="text-sm">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options spécifiques au mode */}
                {downloadMode === 'video' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Qualité</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'low', label: 'Basse', desc: '360p' },
                        { value: 'medium', label: 'Moyenne', desc: '480p' },
                        { value: 'high', label: 'Haute', desc: '720p+' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setQuality(opt.value)}
                          className={`p-3 rounded-xl border-2 transition ${
                            quality === opt.value
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-xs text-gray-500">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {downloadMode === 'audio' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Format audio</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['mp3', 'm4a', 'opus', 'flac'].map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setAudioFormat(fmt)}
                          className={`p-2 rounded-lg border uppercase ${
                            audioFormat === fmt
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {downloadMode === 'subs' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Langues des sous-titres</label>
                    <input
                      type="text"
                      value={subLang}
                      onChange={(e) => setSubLang(e.target.value)}
                      placeholder="fr,en,es"
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">Codes séparés par des virgules</p>
                  </div>
                )}

                {/* Formats disponibles */}
                {showFormats && formats && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Formats disponibles ({formats.length})</label>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">ID</th>
                            <th className="px-3 py-2 text-left">Extension</th>
                            <th className="px-3 py-2 text-left">Résolution</th>
                            <th className="px-3 py-2 text-left">Taille</th>
                            <th className="px-3 py-2 text-left"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {formats.map(f => (
                            <tr 
                              key={f.id}
                              className={`border-t border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                selectedFormat === f.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                              }`}
                              onClick={() => setSelectedFormat(f.id)}
                            >
                              <td className="px-3 py-2 font-mono text-xs">{f.id}</td>
                              <td className="px-3 py-2">{f.ext}</td>
                              <td className="px-3 py-2">{f.resolution || 'audio'}</td>
                              <td className="px-3 py-2">{f.filesize ? formatSize(f.filesize) : '—'}</td>
                              <td className="px-3 py-2">
                                {selectedFormat === f.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {loading ? 'Téléchargement...' : 'Télécharger'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <>
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Tout supprimer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.filter(v => v.status === 'completed').map(video => (
                  <div key={video.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-lg transition">
                    <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 relative">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-12 h-12 text-white/80 drop-shadow-lg" />
                        </div>
                      )}
                      <a
                        href={`/videos/${video.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <Play className="w-12 h-12 text-white drop-shadow-lg" />
                      </a>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium truncate flex-1" title={video.title}>
                          {video.title || 'Sans titre'}
                        </h3>
                        {getStatusIcon(video.status)}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {video.size && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {formatSize(video.size)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(video.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {videos.filter(v => v.status === 'completed').length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <FolderOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500">Aucune vidéo dans votre bibliothèque</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'queue' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.filter(v => v.status !== 'completed').map(video => (
                <div key={video.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium truncate">{video.url}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(video.created_at).toLocaleString()}
                      </p>
                    </div>
                    {getStatusIcon(video.status)}
                  </div>
                  {video.status === 'downloading' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span>{Math.round(video.progress || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${video.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {video.status === 'error' && (
                    <p className="mt-2 text-sm text-red-500">Erreur lors du téléchargement</p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {videos.filter(v => v.status !== 'completed').length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500">Aucun téléchargement en cours</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
                  <Video className="w-8 h-8 text-indigo-500 mb-2" />
                  <p className="text-3xl font-bold">{stats.total || 0}</p>
                  <p className="text-gray-500">Total vidéos</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                  <p className="text-3xl font-bold">{stats.completed || 0}</p>
                  <p className="text-gray-500">Complétées</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
                  <RefreshCw className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="text-3xl font-bold">{stats.downloading || 0}</p>
                  <p className="text-gray-500">En cours</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
                  <HardDrive className="w-8 h-8 text-purple-500 mb-2" />
                  <p className="text-3xl font-bold">{formatSize(stats.totalSize || 0)}</p>
                  <p className="text-gray-500">Espace utilisé</p>
                </div>
              </div>
            </div>
          )} 
        </div>
      </div>
    </div>
  );
}

export default App;