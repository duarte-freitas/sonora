import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Home, Search, Library, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Heart, Plus, Shuffle, Repeat, Clock3, ListMusic, X, Music2, Sparkles,
  ChevronRight, Radio, Check, ListPlus, Headphones,
  AlertCircle, LoaderCircle
} from 'lucide-react';

const STORAGE = {
  likes: 'sonora_v1_liked_tracks',
  volume: 'sonora_v1_volume',
  playlists: 'sonora_v1_playlists'
};

const FALLBACK_TRACKS = [
  { id: 'fb-01', title: 'Hey', artist: 'Bensound', album: 'Acoustic Dreams', duration: 30, coverUrl: 'https://picsum.photos/seed/sonora-acoustic/360/360', audioUrl: 'https://www.bensound.com/bensound-music/bensound-hey.mp3' },
  { id: 'fb-02', title: 'Creative Minds', artist: 'Bensound', album: 'Lo-Fi Sessions', duration: 30, coverUrl: 'https://picsum.photos/seed/sonora-lofi/360/360', audioUrl: 'https://www.bensound.com/bensound-music/bensound-creativeminds.mp3' },
  { id: 'fb-03', title: 'Summer', artist: 'Bensound', album: 'Chill Out', duration: 30, coverUrl: 'https://picsum.photos/seed/sonora-summer/360/360', audioUrl: 'https://www.bensound.com/bensound-music/bensound-sunny.mp3' },
  { id: 'fb-04', title: 'New Dawn', artist: 'Bensound', album: 'Ambient Horizons', duration: 30, coverUrl: 'https://picsum.photos/seed/sonora-dawn/360/360', audioUrl: 'https://www.bensound.com/bensound-music/bensound-newdawn.mp3' },
  { id: 'fb-05', title: 'Tenderness', artist: 'Bensound', album: 'Piano Landscapes', duration: 30, coverUrl: 'https://picsum.photos/seed/sonora-piano/360/360', audioUrl: 'https://www.bensound.com/bensound-music/bensound-tenderness.mp3' },
  { id: 'fb-06', title: 'Rumble', artist: 'Bensound', album: 'Cinematic Tension', duration: 30, coverUrl: 'https://picsum.photos/seed/sonora-cinema/360/360', audioUrl: 'https://www.bensound.com/bensound-music/bensound-rumble.mp3' }
];

const DEFAULT_PLAYLISTS = [
  { id: 'pl-focus', name: 'Focus Flow', desc: 'Concentração para seguir em frente', cover: 'https://picsum.photos/seed/sonora-focus/360/360', tone: 'violet', kind: 'focus' },
  { id: 'pl-top', name: 'Top Hits', desc: 'Uma seleção para começar', cover: 'https://picsum.photos/seed/sonora-hits/360/360', tone: 'orange', kind: 'top' },
  { id: 'pl-chill', name: 'Chill Vibes', desc: 'Desacelere um pouco', cover: 'https://picsum.photos/seed/sonora-chill/360/360', tone: 'blue', kind: 'chill' },
  { id: 'pl-gym', name: 'Treino Pesado', desc: 'Energia para não parar', cover: 'https://picsum.photos/seed/sonora-gym/360/360', tone: 'red', kind: 'gym' }
];

const CATEGORIES = [
  { name: 'Pop', query: 'pop', tone: 'lilac', seed: 'sonora-cat-pop' },
  { name: 'Rock', query: 'rock', tone: 'red', seed: 'sonora-cat-rock' },
  { name: 'Hip-hop', query: 'hip hop', tone: 'orange', seed: 'sonora-cat-hiphop' },
  { name: 'Eletrônica', query: 'electronic dance', tone: 'green', seed: 'sonora-cat-electro' },
  { name: 'Jazz', query: 'jazz', tone: 'blue', seed: 'sonora-cat-jazz' },
  { name: 'Clássica', query: 'classical', tone: 'teal', seed: 'sonora-cat-classical' },
  { name: 'Funk', query: 'funk brasileiro', tone: 'pink', seed: 'sonora-cat-funk' },
  { name: 'Lo-fi', query: 'lofi chill', tone: 'purple', seed: 'sonora-cat-lofi' }
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage pode estar indisponível */ }
}

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function mapTrack(item, index = 0) {
  return {
    id: `itunes-${item.trackId ?? `${item.artistId ?? 'item'}-${index}`}`,
    title: item.trackName || 'Faixa sem título',
    artist: item.artistName || 'Artista desconhecido',
    album: item.collectionName || 'Single',
    duration: item.previewUrl ? 30 : 0,
    coverUrl: (item.artworkUrl100 || '').replace(/100x100bb\.(jpg|png|webp)/i, '360x360bb.$1') || `https://picsum.photos/seed/sonora-${index}/360/360`,
    audioUrl: item.previewUrl || '',
    storeUrl: item.trackViewUrl || ''
  };
}

function uniqueTracks(tracks) {
  const seen = new Set();
  return tracks.filter((track) => {
    if (!track || !track.id || seen.has(track.id)) return false;
    seen.add(track.id);
    return true;
  });
}

function makeShuffleOrder(length, startIndex = 0) {
  if (!length) return [];
  const remaining = Array.from({ length }, (_, index) => index).filter((index) => index !== startIndex);
  for (let i = remaining.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }
  return [startIndex, ...remaining];
}

export default function App() {
  const [tracks, setTracks] = useState(FALLBACK_TRACKS);
  const [currentTrack, setCurrentTrack] = useState(FALLBACK_TRACKS[0]);
  const [playQueue, setPlayQueue] = useState(FALLBACK_TRACKS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(() => {
    const value = readStorage(STORAGE.volume, 70);
    return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 70;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [likedTracks, setLikedTracks] = useState(() => {
    const saved = readStorage(STORAGE.likes, []);
    return Array.isArray(saved) ? saved.filter((item) => item && typeof item === 'object' && item.id) : [];
  });
  const [userPlaylists, setUserPlaylists] = useState(() => {
    const saved = readStorage(STORAGE.playlists, []);
    return Array.isArray(saved) ? saved.filter((item) => item && item.id && item.name) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(FALLBACK_TRACKS);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0 = desligado, 1 = repetir fila, 2 = repetir faixa
  const [dataSource, setDataSource] = useState('loading');
  const [isSearching, setIsSearching] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [pendingTrack, setPendingTrack] = useState(null);
  const [trackToAdd, setTrackToAdd] = useState(null);
  const [notice, setNotice] = useState('');
  const [audioError, setAudioError] = useState('');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef(null);
  const searchInputRef = useRef(null);
  const prevVolumeRef = useRef(70);

  useEffect(() => writeStorage(STORAGE.likes, likedTracks), [likedTracks]);
  useEffect(() => writeStorage(STORAGE.volume, volume), [volume]);
  useEffect(() => writeStorage(STORAGE.playlists, userPlaylists), [userPlaylists]);

  // Carrega prévias musicais. Se a API não responder, a biblioteca de demonstração permanece disponível.
  useEffect(() => {
    const controller = new AbortController();
    async function loadInitialTracks() {
      try {
        const response = await fetch('https://itunes.apple.com/search?term=pop&entity=song&limit=24', { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        const mapped = uniqueTracks((body.results || []).map(mapTrack));
        if (!mapped.length) throw new Error('Nenhum resultado retornado');
        setTracks(mapped);
        setCurrentTrack(mapped[0]);
        setPlayQueue(mapped);
        setCurrentIndex(0);
        setDuration(mapped[0].duration || 30);
        setSearchResults(mapped);
        setDataSource('itunes');
      } catch (error) {
        if (error.name === 'AbortError') return;
        setTracks(FALLBACK_TRACKS);
        setCurrentTrack(FALLBACK_TRACKS[0]);
        setPlayQueue(FALLBACK_TRACKS);
        setSearchResults(FALLBACK_TRACKS);
        setDataSource('demo');
      }
    }
    loadInitialTracks();
    return () => controller.abort();
  }, []);

  // Busca com debounce e cancelamento: respostas antigas não substituem a consulta mais nova.
  useEffect(() => {
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults(tracks);
      setIsSearching(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=30`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        const mapped = uniqueTracks((body.results || []).map(mapTrack));
        setSearchResults(mapped);
      } catch (error) {
        if (error.name !== 'AbortError') {
          const normalized = term.toLocaleLowerCase('pt-BR');
          const local = uniqueTracks([...tracks, ...FALLBACK_TRACKS]).filter((track) =>
            `${track.title} ${track.artist} ${track.album}`.toLocaleLowerCase('pt-BR').includes(normalized)
          );
          setSearchResults(local);
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onMeta = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onPlay = () => { setIsPlaying(true); setIsLoadingAudio(false); setAudioError(''); };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoadingAudio(true);
    const onCanPlay = () => setIsLoadingAudio(false);
    const onError = () => {
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setAudioError('Não foi possível carregar este áudio. Tente outra faixa ou verifique sua conexão.');
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  const safePlay = useCallback(async (audio) => {
    if (!audio) return;
    try {
      await audio.play();
      setAudioError('');
    } catch {
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setAudioError('O navegador bloqueou a reprodução ou o áudio está indisponível. Aperte play novamente ou escolha outra faixa.');
    }
  }, []);

  const beginTrack = useCallback((track, sourceQueue = tracks) => {
    const list = sourceQueue?.length ? sourceQueue : [track];
    const index = Math.max(0, list.findIndex((entry) => entry.id === track.id));
    setPlayQueue(list);
    setCurrentIndex(index);
    if (isShuffled) setShuffleOrder(makeShuffleOrder(list.length, index));
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.duration || 30);
    setAudioError('');
    if (!track.audioUrl) {
      setIsPlaying(false);
      setAudioError('Esta música não tem uma prévia de áudio disponível no catálogo.');
      if (audioRef.current) audioRef.current.pause();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = track.audioUrl;
    audio.load();
    setIsLoadingAudio(true);
    safePlay(audio);
  }, [safePlay, tracks, isShuffled]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      if (!audio.src || audio.getAttribute('src') !== currentTrack.audioUrl) {
        if (!currentTrack.audioUrl) {
          setAudioError('Esta música não tem uma prévia de áudio disponível no catálogo.');
          return;
        }
        audio.src = currentTrack.audioUrl;
        audio.load();
      }
      safePlay(audio);
    } else {
      audio.pause();
    }
  }, [currentTrack, safePlay]);

  const selectTrack = useCallback((track, sourceQueue = tracks) => {
    const sameQueue = playQueue.length === sourceQueue.length && playQueue.every((item, index) => item.id === sourceQueue[index]?.id);
    if (currentTrack?.id === track.id && sameQueue) {
      togglePlay();
      return;
    }
    beginTrack(track, sourceQueue);
  }, [tracks, playQueue, currentTrack, togglePlay, beginTrack]);

  const moveToIndex = useCallback((nextIndex, automatic = false) => {
    const list = playQueue;
    if (!list.length) return;
    if (repeatMode === 2 && automatic) {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = 0; safePlay(audio); }
      setCurrentTime(0);
      return;
    }
    let target = nextIndex;
    if (isShuffled && shuffleOrder.length === list.length) {
      const position = shuffleOrder.indexOf(currentIndex);
      let nextPosition = position + 1;
      if (nextPosition >= shuffleOrder.length) {
        if (automatic && repeatMode === 0) {
          const audio = audioRef.current;
          if (audio) { audio.pause(); audio.currentTime = 0; }
          setCurrentTime(0);
          setIsPlaying(false);
          return;
        }
        nextPosition = 0;
      }
      target = shuffleOrder[nextPosition];
    } else if (target >= list.length) {
      if (automatic && repeatMode === 0) {
        const audio = audioRef.current;
        if (audio) { audio.pause(); audio.currentTime = 0; }
        setCurrentTime(0);
        setIsPlaying(false);
        return;
      }
      target = 0;
    } else if (target < 0) {
      target = list.length - 1;
    }
    const next = list[target];
    if (!next) return;
    setCurrentIndex(target);
    setCurrentTrack(next);
    setCurrentTime(0);
    setDuration(next.duration || 30);
    setAudioError('');
    const audio = audioRef.current;
    if (!next.audioUrl) {
      if (audio) audio.pause();
      setIsPlaying(false);
      setAudioError('A próxima faixa não possui prévia de áudio disponível.');
      return;
    }
    if (audio) {
      audio.pause();
      audio.src = next.audioUrl;
      audio.load();
      safePlay(audio);
    }
  }, [playQueue, currentIndex, isShuffled, shuffleOrder, repeatMode, safePlay]);

  const handleNext = useCallback(() => moveToIndex(currentIndex + 1, false), [moveToIndex, currentIndex]);
  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    moveToIndex(currentIndex - 1, false);
  }, [moveToIndex, currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const onEnded = () => moveToIndex(currentIndex + 1, true);
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [moveToIndex, currentIndex]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return;
      if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
      else if (event.code === 'ArrowRight' && event.shiftKey) skipBy(10);
      else if (event.code === 'ArrowLeft' && event.shiftKey) skipBy(-10);
      else if (event.code === 'ArrowRight') handleNext();
      else if (event.code === 'ArrowLeft') handlePrev();
      else if (event.code === 'ArrowUp') { event.preventDefault(); setVolume((old) => Math.min(100, old + 5)); setIsMuted(false); }
      else if (event.code === 'ArrowDown') { event.preventDefault(); setVolume((old) => Math.max(0, old - 5)); }
      else if (event.code === 'KeyM') toggleMute();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const skipBy = useCallback((amount) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const nextTime = Math.min(audio.duration, Math.max(0, audio.currentTime + amount));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((muted) => {
      if (muted) {
        setVolume(prevVolumeRef.current || 70);
        return false;
      }
      prevVolumeRef.current = volume;
      return true;
    });
  }, [volume]);

  const toggleShuffle = useCallback(() => {
    const nextEnabled = !isShuffled;
    setIsShuffled(nextEnabled);
    setShuffleOrder(nextEnabled ? makeShuffleOrder(playQueue.length, currentIndex) : []);
  }, [isShuffled, playQueue, currentIndex]);

  const isLiked = useCallback((track) => likedTracks.some((item) => item.id === track?.id), [likedTracks]);
  const toggleLike = useCallback((track) => {
    setLikedTracks((prev) => prev.some((item) => item.id === track.id)
      ? prev.filter((item) => item.id !== track.id)
      : [track, ...prev]);
  }, []);

  const defaultPlaylistTracks = useCallback((playlist) => {
    if (!tracks.length) return [];
    if (playlist.kind === 'focus') return tracks.filter((_, index) => index % 3 !== 1).slice(0, 12);
    if (playlist.kind === 'top') return tracks.slice(0, 12);
    if (playlist.kind === 'chill') return tracks.filter((_, index) => index % 2 === 0).slice(0, 12);
    if (playlist.kind === 'gym') return [...tracks].reverse().slice(0, 12);
    return [];
  }, [tracks]);

  const playlistSongs = useMemo(() => {
    if (!selectedPlaylist) return [];
    if (selectedPlaylist.id === 'pl-liked') return likedTracks;
    if (selectedPlaylist.kind) return defaultPlaylistTracks(selectedPlaylist);
    return selectedPlaylist.tracks || [];
  }, [selectedPlaylist, likedTracks, defaultPlaylistTracks]);

  const allPlaylists = useMemo(() => [
    { id: 'pl-liked', name: 'Músicas curtidas', desc: 'Suas favoritas em um só lugar', cover: 'https://picsum.photos/seed/sonora-liked/360/360', tone: 'green', kind: 'liked', count: likedTracks.length },
    ...DEFAULT_PLAYLISTS.map((playlist) => ({ ...playlist, count: defaultPlaylistTracks(playlist).length })),
    ...userPlaylists.map((playlist) => ({ ...playlist, tone: playlist.tone || 'purple', count: (playlist.tracks || []).length }))
  ], [likedTracks.length, userPlaylists, defaultPlaylistTracks]);

  const upNext = useMemo(() => {
    if (!playQueue.length || playQueue.length === 1) return [];
    const output = [];
    const order = isShuffled && shuffleOrder.length === playQueue.length
      ? shuffleOrder
      : playQueue.map((_, index) => index);
    const position = order.indexOf(currentIndex);
    const limit = Math.min(playQueue.length - 1, 12);
    for (let step = 1; step <= limit; step += 1) {
      const index = order[(position + step) % order.length];
      output.push({ track: playQueue[index], index });
    }
    return output;
  }, [playQueue, currentIndex, isShuffled, shuffleOrder]);

  const openView = (view) => {
    setSelectedPlaylist(null);
    setActiveView(view);
  };

  const openPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setActiveView('playlist');
  };

  const createPlaylist = (event) => {
    event.preventDefault();
    const name = newPlaylistName.trim();
    if (!name) return;
    const playlist = {
      id: `user-${Date.now()}`,
      name,
      desc: 'Playlist criada por você',
      cover: 'https://picsum.photos/seed/sonora-custom-' + encodeURIComponent(name) + '/360/360',
      tone: 'purple',
      tracks: pendingTrack ? [pendingTrack] : []
    };
    setUserPlaylists((prev) => [playlist, ...prev]);
    setPendingTrack(null);
    setNewPlaylistName('');
    setShowCreateModal(false);
    openPlaylist(playlist);
    setNotice(`Playlist “${name}” criada.`);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const addTrackToPlaylist = (playlist) => {
    if (!trackToAdd) return;
    setUserPlaylists((prev) => prev.map((item) => {
      if (item.id !== playlist.id) return item;
      const existing = item.tracks || [];
      if (existing.some((track) => track.id === trackToAdd.id)) return item;
      return { ...item, tracks: [...existing, trackToAdd] };
    }));
    if (selectedPlaylist?.id === playlist.id) {
      setSelectedPlaylist((current) => {
        if (!current) return current;
        const existing = current.tracks || [];
        return existing.some((track) => track.id === trackToAdd.id)
          ? current
          : { ...current, tracks: [...existing, trackToAdd] };
      });
    }
    setNotice(`“${trackToAdd.title}” adicionada à playlist “${playlist.name}”.`);
    setTrackToAdd(null);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const removeTrackFromPlaylist = (playlistId, trackId) => {
    setUserPlaylists((prev) => prev.map((item) => item.id === playlistId
      ? { ...item, tracks: (item.tracks || []).filter((track) => track.id !== trackId) }
      : item));
    const fresh = userPlaylists.find((item) => item.id === playlistId);
    if (fresh && selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist({ ...fresh, tracks: (fresh.tracks || []).filter((track) => track.id !== trackId) });
    }
  };

  const TrackRow = ({ track, index, sourceTracks, canRemove = false }) => (
    <div className={`track-row ${currentTrack?.id === track.id ? 'is-current' : ''}`}>
      <button className="track-index" onClick={() => selectTrack(track, sourceTracks)} aria-label={`Tocar ${track.title}`}>
        {currentTrack?.id === track.id && isPlaying ? <span className="equalizer"><i /><i /><i /></span> : <><span className="index-number">{index + 1}</span><Play size={15} className="index-play" fill="currentColor" /></>}
      </button>
      <button className="track-main" onClick={() => selectTrack(track, sourceTracks)}>
        <img className="track-art" src={track.coverUrl} alt="" loading="lazy" />
        <span className="track-copy">
          <span className="track-title">{track.title}</span>
          <span className="track-artist">{track.artist}</span>
        </span>
      </button>
      <span className="track-album">{track.album}</span>
      {track.audioUrl ? null : <span className="no-preview" title="Prévia indisponível">Sem prévia</span>}
      <div className="track-actions">
        <button className={`icon-button like-button ${isLiked(track) ? 'liked' : ''}`} onClick={() => toggleLike(track)} aria-label={isLiked(track) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} title={isLiked(track) ? 'Desfavoritar' : 'Favoritar'}>
          <Heart size={17} fill={isLiked(track) ? 'currentColor' : 'none'} />
        </button>
        {userPlaylists.length > 0 && <button className="icon-button add-button" onClick={() => setTrackToAdd(track)} aria-label="Adicionar a uma playlist" title="Adicionar à playlist"><Plus size={17} /></button>}
        {canRemove && selectedPlaylist && !selectedPlaylist.kind && <button className="icon-button remove-button" onClick={() => removeTrackFromPlaylist(selectedPlaylist.id, track.id)} aria-label="Remover da playlist" title="Remover da playlist"><X size={16} /></button>}
        <span className="track-duration">{formatTime(track.duration || 0)}</span>
      </div>
    </div>
  );

  const MusicCard = ({ track, index, sourceTracks = tracks }) => {
    const active = currentTrack?.id === track.id;
    return (
      <article className={`music-card ${active ? 'card-active' : ''}`}>
        <div className="music-cover-wrap">
          <button className="cover-hit-area" onClick={() => selectTrack(track, sourceTracks)} aria-label={`Tocar ${track.title}`}>
            <img className="music-cover" src={track.coverUrl} alt={`Capa de ${track.album}`} loading="lazy" />
          </button>
          <button className="card-play" onClick={() => selectTrack(track, sourceTracks)} aria-label={active && isPlaying ? 'Pausar' : `Tocar ${track.title}`}>
            {active && isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
        </div>
        <div className="music-card-info">
          <button className="music-card-title" onClick={() => selectTrack(track, sourceTracks)}>{track.title}</button>
          <p>{track.artist}</p>
          <div className="card-bottom">
            <span>{track.album}</span>
            <button className={`icon-button ${isLiked(track) ? 'liked' : ''}`} onClick={() => toggleLike(track)} aria-label="Favoritar música"><Heart size={16} fill={isLiked(track) ? 'currentColor' : 'none'} /></button>
          </div>
        </div>
      </article>
    );
  };

  const PlaylistCard = ({ playlist }) => (
    <button className="playlist-card" onClick={() => openPlaylist(playlist)}>
      <img src={playlist.cover} alt="" loading="lazy" />
      <span className="playlist-card-copy"><strong>{playlist.name}</strong><small>{playlist.desc || `${playlist.count || 0} músicas`}</small></span>
      <span className="playlist-card-arrow"><ChevronRight size={18} /></span>
    </button>
  );

  const renderHome = () => (
    <div className="page-content home-page">
      <section className="hero-panel">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="hero-topline"><span className="eyebrow"><Sparkles size={14} /> SEU ESPAÇO MUSICAL</span><span className={`connection-pill ${dataSource === 'itunes' ? 'online' : ''}`}><i />{dataSource === 'itunes' ? 'Catálogo conectado' : dataSource === 'demo' ? 'Modo demonstração' : 'Conectando catálogo'}</span></div>
        <h1>{greeting()},<br /><span>o que combina com você?</span></h1>
        <p>Descubra sons novos, organize seus favoritos e deixe a música acompanhar seu dia.</p>
        <button className="primary-cta" onClick={() => openView('search')}><Search size={18} /> Explorar músicas <ChevronRight size={17} /></button>
        <div className="hero-note"><Headphones size={15} /> As faixas do catálogo são prévias de áudio.</div>
      </section>

      <section className="content-section">
        <div className="section-heading"><div><span className="eyebrow">OUÇA DE NOVO</span><h2>Escolhas rápidas</h2></div><button className="text-link" onClick={() => openView('library')}>Sua biblioteca <ChevronRight size={16} /></button></div>
        <div className="quick-grid">
          {tracks.slice(0, 6).map((track, index) => (
            <button key={track.id} className="quick-tile" onClick={() => selectTrack(track, tracks)}>
              <img src={track.coverUrl} alt="" loading="lazy" /><span>{track.title}</span><span className="quick-play">{currentTrack?.id === track.id && isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading"><div><span className="eyebrow">PARA O SEU MOMENTO</span><h2>Feito para descobrir</h2></div><button className="text-link" onClick={() => openView('search')}>Ver catálogo <ChevronRight size={16} /></button></div>
        {dataSource === 'loading' ? <div className="loading-inline"><LoaderCircle className="spin" size={18} /> Carregando músicas…</div> : <div className="music-grid">{tracks.slice(0, 6).map((track, index) => <MusicCard key={track.id} track={track} index={index} sourceTracks={tracks} />)}</div>}
      </section>

      <section className="content-section last-section">
        <div className="section-heading"><div><span className="eyebrow">SUAS VIBES</span><h2>Playlists para cada clima</h2></div><button className="text-link" onClick={() => setShowCreateModal(true)}><Plus size={16} /> Criar playlist</button></div>
        <div className="playlist-grid">{allPlaylists.slice(0, 5).map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} />)}</div>
      </section>
    </div>
  );

  const renderSearch = () => (
    <div className="page-content search-page">
      <div className="page-title-row"><div><span className="eyebrow">ENCONTRE SEU SOM</span><h1>Buscar</h1></div><span className="search-mark"><Search size={23} /></span></div>
      <div className="search-box"><Search size={20} /><input ref={searchInputRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Artista, música ou estilo…" aria-label="Buscar músicas" />{searchQuery && <button className="icon-button clear-search" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }} aria-label="Limpar busca"><X size={18} /></button>}</div>
      {searchQuery.trim() ? (
        <section className="content-section search-results-section">
          <div className="section-heading"><div><span className="eyebrow">CATÁLOGO MUSICAL</span><h2>Resultados para “{searchQuery.trim()}”</h2></div>{isSearching && <LoaderCircle className="spin muted-icon" size={20} />}</div>
          {isSearching && searchResults.length === 0 ? <div className="empty-state"><LoaderCircle size={26} className="spin" /><p>Buscando músicas…</p></div> : searchResults.length ? <div className="track-list">{searchResults.map((track, index) => <TrackRow key={`${track.id}-${index}`} track={track} index={index} sourceTracks={searchResults} />)}</div> : <div className="empty-state"><Search size={30} /><h3>Nenhuma música encontrada</h3><p>Tente outro nome de música, artista ou estilo.</p></div>}
        </section>
      ) : (
        <section className="content-section">
          <div className="section-heading"><div><span className="eyebrow">EXPLORE POR ESTILO</span><h2>Navegar por categorias</h2></div></div>
          <div className="category-grid">{CATEGORIES.map((category) => <button className={`category-card tone-${category.tone}`} key={category.name} onClick={() => setSearchQuery(category.query)}><span>{category.name}</span><img src={`https://picsum.photos/seed/${category.seed}/140/140`} alt="" loading="lazy" /></button>)}</div>
          <div className="search-hint"><Radio size={18} /><span>As buscas usam o catálogo do iTunes. A disponibilidade de prévias varia por faixa e região.</span></div>
        </section>
      )}
    </div>
  );

  const renderLibrary = () => (
    <div className="page-content library-page">
      <div className="page-title-row"><div><span className="eyebrow">TUDO NO SEU LUGAR</span><h1>Sua biblioteca</h1></div><button className="round-action" onClick={() => setShowCreateModal(true)} aria-label="Criar playlist"><Plus size={21} /></button></div>
      <div className="library-tabs"><span className="active">Playlists</span><span>{likedTracks.length} favoritas</span><span>{userPlaylists.length} criadas por você</span></div>
      <div className="library-feature">
        <div className="liked-art"><Heart size={34} fill="currentColor" /></div>
        <div className="library-feature-copy"><span className="eyebrow">SEU ACERVO PESSOAL</span><h2>Músicas curtidas</h2><p>{likedTracks.length} {likedTracks.length === 1 ? 'faixa salva' : 'faixas salvas'} para ouvir quando quiser.</p></div>
        <button className="feature-play" onClick={() => likedTracks.length ? beginTrack(likedTracks[0], likedTracks) : setNotice('Curta uma música para ela aparecer aqui.')} aria-label="Tocar músicas curtidas"><Play size={21} fill="currentColor" /></button>
      </div>
      <section className="content-section"><div className="section-heading"><div><span className="eyebrow">SUAS COLEÇÕES</span><h2>Playlists</h2></div><button className="text-link" onClick={() => setShowCreateModal(true)}><Plus size={16} /> Nova playlist</button></div><div className="playlist-grid">{allPlaylists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} />)}</div></section>
      <section className="content-section last-section"><div className="section-heading"><div><span className="eyebrow">SALVAS POR VOCÊ</span><h2>Últimas músicas curtidas</h2></div></div>
        {likedTracks.length ? <div className="track-list">{likedTracks.slice(0, 8).map((track, index) => <TrackRow key={track.id} track={track} index={index} sourceTracks={likedTracks} />)}</div> : <div className="empty-state compact"><Heart size={28} /><h3>Seu coração ainda está livre</h3><p>Toque no coração de uma música para salvá-la aqui.</p><button className="secondary-cta" onClick={() => openView('search')}>Encontrar músicas</button></div>}
      </section>
    </div>
  );

  const renderPlaylist = () => (
    <div className="page-content playlist-page">
      <button className="back-link" onClick={() => openView('library')}>← Voltar à biblioteca</button>
      <section className={`playlist-hero tone-${selectedPlaylist?.tone || 'purple'}`}>
        <img src={selectedPlaylist?.cover || 'https://picsum.photos/seed/sonora-playlist/360/360'} alt="" />
        <div className="playlist-hero-copy"><span className="eyebrow">PLAYLIST</span><h1>{selectedPlaylist?.name || 'Playlist'}</h1><p>{selectedPlaylist?.desc || 'Sua coleção musical.'}</p><span className="playlist-count">{playlistSongs.length} {playlistSongs.length === 1 ? 'música' : 'músicas'}</span></div>
      </section>
      <div className="playlist-toolbar"><button className="big-play" onClick={() => playlistSongs.length ? beginTrack(playlistSongs[0], playlistSongs) : setNotice('Adicione músicas para começar a ouvir.')} aria-label="Tocar playlist"><Play size={23} fill="currentColor" /></button>{selectedPlaylist?.kind === 'liked' ? <button className="secondary-cta" onClick={() => openView('search')}>Encontrar mais músicas</button> : !selectedPlaylist?.kind && <button className="secondary-cta" onClick={() => openView('search')}>Adicionar músicas pela busca <Plus size={16} /></button>}</div>
      {playlistSongs.length ? <div className="track-list playlist-tracks"><div className="track-header"><span>#</span><span>Título</span><span>Álbum</span><span><Clock3 size={16} /></span></div>{playlistSongs.map((track, index) => <TrackRow key={track.id} track={track} index={index} sourceTracks={playlistSongs} canRemove />)}</div> : <div className="empty-state"><Music2 size={30} /><h3>Essa playlist está vazia</h3><p>{selectedPlaylist?.kind === 'liked' ? 'Curta músicas no catálogo para guardar suas favoritas aqui.' : 'Encontre uma música na busca e use o botão + para adicioná-la a uma playlist.'}</p><button className="secondary-cta" onClick={() => openView('search')}>Buscar músicas</button></div>}
    </div>
  );

  const renderQueue = () => (
    <aside className="queue-panel">
      <div className="queue-heading"><div><span className="eyebrow">REPRODUÇÃO</span><h3>Fila de músicas</h3></div><button className="icon-button" onClick={() => setShowQueue(false)} aria-label="Fechar fila"><X size={19} /></button></div>
      <div className="queue-current-label">TOCANDO AGORA</div>
      {currentTrack && <div className="queue-current"><img src={currentTrack.coverUrl} alt="" /><div><strong>{currentTrack.title}</strong><span>{currentTrack.artist}</span></div><span className={isPlaying ? 'playing-dot' : 'paused-dot'} /> </div>}
      <div className="queue-current-label next-label">A SEGUIR</div>
      {upNext.length ? upNext.map(({ track, index }) => <button key={`${track.id}-${index}`} className="queue-row" onClick={() => beginTrack(track, playQueue)}><img src={track.coverUrl} alt="" /><span><strong>{track.title}</strong><small>{track.artist}</small></span><Play size={15} /></button>) : <p className="queue-empty">Não há outras faixas na fila.</p>}
    </aside>
  );

  return (
    <div className="app-shell">
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
      <aside className="sidebar">
        <button className="brand" onClick={() => openView('home')} aria-label="Sonora início"><span className="brand-mark"><span /><span /><span /></span><span>sonora<span className="brand-period">.</span></span></button>
        <nav className="main-nav" aria-label="Navegação principal">
          <button className={activeView === 'home' && !selectedPlaylist ? 'active' : ''} onClick={() => openView('home')}><Home size={21} /><span>Início</span></button>
          <button className={activeView === 'search' ? 'active' : ''} onClick={() => openView('search')}><Search size={21} /><span>Buscar</span></button>
          <button className={activeView === 'library' || activeView === 'playlist' ? 'active' : ''} onClick={() => openView('library')}><Library size={21} /><span>Sua biblioteca</span></button>
        </nav>
        <div className="sidebar-playlists-header"><span>SUAS PLAYLISTS</span><button className="icon-button" onClick={() => setShowCreateModal(true)} aria-label="Criar playlist"><Plus size={19} /></button></div>
        <div className="sidebar-playlists">{allPlaylists.map((playlist) => <button key={playlist.id} className={`sidebar-playlist ${selectedPlaylist?.id === playlist.id ? 'selected' : ''}`} onClick={() => openPlaylist(playlist)}><img src={playlist.cover} alt="" loading="lazy" /><span>{playlist.name}</span></button>)}</div>
        <div className="sidebar-bottom"><div className="source-indicator"><span className={dataSource === 'itunes' ? 'source-dot online' : 'source-dot'} /><div><strong>{dataSource === 'itunes' ? 'Catálogo iTunes' : dataSource === 'demo' ? 'Modo demonstração' : 'Conectando…'}</strong><small>{dataSource === 'itunes' ? 'Pré-escutas disponíveis' : 'A biblioteca de exemplo está pronta'}</small></div></div><span className="sidebar-version">SONORA WEB · 1.0</span></div>
      </aside>

      <main className="main-layout">
        <header className="topbar"><div className="history-controls"><button onClick={() => openView('home')} aria-label="Início"><ChevronRight className="chevron-left" size={18} /></button><span className="topbar-divider" /><span className="breadcrumb">{selectedPlaylist?.name || ({ home: 'Visão geral', search: 'Descobrir', library: 'Sua biblioteca' }[activeView] || 'Sonora')}</span></div><button className="topbar-create" onClick={() => setShowCreateModal(true)}><Plus size={16} /> Criar playlist</button></header>
        <div className="main-body">
          {selectedPlaylist ? renderPlaylist() : activeView === 'home' ? renderHome() : activeView === 'search' ? renderSearch() : renderLibrary()}
        </div>
        {showQueue && renderQueue()}
      </main>

      <footer className="player-bar">
        <div className="now-playing">
          <img className="now-art" src={currentTrack?.coverUrl} alt="" />
          <div className="now-copy"><strong>{currentTrack?.title || 'Escolha uma música'}</strong><span>{currentTrack?.artist || 'Sua próxima descoberta está esperando'}</span></div>
          <button className={`icon-button now-like ${isLiked(currentTrack) ? 'liked' : ''}`} onClick={() => currentTrack && toggleLike(currentTrack)} aria-label="Favoritar faixa atual"><Heart size={18} fill={isLiked(currentTrack) ? 'currentColor' : 'none'} /></button>
        </div>
        <div className="player-center">
          <div className="player-controls">
            <button className={`player-icon ${isShuffled ? 'control-active' : ''}`} onClick={toggleShuffle} aria-label="Aleatório" title="Aleatório"><Shuffle size={17} /></button>
            <button className="player-icon" onClick={handlePrev} aria-label="Faixa anterior" title="Anterior"><SkipBack size={20} fill="currentColor" /></button>
            <button className="main-play" onClick={togglePlay} aria-label={isPlaying ? 'Pausar' : 'Reproduzir'} title={isPlaying ? 'Pausar' : 'Reproduzir'}>{isLoadingAudio ? <LoaderCircle className="spin" size={20} /> : isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
            <button className="player-icon" onClick={handleNext} aria-label="Próxima faixa" title="Próxima"><SkipForward size={20} fill="currentColor" /></button>
            <button className={`player-icon repeat-control ${repeatMode ? 'control-active' : ''}`} onClick={() => setRepeatMode((mode) => (mode + 1) % 3)} aria-label={repeatMode === 2 ? 'Repetir faixa' : repeatMode === 1 ? 'Repetir fila' : 'Não repetir'} title={repeatMode === 2 ? 'Repetir faixa' : repeatMode === 1 ? 'Repetir fila' : 'Não repetir'}><Repeat size={17} />{repeatMode === 2 && <i>1</i>}</button>
          </div>
          <div className="progress-row"><span>{formatTime(currentTime)}</span><input type="range" min="0" max={Number.isFinite(duration) && duration > 0 ? duration : 30} step="0.1" value={Math.min(currentTime, duration || 30)} onChange={(event) => { const value = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = value; setCurrentTime(value); }} aria-label="Progresso da música" /><span>{formatTime(Math.max(0, (duration || 0) - currentTime))}</span></div>
          {audioError && <div className="audio-error" role="status"><AlertCircle size={13} /> {audioError}</div>}
        </div>
        <div className="player-right"><button className={`player-icon queue-toggle ${showQueue ? 'control-active' : ''}`} onClick={() => setShowQueue((value) => !value)} aria-label="Fila de reprodução" title="Fila de reprodução"><ListMusic size={19} /></button><button className="player-icon" onClick={toggleMute} aria-label={isMuted || volume === 0 ? 'Ativar som' : 'Silenciar'} title="Volume">{isMuted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}</button><input type="range" className="volume-range" min="0" max="100" value={isMuted ? 0 : volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); if (next > 0) setIsMuted(false); }} aria-label="Volume" /></div>
      </footer>

      {showCreateModal && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowCreateModal(false); setPendingTrack(null); } }}><form className="modal-card" onSubmit={createPlaylist}><div className="modal-heading"><div><span className="eyebrow">PERSONALIZE SUA BIBLIOTECA</span><h2>Criar playlist</h2></div><button type="button" className="icon-button" onClick={() => { setShowCreateModal(false); setPendingTrack(null); }} aria-label="Fechar"><X size={20} /></button></div><label className="modal-label" htmlFor="playlist-name">Nome da playlist</label><input id="playlist-name" autoFocus maxLength={48} value={newPlaylistName} onChange={(event) => setNewPlaylistName(event.target.value)} placeholder="Ex.: Sons para jogar" required /><p className="modal-help">Depois, adicione músicas usando o botão + ao lado de cada faixa.</p><div className="modal-actions"><button type="button" className="secondary-cta" onClick={() => { setShowCreateModal(false); setPendingTrack(null); }}>Cancelar</button><button type="submit" className="primary-cta" disabled={!newPlaylistName.trim()}><Check size={17} /> Criar playlist</button></div></form></div>}

      {trackToAdd && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTrackToAdd(null); }}><div className="modal-card"><div className="modal-heading"><div><span className="eyebrow">ADICIONAR MÚSICA</span><h2>Escolha uma playlist</h2></div><button className="icon-button" onClick={() => setTrackToAdd(null)} aria-label="Fechar"><X size={20} /></button></div><div className="add-track-preview"><img src={trackToAdd.coverUrl} alt="" /><span><strong>{trackToAdd.title}</strong><small>{trackToAdd.artist}</small></span></div><div className="playlist-choice-list">{userPlaylists.map((playlist) => { const alreadyAdded = (playlist.tracks || []).some((track) => track.id === trackToAdd.id); return <button key={playlist.id} disabled={alreadyAdded} onClick={() => addTrackToPlaylist(playlist)}><img src={playlist.cover} alt="" /><span>{playlist.name}</span>{alreadyAdded ? <Check size={17} /> : <Plus size={17} />}</button>; })}</div>{userPlaylists.length === 0 && <div className="empty-state compact"><ListPlus size={25} /><p>Você ainda não criou uma playlist própria.</p></div>}<button className="secondary-cta full-width" onClick={() => { setPendingTrack(trackToAdd); setTrackToAdd(null); setNewPlaylistName(''); setShowCreateModal(true); }}>Criar nova playlist <Plus size={16} /></button></div></div>}

      {notice && <div className="toast" role="status"><Check size={16} />{notice}<button className="icon-button" onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={15} /></button></div>}

      <nav className="mobile-nav" aria-label="Navegação móvel"><button className={activeView === 'home' && !selectedPlaylist ? 'active' : ''} onClick={() => openView('home')}><Home size={20} /><span>Início</span></button><button className={activeView === 'search' ? 'active' : ''} onClick={() => openView('search')}><Search size={20} /><span>Buscar</span></button><button className={activeView === 'library' || selectedPlaylist ? 'active' : ''} onClick={() => openView('library')}><Library size={20} /><span>Biblioteca</span></button></nav>
    </div>
  );
}
