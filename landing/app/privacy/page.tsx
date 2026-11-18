import type { Metadata } from 'next';
import LegalBar from '../components/LegalBar';
import { LEGAL as POLICY } from '../legal';

// The privacy policy, served at /privacy (nginx maps /privacy to privacy.html). This is the URL to
// paste into the store dashboards. The text mirrors ui/PRIVACY.md: change both together.
// Placeholders (operator, contact e-mail...) live in app/legal.ts.

export const metadata: Metadata = {
  title: 'Privacy policy: WatchParty Sync',
  description: 'What the WatchParty Sync extension and service collect, why, and how to have it deleted.',
  alternates: { canonical: '/privacy' },
};

/** Rows of the "What is collected" table: [data, why, when]. */
const collected: [string, string, string][] = [
  ['E-mail address and display name', 'To sign you in and to show other people in a room who you are', 'When you create an account'],
  ['Password', 'To sign you in. It is stored only as a one-way hash; nobody can read it back', 'When you create an account'],
  ['Page URL, a CSS selector for the chosen video, and the room name', "So other people's players can open and attach to the same video", 'Only when you create a room or change its video'],
  ['Playback state (playing or paused, position, speed)', 'To keep viewers in sync with the host', 'While you host a room'],
  ["Presence (that you're in a room, when you joined, a heartbeat every few seconds)", 'To show who is watching, and to pass hosting on when someone leaves', "While you're in a room"],
  ['Chat messages', 'The room chat', 'When you send a message. Stored encrypted (see below)'],
  ["Your room history: rooms you've joined, favourites, and how far you've read each chat", 'So the dashboard can list your rooms and show unread messages on all your devices', 'When you join a room, star one, or read its chat'],
];

/** Rows of the service providers table: [provider, what it receives, why]. */
const providers: [string, string, string][] = [
  [POLICY.hostingProvider, 'All of the data above, as the host of the server', 'Running the service'],
  [POLICY.databaseProvider, 'All of the data above, as the database host', 'Storing the data'],
  ['Sentry (sentry.io)', 'Details of server errors, which can include the request path and your user id', 'Fixing bugs'],
  [POLICY.telemetryBackend, 'Timings and metadata of requests, which can include the request path', 'Keeping the service fast and available'],
];

function Table({ head, rows }: { head: [string, string, string]; rows: [string, string, string][] }) {
  return (
    <div className="legal__table">
      <table>
        <thead>
          <tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Privacy() {
  const mail = <a href={`mailto:${POLICY.contactEmail}`}>{POLICY.contactEmail}</a>;

  return (
    <>
      <LegalBar />

      <main className="wrap legal">
        <h1>Privacy policy</h1>
        <p className="legal__date">Last updated: {POLICY.lastUpdated}</p>

        <h2>What this extension does</h2>
        <p>
          WatchParty Sync lets a group watch the same web page video together. It keeps everyone&apos;s playback in
          step and gives the room a chat. To do that it uses the WatchParty service, a server operated
          by <strong>{POLICY.operator}</strong> at <strong>{POLICY.apiDomain}</strong>.
        </p>

        <h2>What is collected, and why</h2>
        <Table head={['Data', 'Why', 'When']} rows={collected} />
        <p>
          Your browser also keeps some data locally, and none of it is sent anywhere except as described above: your
          sign-in session, the room you are currently in, your settings, and, for private rooms only, the room
          passphrase. The passphrase is held in session storage, which the browser clears when it closes.
        </p>
        <p>
          The server also briefly keeps your IP address in memory to apply rate limits against password guessing and
          abuse. Its request logs record the request method and path (for
          example <code>PUT /api/v1/rooms/&lt;room id&gt;/playback</code>) and the response status. They do not include
          page URLs, chat content or your sign-in token.
        </p>

        <h2>What is not collected</h2>
        <ul>
          <li>No browsing history. A page URL is recorded <strong>only</strong> for a page on which you deliberately create a room.</li>
          <li>No page content, form data, keystrokes or passwords for other sites.</li>
          <li>No analytics, advertising identifiers or third-party trackers in the extension.</li>
          <li>Nothing at all on pages where you have not started or joined a room.</li>
        </ul>

        <h2>Chat encryption</h2>
        <p>
          Chat messages are encrypted in your browser with AES-GCM before they are sent. The server stores and relays
          only the encrypted form.
        </p>
        <ul>
          <li>
            <strong>Public rooms:</strong> the encryption key is stored with the room, so anyone who can join the room
            can read its chat. The message text is not readable by looking at the database alone, but someone with full
            database access could use the stored key to decrypt it.
          </li>
          <li>
            <strong>Private rooms:</strong> the key is derived from a passphrase with PBKDF2 in your browser. The
            passphrase and the key are never sent to the server, so nobody without the passphrase can read the
            messages, including the operator. If the passphrase is lost, that room&apos;s messages cannot be recovered.
          </li>
        </ul>

        <h2>Who can see what</h2>
        <ul>
          <li>People in the same room see your display name, whether you are the host, and (with the key) your chat messages.</li>
          <li>The room list shows every room&apos;s name, page URL, host&apos;s display name and whether it is live, to every signed-in user.</li>
          <li>Your history, favourites and read positions are visible only to you.</li>
          <li>Your e-mail address is never shown to other users.</li>
        </ul>

        <h2>Sharing and service providers</h2>
        <p>
          Your data is never sold, and it is not shared with third parties for advertising or any purpose unrelated to
          the extension. It is stored in a Postgres database at <strong>{POLICY.database}</strong>.
        </p>
        <p>The operator uses these service providers to run the service:</p>
        <Table head={['Provider', 'What it receives', 'Why']} rows={providers} />

        <h2>Retention and deletion</h2>
        <p>
          Accounts, rooms, presence records, chat messages and history are kept until they are deleted. Presence
          records are removed automatically about ten seconds after you stop sending heartbeats. You can remove any
          room from your own history at any time from the dashboard.
        </p>
        <p>
          To have your account and everything linked to it deleted, e-mail {mail} from the address on the account.
          Deletion is completed within <strong>30 days</strong>.
        </p>

        <h2>Permissions</h2>
        <p>
          The extension asks for access to all websites because you choose which page to watch at the moment you create
          a room, and that page cannot be known in advance. On pages where you have not started or joined a room, the
          extension does nothing.
        </p>

        <p>
          The rules for using the service, including what happens to accounts that break them, are in
          the <a href="/terms">Terms of Service</a>.
        </p>

        <h2>Children</h2>
        <p>The service is not directed at children under 13, and does not knowingly collect their data.</p>

        <h2>Changes</h2>
        <p>If this policy changes, the new version will be posted at this address with a new &quot;Last updated&quot; date.</p>

        <h2>Contact</h2>
        <p>Questions about this policy or your data: {mail}</p>
      </main>
    </>
  );
}
