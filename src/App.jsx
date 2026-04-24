import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpenText,
  ChevronDown,
  Github,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  PanelLeft,
  Plus,
  Send,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabaseClient';
import { upsertProfile } from './lib/supabaseBackend';

const IMAGE_LIMIT = 5;
const SESSION_LIMIT = 12;
const MESSAGE_LIMIT = 60;

function createId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${prefix}_${random}`;
}

function storageGet(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Large image previews can exceed localStorage. The UI should keep running.
  }
}

function loadTheme() {
  try {
    return localStorage.getItem('nfta_theme') || 'dark';
  } catch {
    return 'dark';
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem('nfta_theme', theme);
  } catch {}
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.dataset.theme = isLight ? 'light' : '';

  const favicon = document.getElementById('dynamic-favicon');
  if (favicon) {
    favicon.setAttribute('href', isLight ? '/favicon-light.png' : '/favicon-dark.png');
  }

  const themeColor = document.getElementById('theme-color');
  if (themeColor) {
    themeColor.setAttribute('content', isLight ? '#faf9f7' : '#131315');
  }
}

function DotGrid({ accentColor }) {
  const gridRef = useRef(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof window === 'undefined') return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      speed: 0,
    };
    const current = { ...target };
    let previous = {
      x: target.x,
      y: target.y,
      time: performance.now(),
    };
    let frame = 0;

    const updateVars = () => {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const offsetX = ((current.x - width / 2) / width) * -18;
      const offsetY = ((current.y - height / 2) / height) * -18;
      const energy = Math.min(Math.max(current.speed, 0), 1);

      grid.style.setProperty('--grid-x', `${current.x.toFixed(1)}px`);
      grid.style.setProperty('--grid-y', `${current.y.toFixed(1)}px`);
      grid.style.setProperty('--grid-near-x', `${offsetX.toFixed(2)}px`);
      grid.style.setProperty('--grid-near-y', `${offsetY.toFixed(2)}px`);
      grid.style.setProperty('--grid-mid-x', `${(offsetX * 0.55).toFixed(2)}px`);
      grid.style.setProperty('--grid-mid-y', `${(offsetY * 0.55).toFixed(2)}px`);
      grid.style.setProperty('--grid-far-x', `${(-offsetX * 0.38).toFixed(2)}px`);
      grid.style.setProperty('--grid-far-y', `${(-offsetY * 0.38).toFixed(2)}px`);
      grid.style.setProperty('--grid-near-dot', `${(1.05 + energy * 0.58).toFixed(2)}px`);
      grid.style.setProperty('--grid-mid-dot', `${(0.82 + energy * 0.28).toFixed(2)}px`);
      grid.style.setProperty('--grid-large-dot', `${(1.35 + energy * 0.82).toFixed(2)}px`);
      grid.style.setProperty('--grid-near-opacity', `${(0.4 + energy * 0.24).toFixed(3)}`);
      grid.style.setProperty('--grid-glow-opacity', `${(0.62 + energy * 0.2).toFixed(3)}`);
    };

    const hasMotion = () =>
      Math.abs(target.x - current.x) > 0.08 ||
      Math.abs(target.y - current.y) > 0.08 ||
      Math.abs(target.speed - current.speed) > 0.01 ||
      target.speed > 0.01 ||
      current.speed > 0.01;

    const animate = () => {
      current.x += (target.x - current.x) * 0.14;
      current.y += (target.y - current.y) * 0.14;
      current.speed += (target.speed - current.speed) * 0.16;
      target.speed *= 0.9;
      updateVars();

      if (hasMotion()) {
        frame = window.requestAnimationFrame(animate);
      } else {
        current.x = target.x;
        current.y = target.y;
        current.speed = 0;
        target.speed = 0;
        updateVars();
        frame = 0;
      }
    };

    const startAnimation = () => {
      if (!reduceMotion && !frame) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const handlePointerMove = (event) => {
      const now = performance.now();
      const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
      const elapsed = Math.max(now - previous.time, 16);

      target.x = event.clientX;
      target.y = event.clientY;
      target.speed = Math.min(1, distance / elapsed / 0.75);
      previous = { x: event.clientX, y: event.clientY, time: now };

      if (reduceMotion) {
        current.x = target.x;
        current.y = target.y;
        current.speed = 0.15;
        updateVars();
      } else {
        startAnimation();
      }
    };

    const handleWindowRest = () => {
      target.x = window.innerWidth / 2;
      target.y = window.innerHeight / 2;
      target.speed = 0;
      startAnimation();
    };

    updateVars();

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', handleWindowRest);
    window.addEventListener('blur', handleWindowRest);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleWindowRest);
      window.removeEventListener('blur', handleWindowRest);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={gridRef}
      className="dot-grid"
      style={{ '--grid-accent': accentColor || 'var(--gc-accent)' }}
      aria-hidden="true"
    />
  );
}

function loadSessions(labId) {
  return storageGet(`nfta_sessions_${labId}`, []);
}

function saveSessions(labId, sessions) {
  const trimmed = sessions.slice(0, SESSION_LIMIT).map((session) => ({
    ...session,
    messages: session.messages.slice(-MESSAGE_LIMIT),
  }));
  storageSet(`nfta_sessions_${labId}`, trimmed);
}

function newSession(labId) {
  return {
    id: createId('sess'),
    labId,
    title: 'New chat',
    createdAt: Date.now(),
    messages: [],
  };
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: createId('img'),
        name: file.name,
        size: file.size,
        type: file.type || 'image/*',
        url: reader.result,
      });
    };
    reader.onerror = () => reject(reader.error || new Error('Unable to read image.'));
    reader.readAsDataURL(file);
  });
}

function profileFromSupabaseUser(authUser) {
  const metadata = authUser?.user_metadata || {};
  const githubUsername =
    metadata.user_name || metadata.preferred_username || metadata.login || metadata.nickname || '';
  const displayName =
    metadata.full_name || metadata.name || githubUsername || authUser?.email || 'Network Forensics Student';

  return {
    id: authUser.id,
    name: displayName,
    displayName,
    githubUsername,
    avatarUrl: metadata.avatar_url || metadata.picture || '',
    bio: metadata.bio || '',
    email: authUser.email || '',
    role: 'student',
    joinedAt: Date.now(),
  };
}

function getAuthRedirectUrl() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}

function retrieveContext(lab, query) {
  if (!lab || !query || query.length < 3) return '';
  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 2);
  if (!tokens.length) return '';

  const scoreText = (text) => {
    if (!text) return 0;
    const target = text.toLowerCase();
    return tokens.reduce((sum, token) => sum + (target.includes(token) ? 1 : 0), 0);
  };

  const candidates = [];
  (lab.tasks || []).forEach((task) => {
    const blob = [
      task.id,
      task.taskSummary,
      task.studentGoal,
      ...(task.toolHints || []),
      ...(task.commonMistakes || []),
      task.interpretationTemplate,
    ].join(' ');
    const score = scoreText(blob);
    if (score > 0) {
      candidates.push({
        score: score * 2,
        text: [
          `Task [${task.id}]: ${task.taskSummary}`,
          `Goal: ${task.studentGoal}`,
          `Tool hints: ${(task.toolHints || []).join(' | ')}`,
          `Common mistakes: ${(task.commonMistakes || []).join(' | ')}`,
          `Interpretation: ${task.interpretationTemplate}`,
        ].join('\n'),
      });
    }
  });

  (lab.painPoints || []).forEach((point) => {
    const score = scoreText(point);
    if (score > 0) candidates.push({ score: score * 1.2, text: `Pain point: ${point}` });
  });

  (lab.tools || []).forEach((tool) => {
    const score = scoreText(tool);
    if (score > 0) candidates.push({ score: score * 0.7, text: `Tool used: ${tool}` });
  });

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((candidate) => candidate.text)
    .join('\n\n');
}

function buildSystemPrompt(lab, retrievedContext, user) {
  const tasks = (lab.tasks || [])
    .slice(0, 6)
    .map((task) => `- [${task.id}] ${task.taskSummary}`)
    .join('\n');

  return [
    `You are a dedicated Teaching Assistant for a Network Forensics / Digital Forensics lab course in the Information Technology program at Arizona State University, taught by Prof. John Lewis.`,
    user ? `Student: ${user.name}${user.githubUsername ? ` (@${user.githubUsername})` : ''}` : '',
    '',
    `Selected lab: Lab ${lab.number} - ${lab.title}`,
    `Domain: ${lab.domain}`,
    `Description: ${lab.shortDescription}`,
    `Tools: ${lab.tools.join(', ')}`,
    '',
    `Lab tasks:`,
    tasks,
    '',
    retrievedContext ? `Retrieved context:\n${retrievedContext}` : '',
    '',
    `Rules: do not invent evidence values such as hashes, IP addresses, filenames, timestamps, or usernames. Help with process, interpretation, and phrasing.`,
  ]
    .filter(Boolean)
    .join('\n');
}

function mockResponse(lab, query, context, attachments = []) {
  const task = (lab.tasks || []).find((candidate) => {
    const haystack = [candidate.id, candidate.taskSummary, candidate.studentGoal, ...(candidate.toolHints || [])]
      .join(' ')
      .toLowerCase();
    return query
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 3)
      .some((token) => haystack.includes(token));
  });

  const attachmentLine = attachments.length
    ? `\n\nI can see ${attachments.length} attached image${attachments.length === 1 ? '' : 's'} in this message. When the AI pipeline is connected, these previews should be sent as multimodal inputs alongside the text.`
    : '';

  if (task) {
    return [
      `**What this task is asking**`,
      task.studentGoal || task.taskSummary,
      '',
      `**Tool or artifact involved**`,
      (task.toolHints || []).slice(0, 3).map((hint) => `- ${hint}`).join('\n') || `- ${lab.tools[0]}`,
      '',
      `**What your finding should prove**`,
      task.expectedArtifact || 'Your finding should connect the artifact to the forensic question and show why it matters.',
      '',
      `**Common mistake to avoid**`,
      `- ${(task.commonMistakes || lab.painPoints || [])[0] || 'Do not invent lab-specific evidence values. Show how you located them.'}`,
      '',
      `**How to write the forensic interpretation**`,
      task.interpretationTemplate || 'Document the tool, artifact, value found, and what that value proves.',
      attachmentLine,
    ].join('\n');
  }

  return [
    `For Lab ${String(lab.number).padStart(2, '0')} - **${lab.title}**, I would approach this as a process question first.`,
    '',
    `1. Identify the artifact or tool involved: ${lab.tools.slice(0, 4).join(', ')}.`,
    `2. Check the lab task wording and locate the evidence source before recording values.`,
    `3. Capture the finding with enough context to prove where it came from.`,
    `4. Write the interpretation as evidence plus meaning, not just a screenshot caption.`,
    '',
    context ? `Relevant lab context:\n${context}` : `Common issue: ${(lab.painPoints || [])[0] || 'students often skip the interpretation step.'}`,
    attachmentLine,
  ].join('\n');
}

function App() {
  const labs = useMemo(() => Object.values(window.LAB_DATA || {}), []);
  const defaultLabId = labs[0]?.id || 'lab01';

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [theme, setTheme] = useState(() => {
    const stored = loadTheme();
    applyTheme(stored);
    return stored;
  });
  const [selectedLabId, setSelectedLabId] = useState(defaultLabId);
  const [sessions, setSessions] = useState(() => {
    const all = {};
    labs.forEach((lab) => {
      all[lab.id] = loadSessions(lab.id);
    });
    return all;
  });
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 900px)').matches;
  });
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState([]);
  const [composerError, setComposerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [dropActive, setDropActive] = useState(false);

  const messagesRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const selectedLab = (window.LAB_DATA || {})[selectedLabId] || labs[0];
  const labSessions = sessions[selectedLabId] || [];
  const currentSession =
    labSessions.find((session) => session.id === currentSessionId) || labSessions[0] || null;
  const messages = currentSession?.messages || [];

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    labs.forEach((lab) => {
      if (sessions[lab.id]) saveSessions(lab.id, sessions[lab.id]);
    });
  }, [labs, sessions]);

  useEffect(() => {
    if (!input && textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthReady(true);
      return undefined;
    }

    let active = true;

    const syncUser = async (authUser) => {
      if (!active) return;
      if (!authUser) {
        setUser(null);
        return;
      }

      const profile = profileFromSupabaseUser(authUser);
      setUser(profile);

      const { error } = await upsertProfile(profile);
      if (error && active) {
        setAuthError(`Signed in, but profile sync failed: ${error.message}`);
      }
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      syncUser(data.session?.user || null).finally(() => {
        if (active) setAuthReady(true);
      });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        syncUser(session?.user || null);
        setAuthReady(true);
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthError('Supabase is not configured for this build.');
      return;
    }

    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: getAuthRedirectUrl(),
        scopes: 'read:user user:email',
      },
    });

    if (error) setAuthError(error.message);
  }, []);

  const handleSignOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => {
      const next = previous === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
      return next;
    });
  }, []);

  const appendMessage = useCallback((labId, sessionId, message) => {
    setSessions((previous) => {
      const list = [...(previous[labId] || [])];
      const index = list.findIndex((session) => session.id === sessionId);
      if (index < 0) return previous;

      const updated = {
        ...list[index],
        messages: [...list[index].messages, message],
      };

      if (updated.messages.length === 1 && message.role === 'user') {
        const source = message.content || `${message.attachments?.length || 0} image question`;
        updated.title = source.slice(0, 42) + (source.length > 42 ? '...' : '');
      }

      list[index] = updated;
      return { ...previous, [labId]: list };
    });
  }, []);

  const handleNewChat = useCallback(() => {
    const session = newSession(selectedLabId);
    setSessions((previous) => ({
      ...previous,
      [selectedLabId]: [session, ...(previous[selectedLabId] || [])],
    }));
    setCurrentSessionId(session.id);
    setInput('');
    setPendingImages([]);
    setComposerError('');
  }, [selectedLabId]);

  const handleClearChat = useCallback(() => {
    if (!currentSession) return;
    setSessions((previous) => {
      const list = [...(previous[selectedLabId] || [])];
      const index = list.findIndex((session) => session.id === currentSession.id);
      if (index < 0) return previous;
      list[index] = { ...list[index], messages: [] };
      return { ...previous, [selectedLabId]: list };
    });
  }, [currentSession, selectedLabId]);

  const handleSelectLab = useCallback((labId) => {
    setSelectedLabId(labId);
    setCurrentSessionId(null);
    setInput('');
    setPendingImages([]);
    setComposerError('');
    setNotesOpen(false);
  }, []);

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      const ignored = files.length - imageFiles.length;
      const slots = IMAGE_LIMIT - pendingImages.length;

      if (slots <= 0) {
        setComposerError(`Each message can include up to ${IMAGE_LIMIT} images.`);
        return;
      }

      const accepted = imageFiles.slice(0, slots);
      const dropped = imageFiles.length - accepted.length;

      try {
        const attachments = await Promise.all(accepted.map(readImageFile));
        setPendingImages((previous) => [...previous, ...attachments]);

        if (ignored || dropped) {
          const parts = [];
          if (ignored) parts.push(`${ignored} non-image file${ignored === 1 ? '' : 's'} ignored`);
          if (dropped) parts.push(`${dropped} image${dropped === 1 ? '' : 's'} over the limit ignored`);
          setComposerError(parts.join('. ') + '.');
        } else {
          setComposerError('');
        }
      } catch {
        setComposerError('One of the selected images could not be read.');
      }
    },
    [pendingImages.length],
  );

  const handleRemovePendingImage = useCallback((id) => {
    setPendingImages((previous) => previous.filter((image) => image.id !== id));
    setComposerError('');
  }, []);

  const handleSend = useCallback(
    async (overrideText) => {
      if (!selectedLab || loading) return;

      const userText = (overrideText !== undefined ? overrideText : input).trim();
      const attachments = overrideText !== undefined ? [] : pendingImages;
      if (!userText && attachments.length === 0) return;

      setInput('');
      setPendingImages([]);
      setComposerError('');

      let activeSession = currentSession;
      let sessionId = activeSession?.id;

      if (!activeSession) {
        activeSession = newSession(selectedLabId);
        sessionId = activeSession.id;
        setSessions((previous) => ({
          ...previous,
          [selectedLabId]: [activeSession, ...(previous[selectedLabId] || [])],
        }));
        setCurrentSessionId(sessionId);
      }

      const historySnapshot = activeSession.messages || [];
      const userMessage = {
        id: createId('u'),
        role: 'user',
        content: userText,
        attachments,
        ts: Date.now(),
      };

      appendMessage(selectedLabId, sessionId, userMessage);
      setLoading(true);

      try {
        const context = retrieveContext(selectedLab, userText);
        const systemPrompt = buildSystemPrompt(selectedLab, context, user);
        const apiMessages = [
          { role: 'system', content: systemPrompt },
          ...historySnapshot.map((message) => ({
            role: message.role,
            content: message.content,
            attachments: message.attachments || [],
          })),
          { role: 'user', content: userText, attachments },
        ];

        let responseText;
        if (window.networkForensicsAI?.complete) {
          responseText = await window.networkForensicsAI.complete({
            lab: selectedLab,
            messages: apiMessages,
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 450));
          responseText = mockResponse(selectedLab, userText, context, attachments);
        }

        appendMessage(selectedLabId, sessionId, {
          id: createId('a'),
          role: 'assistant',
          content: responseText,
          ts: Date.now(),
        });
      } catch (error) {
        appendMessage(selectedLabId, sessionId, {
          id: createId('err'),
          role: 'assistant',
          content: `Something went wrong: ${error?.message || 'Unknown error'}. Please try again.`,
          ts: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    },
    [
      appendMessage,
      currentSession,
      input,
      loading,
      pendingImages,
      selectedLab,
      selectedLabId,
      user,
    ],
  );

  const handleTextareaInput = (event) => {
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(event.target.scrollHeight, 132)}px`;
  };

  const handleTextareaKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (!labs.length) {
    return (
      <div className="fatal-state">
        <AlertTriangle size={18} />
        <span>Lab data failed to load.</span>
      </div>
    );
  }

  if (!authReady) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <AuthScreen onSignIn={handleSignIn} error={authError} supabaseReady={hasSupabaseConfig} />;
  }

  const userInitials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const canSend = (input.trim() || pendingImages.length > 0) && !loading;

  return (
    <div className="app-shell">
      <DotGrid accentColor={selectedLab?.color} />
      {sidebarOpen && <button className="mobile-backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-inner">
          <div className="brand-block">
            <div className="brand-mark">
              <span className="project-logo" aria-hidden="true" />
            </div>
            <div className="brand-copy">
              <strong>Network Forensics Lab TA</strong>
              <span>Info Tech / ASU</span>
            </div>
          </div>

          <div className="sidebar-scroll">
            <SectionLabel>Labs</SectionLabel>
            <div className="lab-list">
              {labs.map((lab) => (
                <LabButton
                  key={lab.id}
                  lab={lab}
                  selected={selectedLabId === lab.id}
                  onClick={handleSelectLab}
                />
              ))}
            </div>

            {labSessions.length > 0 && (
              <>
                <SectionLabel>Recent chats</SectionLabel>
                <div className="session-list">
                  {labSessions.slice(0, 6).map((session) => (
                    <SessionButton
                      key={session.id}
                      session={session}
                      active={currentSession?.id === session.id}
                      onClick={setCurrentSessionId}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="sidebar-footer">
            <AccountMenu user={user} onSignOut={handleSignOut} />
            <div className="sidebar-meta-row">
              <span>Prof. John Lewis / ASU</span>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <button
          className="sidebar-toggle"
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <Menu size={16} /> : <PanelLeft size={16} />}
        </button>

        <LabHeader
          lab={selectedLab}
          notesOpen={notesOpen}
          onNewChat={handleNewChat}
          onClearChat={handleClearChat}
          onToggleNotes={() => setNotesOpen((open) => !open)}
        />

        <div className="messages" ref={messagesRef}>
          {messages.length === 0 && !loading ? (
            <EmptyState lab={selectedLab} onPrompt={handleSend} />
          ) : (
            <div className="message-stack">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {loading && <MessageBubble message={{ id: '__loading', role: 'assistant', loading: true }} />}
            </div>
          )}
        </div>

        <div className="composer-shell">
          <div className="composer-wrap">
            {pendingImages.length > 0 && (
              <PendingImageTray images={pendingImages} onRemove={handleRemovePendingImage} />
            )}

            <div
              className={`composer ${composerFocused ? 'is-focused' : ''} ${dropActive ? 'is-drop-active' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDropActive(true);
              }}
              onDragLeave={() => setDropActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDropActive(false);
                handleFiles(event.dataTransfer.files);
              }}
            >
              {user.avatarUrl ? (
                <img className="composer-avatar" src={user.avatarUrl} alt={user.name} />
              ) : (
                <div className="composer-avatar fallback">{userInitials}</div>
              )}

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onInput={handleTextareaInput}
                onKeyDown={handleTextareaKeyDown}
                onFocus={() => setComposerFocused(true)}
                onBlur={() => setComposerFocused(false)}
                placeholder={`Ask the Lab ${String(selectedLab.number).padStart(2, '0')} TA about tasks, tools, or evidence`}
                rows={1}
                disabled={loading}
              />

              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  handleFiles(event.target.files);
                  event.target.value = '';
                }}
              />

              <IconButton
                label="Attach images"
                disabled={loading || pendingImages.length >= IMAGE_LIMIT}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={16} />
              </IconButton>

              <button className="send-button" type="button" disabled={!canSend} onClick={() => handleSend()}>
                {loading ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}
              </button>
            </div>

            <div className="composer-meta">
              <span>Enter to send / Shift+Enter for new line</span>
              <span className={pendingImages.length === IMAGE_LIMIT ? 'limit-hit' : ''}>
                {pendingImages.length}/{IMAGE_LIMIT} images
              </span>
            </div>
            {composerError && <div className="composer-error">{composerError}</div>}
          </div>
        </div>

        {notesOpen && <NotesPanel lab={selectedLab} onClose={() => setNotesOpen(false)} />}
      </main>
    </div>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="auth-screen">
      <DotGrid />
      <div className="auth-loading">
        <span className="brand-mark">
          <span className="project-logo" aria-hidden="true" />
        </span>
        <LoaderCircle size={18} className="spin" />
        <span>Checking GitHub session</span>
      </div>
    </div>
  );
}

function AuthScreen({ onSignIn, error, supabaseReady }) {
  const [status, setStatus] = useState('idle');
  const handleGitHubSignIn = async () => {
    setStatus('loading');
    await onSignIn();
    setStatus('idle');
  };

  return (
    <div className="auth-screen">
      <DotGrid />
      <section className="auth-card" aria-label="Sign in">
        <div className="auth-banner">
          <div className="brand-mark large">
            <span className="project-logo" aria-hidden="true" />
          </div>
          <div>
            <strong>Information Technology, Arizona State University</strong>
            <span>Network Forensics Lab Teaching Assistant</span>
          </div>
        </div>

        <div className="auth-body">
          <div className="auth-heading">
            <h1>Sign in with GitHub</h1>
            <p>Use your GitHub account to access your lab teaching assistant workspace.</p>
          </div>

          <div className="github-icon">
            <Github size={30} />
          </div>

          <div className="auth-provider-note">
            Supabase Auth will redirect you to GitHub, then return you to this application.
          </div>

          {error && <div className="field-error">{error}</div>}
          {!supabaseReady && <div className="field-error">Missing Supabase URL or anon key for this build.</div>}

          <button
            className="primary-button full"
            type="button"
            disabled={status === 'loading' || !supabaseReady}
            onClick={handleGitHubSignIn}
          >
            {status === 'loading' ? <LoaderCircle size={16} className="spin" /> : <Github size={16} />}
            {status === 'loading' ? 'Opening GitHub' : 'Continue with GitHub'}
          </button>

          <div className="auth-footer">
            Course instructor: Prof. John Lewis
            <br />
            Information Technology, Arizona State University
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div className="section-label">{children}</div>;
}

function LabButton({ lab, selected, onClick }) {
  return (
    <button
      className={`lab-button ${selected ? 'is-selected' : ''}`}
      type="button"
      style={{ '--lab-color': lab.color }}
      onClick={() => onClick(lab.id)}
    >
      <span className="lab-button-top">
        <span>Lab {String(lab.number).padStart(2, '0')}</span>
        <LabBadge domain={lab.domain} color={lab.color} small />
      </span>
      <strong>{lab.title}</strong>
    </button>
  );
}

function LabBadge({ domain, color, small = false }) {
  return (
    <span className={`lab-badge ${small ? 'small' : ''}`} style={{ '--lab-color': color }}>
      {domain}
    </span>
  );
}

function SessionButton({ session, active, onClick }) {
  return (
    <button
      className={`session-button ${active ? 'is-active' : ''}`}
      type="button"
      onClick={() => onClick(session.id)}
    >
      {session.title || 'New chat'}
    </button>
  );
}

function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="account-menu" ref={menuRef}>
      <button className="account-button" type="button" onClick={() => setOpen((value) => !value)}>
        {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} /> : <span>{initials}</span>}
        <span className="account-copy">
          <strong>{user.name}</strong>
          <small>{user.githubUsername ? `@${user.githubUsername}` : 'Student'}</small>
        </span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="account-popover">
          <div className="account-popover-meta">
            <strong>{user.githubUsername ? `@${user.githubUsername}` : user.name}</strong>
            <span>Information Technology, Arizona State University</span>
          </div>
          <button type="button" onClick={onSignOut}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button className="theme-toggle" type="button" onClick={onToggle}>
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}

function LabHeader({ lab, notesOpen, onNewChat, onClearChat, onToggleNotes }) {
  return (
    <header className="lab-header">
      <div className="lab-title-block">
        <div>
          <span>Lab {String(lab.number).padStart(2, '0')}</span>
          <LabBadge domain={lab.domain} color={lab.color} />
        </div>
        <h2>{lab.title}</h2>
      </div>

      <div className="header-actions">
        <HeaderButton active={notesOpen} onClick={onToggleNotes}>
          <NotebookPen size={15} />
          Notes
        </HeaderButton>
        <HeaderButton onClick={onNewChat}>
          <Plus size={15} />
          New chat
        </HeaderButton>
        <HeaderButton onClick={onClearChat}>
          <Trash2 size={15} />
          Clear
        </HeaderButton>
      </div>
    </header>
  );
}

function HeaderButton({ children, active = false, onClick }) {
  return (
    <button className={`header-button ${active ? 'is-active' : ''}`} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function EmptyState({ lab, onPrompt }) {
  const tasks = (lab.tasks || []).slice(0, 4);
  return (
    <div className="empty-state">
      <section className="lab-brief" style={{ '--lab-color': lab.color }}>
        <div className="lab-brief-icon">
          <BookOpenText size={22} />
        </div>
        <div className="lab-brief-copy">
          <span>Teaching Assistant / Lab {String(lab.number).padStart(2, '0')}</span>
          <h1>{lab.domain}</h1>
          <p>{lab.shortDescription}</p>
        </div>
      </section>

      <section className="tool-strip" aria-label="Lab tools">
        {lab.tools.slice(0, 8).map((tool) => (
          <span key={tool}>{tool}</span>
        ))}
      </section>

      <section className="starter-grid" aria-label="Starter prompts">
        {(lab.starterPrompts || []).slice(0, 6).map((prompt) => (
          <button key={prompt} type="button" onClick={() => onPrompt(prompt)}>
            <Sparkles size={14} />
            <span>{prompt}</span>
          </button>
        ))}
      </section>

      <section className="task-preview" aria-label="Lab tasks">
        {tasks.map((task) => (
          <article key={task.id}>
            <span>{task.id.split('.').pop().replaceAll('_', ' ')}</span>
            <strong>{task.taskSummary}</strong>
          </article>
        ))}
      </section>

      <div className="guardrail">
        <AlertTriangle size={15} />
        <span>
          This TA will guide the process and interpretation, but it will not invent evidence values from a lab
          environment.
        </span>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message-row ${isUser ? 'from-user' : 'from-assistant'}`}>
      <div className="message-avatar">{isUser ? 'you' : 'ta'}</div>
      <div className="message-bubble">
        {message.loading ? (
          <div className="typing-dots">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <>
            {message.content ? <FormattedMessage content={message.content} /> : <div>Attached evidence images</div>}
            {message.attachments?.length > 0 && <ImageGrid images={message.attachments} />}
          </>
        )}
      </div>
    </div>
  );
}

function FormattedMessage({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let codeLines = [];
  let inCode = false;

  const formatInline = (text) => {
    const pattern = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
    const parts = [];
    let match;
    let last = 0;
    let key = 0;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > last) parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
      if (match[0].startsWith('**')) {
        parts.push(<strong key={key++}>{match[2]}</strong>);
      } else {
        parts.push(<code key={key++}>{match[3]}</code>);
      }
      last = match.index + match[0].length;
    }

    if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
    return parts.length ? parts : text;
  };

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        inCode = false;
        elements.push(
          <pre key={`code-${index}`}>
            <code>{codeLines.join('\n')}</code>
          </pre>,
        );
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (!line.trim()) {
      elements.push(<div className="message-spacer" key={index} />);
      return;
    }

    if (/^\d+\.\s/.test(line)) {
      const [, number] = line.match(/^(\d+)\./);
      elements.push(
        <div className="number-line" key={index}>
          <span>{number}.</span>
          <p>{formatInline(line.replace(/^\d+\.\s/, ''))}</p>
        </div>,
      );
      return;
    }

    if (/^[-*]\s/.test(line)) {
      elements.push(
        <div className="bullet-line" key={index}>
          <span />
          <p>{formatInline(line.replace(/^[-*]\s/, ''))}</p>
        </div>,
      );
      return;
    }

    if (/^\*\*(.+)\*\*$/.test(line)) {
      elements.push(
        <h3 key={index}>
          {line.replace(/^\*\*/, '').replace(/\*\*$/, '')}
        </h3>,
      );
      return;
    }

    elements.push(<p key={index}>{formatInline(line)}</p>);
  });

  return <div className="formatted-message">{elements}</div>;
}

function PendingImageTray({ images, onRemove }) {
  return (
    <div className="pending-tray" aria-label="Pending image attachments">
      {images.map((image) => (
        <div className="pending-image" key={image.id}>
          <img src={image.url} alt={image.name} />
          <div>
            <strong>{image.name}</strong>
            <span>{formatBytes(image.size)}</span>
          </div>
          <button type="button" aria-label={`Remove ${image.name}`} onClick={() => onRemove(image.id)}>
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ImageGrid({ images }) {
  return (
    <div className="image-grid">
      {images.map((image) => (
        <a href={image.url} target="_blank" rel="noreferrer" key={image.id} className="image-card">
          <img src={image.url} alt={image.name} />
          <span>{image.name}</span>
        </a>
      ))}
    </div>
  );
}

function IconButton({ children, label, disabled, onClick }) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function NotesPanel({ lab, onClose }) {
  const storageKey = `nfta_notes_${lab.id}`;
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || '';
    } catch {
      return '';
    }
  });
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);

  const updateText = (value) => {
    setText(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, value);
      } catch {}
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    }, 450);
  };

  const clearNotes = () => {
    if (!text || !window.confirm('Clear all notes for this lab?')) return;
    setText('');
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="notes-layer">
      <button className="notes-backdrop" type="button" aria-label="Close notes" onClick={onClose} />
      <aside className="notes-panel">
        <header>
          <div>
            <strong>
              <NotebookPen size={16} />
              Lab {String(lab.number).padStart(2, '0')} Notes
            </strong>
            <span>{lab.domain} / auto-saved locally</span>
          </div>
          <div className="notes-actions">
            <IconButton label="Clear notes" onClick={clearNotes}>
              <Trash2 size={14} />
            </IconButton>
            <IconButton label="Close notes" onClick={onClose}>
              <X size={14} />
            </IconButton>
          </div>
        </header>

        <textarea
          value={text}
          onChange={(event) => updateText(event.target.value)}
          placeholder={`Take notes for Lab ${lab.number}\n\nKey concepts\nTool navigation steps\nEvidence values found\nQuestions to ask`}
        />

        <footer>
          <span>
            {wordCount} word{wordCount === 1 ? '' : 's'}
          </span>
          <span className={saved ? 'is-visible' : ''}>Saved</span>
        </footer>
      </aside>
    </div>
  );
}

export default App;
