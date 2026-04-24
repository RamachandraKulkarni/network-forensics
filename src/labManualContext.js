const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'because',
  'before',
  'between',
  'could',
  'does',
  'from',
  'have',
  'into',
  'that',
  'their',
  'there',
  'these',
  'this',
  'what',
  'when',
  'where',
  'which',
  'with',
  'would',
  'your',
]);

export const LAB_MANUAL_CONTEXT = {
  lab01: {
    source: 'Applying the Daubert Standard to Forensic Evidence (4e), Lab 01',
    objectives: [
      'Prepare evidence for court and complete evidence handling forms.',
      'Explain how admissibility is evaluated under the Daubert standard.',
      'Import drive images into forensic tools and identify suspicious files.',
      'Create and verify hash codes for evidence integrity.',
    ],
    flow: [
      'Section 1: complete chain of custody procedures, extract evidence files with FTK Imager, verify hash codes with E3.',
      'Section 2: locate suspicious email evidence, alter a sample copy to demonstrate hash changes, and validate hashes with Autopsy.',
      'Section 3: verify MD5 and SHA-1 from the command line and locate additional evidence in another drive image.',
    ],
    evidenceGuidance: [
      'Tie every evidence item to legal authority, custody handling, tool used, and integrity verification.',
      'Use Daubert as an analysis framework: testability, peer review, error rate, standards, and acceptance.',
      'Never invent hash values; explain where the student should read MD5 and SHA-1 in the tool output.',
    ],
    snippets: [
      'Chain of custody questions should focus on who handled the item, when, where it was stored, seal condition, and whether any custody gaps exist.',
      'Hash questions should distinguish the original evidence image from exported or altered copies; a one-bit change creates a different hash.',
      'FTK Imager, E3, Autopsy, and command-line hashing are used to compare evidence integrity across tools.',
      'Daubert analysis should connect the forensic method and tool to reliability, not simply state that the evidence is admissible.',
    ],
  },
  lab02: {
    source: 'Recognizing the Use of Steganography in Forensic Evidence (4e), Lab 02',
    objectives: [
      'Use hash searches to detect steganography software on an evidence drive.',
      'Search for hidden data in image and audio files.',
      'Extract hidden payloads while preserving evidence integrity.',
      'Report the carrier file, extraction method, key material, and relevance of the hidden content.',
    ],
    flow: [
      'Section 1: detect steganography software, detect hidden image data, and extract hidden image data.',
      'Section 2: repeat detection and extraction with different steganography tools and image/audio formats.',
      'Section 3: use StegExpose and OpenStego to detect and extract additional hidden data.',
    ],
    evidenceGuidance: [
      'Separate the carrier file from the extracted payload in every explanation.',
      'Document the detection tool, extraction tool, passphrase or cipher key, output filename, and content relevance.',
      'Do not rely on visual inspection; steganography is designed to be hidden from ordinary viewing.',
    ],
    snippets: [
      'Questions about image files should cover carrier identification, StegExpose-style detection, and extraction with the correct tool and key.',
      'Questions about audio files should point students toward audio-capable steganography tools and a separate extracted payload record.',
      'If the student asks whether a file contains hidden data, require tool output or a screenshot before making a conclusion.',
      'A complete finding names the carrier, the hidden payload, how it was recovered, and why it matters to the case.',
    ],
  },
  lab03: {
    source: 'Recovering Deleted and Damaged Files (4e), Lab 03',
    objectives: [
      'Explain how files are deleted and recovered.',
      'Recover deleted files from NTFS, Ext4, FAT, and APFS images.',
      'Use carving methods when file system metadata is missing or damaged.',
      'Recover deleted files from live Windows and Linux systems.',
    ],
    flow: [
      'Section 1: recover deleted files from NTFS with E3 and Ext4 with Autopsy.',
      'Section 2: use PhotoRec on Linux to carve files from damaged or inaccessible media.',
      'Section 3: recover additional evidence from FAT32 and APFS drive images.',
    ],
    evidenceGuidance: [
      'Distinguish metadata-based recovery from file carving based on signatures or magic numbers.',
      'Explain that carved files may lose original names and paths because metadata is unavailable.',
      'Warn students to work from forensic copies and avoid repairing or modifying original evidence.',
    ],
    snippets: [
      'NTFS and Ext4 recovery questions should focus on deleted flags, original paths, timestamps, and whether content is still recoverable.',
      'PhotoRec questions should explain carving by headers and footers, generic output filenames, and recovered file type counts.',
      'Damaged partition questions should preserve the exact tool error and use it as evidence of corruption or tampering.',
      'Archive recovery questions should document repair output, CRC errors, partial recovery, and evidentiary value of recovered files.',
    ],
  },
  lab04: {
    source: 'Conducting an Incident Response Investigation (4e), Lab 04',
    objectives: [
      'Perform forensic analysis as part of an incident response investigation.',
      'Analyze PCAP evidence with NetWitness Investigator.',
      'Analyze disk-image evidence with Paraben E3.',
      'Correlate multiple evidence sources and produce an incident response report.',
    ],
    flow: [
      'Section 1: analyze PCAP evidence, analyze disk-image evidence, and prepare an initial incident response report.',
      'Section 2: identify additional email evidence, identify spyware evidence, and update the report.',
      'Section 3: identify additional exfiltration and spyware evidence from email, attachments, and scheduled-task artifacts.',
    ],
    evidenceGuidance: [
      'Separate incident discovery time from occurrence time.',
      'Correlate PCAP sessions, email artifacts, registry or scheduled-task entries, and report severity changes.',
      'Use cautious language: evidence suggests, indicates, or is consistent with; do not overstate unsupported conclusions.',
    ],
    snippets: [
      'PCAP questions should guide the student to protocol, source, destination, timestamp, session reconstruction, and transferred data.',
      'Spyware questions should focus on suspicious email, installation evidence, persistence mechanism, author, and scheduled-task date.',
      'Report questions should include incident type, discovery, estimated occurrence, scope, affected users, affected systems, evidence, timeline, and recommendations.',
      'If a keylogger or spyware is found, explain why the incident priority and affected-credential scope may need to be updated.',
    ],
  },
  lab05: {
    source: 'Conducting Forensic Investigations on Windows Systems (4e), Lab 05',
    objectives: [
      'Use Windows utilities to gather evidence from a live system.',
      'Use the Windows Registry to gather evidence from a live system.',
      'Use E3 to explore NTFS and analyze Windows registry artifacts.',
      'Analyze link files, browser history, and other Windows artifacts.',
    ],
    flow: [
      'Section 1: gather basic system information and explore the registry.',
      'Section 2: create and sort an E3 case file, then analyze a Windows drive image.',
      'Section 3: use advanced search to locate additional evidence and identify suspicious browser activity.',
    ],
    evidenceGuidance: [
      'Tie live-system observations to process name, PID, port, path, registry key, or artifact source.',
      'For registry answers, include the full hive/path/value and explain what activity it supports.',
      'For browser or link-file evidence, distinguish user activity from mere file existence.',
    ],
    snippets: [
      'Process and port questions should correlate Resource Monitor, netstat, tasklist, PID, process name, and connection state.',
      'Registry questions should distinguish HKLM from HKCU and explain persistence, login, MRU, or application evidence.',
      'E3 drive-image questions should guide students through content analysis, user profile folders, downloads, link files, and browser history.',
      'Advanced search questions should use the search location, word list or query, whole-word setting, result file, and document-view evidence.',
    ],
  },
  lab06: {
    source: 'Conducting Forensic Investigations on Linux Systems (4e), Lab 06',
    objectives: [
      'Identify key Linux directories and their forensic purpose.',
      'Use basic shell commands during forensic investigations.',
      'Retrieve log files on a live Linux system.',
      'Retrieve evidence from a Linux disk image and locate critical log files.',
    ],
    flow: [
      'Section 1: explore a live Linux system, use shell commands, and retrieve logs.',
      'Section 2: identify login attempts, software installations, and external drive attachments on a Linux drive image.',
      'Section 3: identify recently printed files and evidence that disk imaging commands were run.',
    ],
    evidenceGuidance: [
      'Anchor answers to exact Linux paths, command output, usernames, timestamps, and log filenames.',
      'Separate live-system command collection from postmortem image analysis in E3.',
      'Do not infer compromise from one log line; correlate login, package, USB, print, or command history evidence.',
    ],
    snippets: [
      'Login questions should focus on auth logs, accepted or failed sessions, usernames, source addresses, and timing.',
      'Software installation questions should guide students to package logs and explain what installation/removal entries prove.',
      'External drive questions should connect kernel/syslog USB events to timestamps, device identifiers, and possible exfiltration.',
      'dd command questions should explain command syntax, likely log or shell-history locations, and why disk imaging matters.',
    ],
  },
  lab07: {
    source: 'Conducting Forensic Investigations on Email and Chat Logs (4e), Lab 07',
    objectives: [
      'Navigate Outlook and Thunderbird email database structures.',
      'Read and interpret email headers.',
      'Use E3 Content Analysis to sort attachments.',
      'Use E3 Advanced Search and inspect Slack or Discord chat databases.',
    ],
    flow: [
      'Section 1: analyze headers, search Outlook evidence, and search Slack evidence.',
      'Section 2: import and search a Thunderbird database, then search Discord evidence.',
      'Section 3: search for additional Outlook email and chat evidence.',
    ],
    evidenceGuidance: [
      'Preserve sender, recipient, timestamp, subject, header fields, attachment names, and message content context.',
      'Explain the difference between display names and actual header addresses.',
      'For chat logs, identify platform, channel or conversation, participants, timestamp, and message content.',
    ],
    snippets: [
      'Header questions should guide students through From, Reply-To, Return-Path, Received lines, dates, and mismatch indicators.',
      'Attachment questions should use E3 attachment views, content analysis, filenames, file type, and relevance to the case.',
      'Search questions should specify the database, query terms or emoji, filter settings, and result thread.',
      'Chat questions should distinguish Slack and Discord database structures and require participant/timestamp context.',
    ],
  },
  lab08: {
    source: 'Conducting Forensic Investigations on Mobile Devices (4e), Lab 08',
    objectives: [
      'Identify evidence within iOS data cases.',
      'Identify evidence within Android data cases.',
      'Compare different data cases from the same device.',
      'Document evidence and draft formal case summary, findings, and conclusion sections.',
    ],
    flow: [
      'Section 1: identify iOS evidence and compare iOS data cases.',
      'Section 2: identify Android user data and Android application data.',
      'Section 3: research report-writing practices and draft a forensic report.',
    ],
    evidenceGuidance: [
      'For mobile evidence, always include platform, artifact category, account or app, timestamp, and what the artifact proves.',
      'Compare data cases carefully; differences can reflect extraction type, acquisition time, or available artifact scope.',
      'Report answers should separate case summary, findings and analysis, and conclusion.',
    ],
    snippets: [
      'iOS questions should focus on contacts, messages, calls, browser history, location or app artifacts, and where E3 displays them.',
      'Android questions should distinguish user data from app data and document contacts, browsing, messages, or app-specific artifacts.',
      'Comparison questions should explain why two acquisitions from the same device may expose different evidence.',
      'Report-writing questions should turn artifacts into findings without overstating unsupported intent.',
    ],
  },
  lab09: {
    source: 'Conducting Forensic Investigations on Network Infrastructure (4e), Lab 09',
    objectives: [
      'Capture and analyze packets with Wireshark.',
      'Analyze routers for forensic evidence.',
      'Examine firewall logs for forensic evidence.',
      'Identify suspicious network traffic.',
    ],
    flow: [
      'Section 1: perform packet capture and analysis, then analyze a router.',
      'Section 2: perform advanced packet analysis and examine firewall logs.',
      'Section 3: identify the source of a suspicious route and suspicious outgoing connections.',
    ],
    evidenceGuidance: [
      'Network findings should include source, destination, protocol, port, timestamp, direction, and why the traffic is suspicious.',
      'Router findings should distinguish learned routes from static/manual routes and explain how route origin was identified.',
      'Firewall findings should use exact log fields and connect them to a host, action, and time window.',
    ],
    snippets: [
      'Packet questions should guide students to capture filters, conversation tracking, protocol fields, and reconstructed transferred data.',
      'FTP questions should cover control channel commands, data channel transfer, credentials if visible, and file reconstruction.',
      'Route questions should include route table output, subnet mask specificity, next hop, origin, and whether a static route is suspected.',
      'Firewall questions should focus on pfSense logs, suspicious host addresses, blocked or allowed actions, and outbound connection patterns.',
    ],
  },
};

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function scoreText(text, tokens) {
  if (!tokens.length) return 0;
  const target = String(text || '').toLowerCase();
  return tokens.reduce((sum, token) => sum + (target.includes(token) ? 1 : 0), 0);
}

function listBlock(title, items) {
  if (!items?.length) return '';
  return `${title}\n${items.map((item) => `- ${item}`).join('\n')}`;
}

export function getLabManualContext(labId, query = '') {
  const manual = LAB_MANUAL_CONTEXT[labId];
  if (!manual) return '';

  const tokens = tokenize(query);
  const rankedSnippets = manual.snippets
    .map((snippet) => ({ snippet, score: scoreText(snippet, tokens) }))
    .sort((a, b) => b.score - a.score);
  const relevantSnippets = (tokens.length && rankedSnippets.some((item) => item.score > 0)
    ? rankedSnippets.filter((item) => item.score > 0).slice(0, 4)
    : rankedSnippets.slice(0, 3)
  ).map((item) => item.snippet);

  return [
    `Manual source: ${manual.source}`,
    listBlock('Manual objectives:', manual.objectives),
    listBlock('Manual flow:', manual.flow),
    listBlock('Evidence and reporting guidance:', manual.evidenceGuidance),
    listBlock('Relevant manual notes for this question:', relevantSnippets),
  ]
    .filter(Boolean)
    .join('\n\n');
}
