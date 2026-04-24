const MINIMAX_CHAT_URL = 'https://api.minimax.io/v1/chat/completions';
const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'MiniMax-M2.7';
const DEFAULT_OPENROUTER_IMAGE_MODEL = 'google/veo-3.1-fast';

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

function asText(value) {
  return typeof value === 'string' ? value : '';
}

function hasUsableImage(image) {
  const url = asText(image?.url);
  return url.startsWith('data:image/') || url.startsWith('https://') || url.startsWith('http://');
}

function messageWithAttachments(message) {
  const content = asText(message.content);
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];

  if (!attachments.length) return content;

  const imageList = attachments
    .slice(0, 5)
    .map((image, index) => {
      const name = asText(image.name) || `image-${index + 1}`;
      const type = asText(image.type) || 'image';
      return `- ${name} (${type})`;
    })
    .join('\n');

  return [
    content || 'The student attached evidence images.',
    '',
    'Attached images are available in the UI, but this text model request only includes their metadata:',
    imageList,
  ].join('\n');
}

function hasMessageContent(content) {
  if (typeof content === 'string') return content.trim().length > 0;
  return Array.isArray(content) && content.length > 0;
}

function normalizeMessages(messages) {
  const normalized = (Array.isArray(messages) ? messages : [])
    .map((message) => {
      const role = ['system', 'user', 'assistant'].includes(message?.role) ? message.role : 'user';
      return {
        role,
        content: messageWithAttachments({ ...(message || {}), role }),
      };
    })
    .filter((message) => hasMessageContent(message.content));

  const systemMessage = normalized.find((message) => message.role === 'system');
  const conversation = normalized.filter((message) => message !== systemMessage);

  return systemMessage ? [systemMessage, ...conversation.slice(-23)] : conversation.slice(-24);
}

function messagesHaveImages(messages) {
  return (Array.isArray(messages) ? messages : []).some((message) =>
    Array.isArray(message?.attachments) && message.attachments.some(hasUsableImage),
  );
}

function latestMessageWithImages(messages) {
  return [...(Array.isArray(messages) ? messages : [])]
    .reverse()
    .find((message) => Array.isArray(message?.attachments) && message.attachments.some(hasUsableImage));
}

function openRouterHeaders(apiKey) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (process.env.OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  }

  headers['X-OpenRouter-Title'] = process.env.OPENROUTER_APP_NAME || 'Network Forensics Lab TA';
  return headers;
}

function openRouterImageContent(message) {
  const images = (Array.isArray(message?.attachments) ? message.attachments : [])
    .filter(hasUsableImage)
    .slice(0, 5);
  const imageList = images
    .map((image, index) => `${index + 1}. ${asText(image.name) || `image-${index + 1}`} (${asText(image.type) || 'image'})`)
    .join('\n');

  return [
    {
      type: 'text',
      text: [
        'Analyze these uploaded screenshots or evidence images for a digital forensics lab assistant.',
        'Extract only visible information. Look for tool names, panes, selected artifacts, filenames, hashes, IP addresses, timestamps, usernames, email fields, browser entries, registry paths, command output, warning/error text, and any visible evidence values.',
        'If a value is unclear or unreadable, say it is unreadable. Do not invent values.',
        '',
        message?.content ? `Student question: ${message.content}` : 'Student question: image-only evidence request.',
        '',
        `Images:\n${imageList}`,
      ].join('\n'),
    },
    ...images.map((image) => ({
      type: 'image_url',
      image_url: {
        url: image.url,
      },
    })),
  ];
}

async function analyzeImagesWithOpenRouter(sourceMessages) {
  const message = latestMessageWithImages(sourceMessages);
  if (!message) return '';

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured for image analysis.');
  }

  const model = process.env.OPENROUTER_IMAGE_MODEL || DEFAULT_OPENROUTER_IMAGE_MODEL;
  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: openRouterImageContent(message),
        },
      ],
      temperature: 0.1,
      max_tokens: 900,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`OpenRouter image analysis failed: ${errorMessage(data) || `status ${response.status}`}`);
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenRouter returned an empty image analysis.');
  }

  return [
    `Image analysis model: ${data.model || model}`,
    content,
  ].join('\n');
}

function appendImageAnalysis(messages, imageAnalysis) {
  if (!imageAnalysis) return messages;

  const nextMessages = (Array.isArray(messages) ? messages : []).map((message) => ({ ...message }));
  const systemIndex = nextMessages.findIndex((message) => message.role === 'system');
  const context = [
    'OpenRouter image analysis for the latest student attachments:',
    imageAnalysis,
    '',
    'Use this image analysis as observed evidence. Do not invent details that are not present in the analysis or the student text.',
  ].join('\n');

  if (systemIndex >= 0) {
    nextMessages[systemIndex].content = [asText(nextMessages[systemIndex].content), context]
      .filter(Boolean)
      .join('\n\n');
    return nextMessages;
  }

  return [{ role: 'system', content: context }, ...nextMessages];
}

function errorMessage(error) {
  if (!error) return 'Unknown MiniMax error';
  if (typeof error === 'string') return error;
  return error.base_resp?.status_msg || error.error?.message || error.message || JSON.stringify(error);
}

async function verifySupabaseUser(req) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return true;

  const authorization = req.headers.authorization || req.headers.Authorization || '';
  if (!authorization.startsWith('Bearer ')) return false;

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: supabaseAnonKey,
    },
  });

  return response.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const isAuthorized = await verifySupabaseUser(req).catch(() => false);
  if (!isAuthorized) {
    res.status(401).json({ error: 'Authentication is required.' });
    return;
  }

  const apiKey = process.env.MINIMAX_API_KEY || process.env.MINIMAX_TOKEN_PLAN_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'MiniMax API key is not configured.' });
    return;
  }

  let body;
  try {
    body = parseBody(req);
  } catch {
    res.status(400).json({ error: 'Invalid JSON request body.' });
    return;
  }

  const callMiniMax = async (chatMessages) => {
    const response = await fetch(MINIMAX_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.MINIMAX_MODEL || DEFAULT_MODEL,
        messages: chatMessages,
        temperature: 0.4,
        top_p: 0.9,
        max_completion_tokens: 1200,
      }),
    });

    const data = await response.json().catch(() => null);
    return { response, data };
  };

  try {
    let sourceMessages = body.messages;
    if (messagesHaveImages(sourceMessages)) {
      const imageAnalysis = await analyzeImagesWithOpenRouter(sourceMessages);
      sourceMessages = appendImageAnalysis(sourceMessages, imageAnalysis);
    }

    const messages = normalizeMessages(sourceMessages);
    if (!messages.length) {
      res.status(400).json({ error: 'At least one chat message is required.' });
      return;
    }

    const { response, data } = await callMiniMax(messages);

    if (!response.ok || data?.base_resp?.status_code) {
      res.status(response.ok ? 502 : response.status).json({
        error: errorMessage(data) || `MiniMax request failed with status ${response.status}.`,
      });
      return;
    }

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      res.status(502).json({ error: 'MiniMax returned an empty response.' });
      return;
    }

    res.status(200).json({
      content,
      model: data.model,
      usage: data.usage || null,
    });
  } catch (error) {
    res.status(502).json({ error: errorMessage(error) });
  }
}
